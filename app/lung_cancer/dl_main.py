import glob
import os
import copy
from pathlib import Path
from collections import namedtuple

import numpy as np
import SimpleITK as sitk
import scipy.ndimage.measurements as measurements
import scipy.ndimage.morphology as morphology

import torch
import torch.nn as nn
import torch.optim
from torch.utils.data import Dataset
from torch.utils.data import DataLoader

from app.lung_cancer.utils import models

from app.lung_cancer.utils.logconf import logging
from app.lung_cancer.utils.utilities import irc2xyz, XyzTuple, xyz2irc

import matplotlib.pyplot as plt

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

CandidateTuple = namedtuple(
    "CandidateTuple",
    "center_xyz",
)

Mal_Tup = namedtuple("Mal_Tup", "Nodule_Probability, Malignancy_Probability, XYZ_coordinates, IRC_coordinates")
Cls_Tup = namedtuple("Cls_Tup", "prob, prob_mal, center_xyz, center_irc")


class Ct:
    def __init__(self, image_data):

        ct_mhd = sitk.ReadImage(image_data)
        ct_arr = np.array(sitk.GetArrayFromImage(ct_mhd), dtype=np.float32)

        ct_arr.clip(-1000, 1000, ct_arr)
        self.hunits_arr = ct_arr

        self.origin_xyz = XyzTuple(*ct_mhd.GetOrigin())
        self.voxSize_xyz = XyzTuple(*ct_mhd.GetSpacing())
        self.direction_arr = np.array(ct_mhd.GetDirection()).reshape(3, 3)

    def buildAnnotationMask(self, positiveCand_list, threshold_hu=-700):

        boundingBox_arr = np.zeros_like(self.hunits_arr, dtype=np.int)

        for candidate_tuple in positiveCand_list:
            ci = int(candidate_tuple.center_irc.index)
            cr = int(candidate_tuple.center_irc.row)
            cc = int(candidate_tuple.center_irc.col)

            index_radius = 2
            try:
                while (
                    self.hunits_arr[ci + index_radius, cr, cc] > threshold_hu
                    and self.hunits_arr[ci - index_radius, cr, cc]
                    > threshold_hu
                ):
                    index_radius += 1
            except IndexError:
                index_radius -= 1

            row_radius = 2
            try:
                while (
                    self.hunits_arr[ci, cr + row_radius, cc] > threshold_hu
                    and self.hunits_arr[ci, cr - row_radius, cc] > threshold_hu
                ):
                    row_radius += 1
            except IndexError:
                row_radius -= 1

            col_radius = 2
            try:
                while (
                    self.hunits_arr[ci, cr, cc + col_radius] > threshold_hu
                    and self.hunits_arr[ci, cr, cc - col_radius] > threshold_hu
                ):
                    col_radius += 1
            except IndexError:
                col_radius -= 1

            boundingBox_arr[
                ci - index_radius : ci + index_radius + 1,
                cr - row_radius : cr + row_radius + 1,
                cc - col_radius : cc + col_radius + 1,
            ] = True

            # boundingBox_arr[
            #     ci - index_radius : ci + index_radius + 1,
            #     cr - row_radius : cr + row_radius + 1,
            #     cc - col_radius : cc + col_radius + 1,
            # ] = self.hunits_arr[
            #     ci - index_radius : ci + index_radius + 1,
            #     cr - row_radius : cr + row_radius + 1,
            #     cc - col_radius : cc + col_radius + 1,
            # ]

        mask_arr = boundingBox_arr & (self.hunits_arr > threshold_hu)

        return mask_arr
        # return boundingBox_arr

    def getCtChunk(self, center_xyz, width_irc):

        center_irc = xyz2irc(
            center_xyz,
            self.origin_xyz,
            self.voxSize_xyz,
            self.direction_arr,
        )

        slices = []
        for axis, center_val in enumerate(center_irc):
            start_index = int(round(center_val - width_irc[axis] / 2))
            end_index = int(start_index + width_irc[axis])

            assert (
                center_val >= 0 and center_val < self.hunits_arr.shape[axis]
            ), repr(
                [
                    center_xyz,
                    self.origin_xyz,
                    self.voxSize_xyz,
                    center_irc,
                    axis,
                ]
            )

            if start_index < 0:
                start_index = 0
                end_index = int(width_irc[axis])

            if end_index > self.hunits_arr.shape[axis]:
                end_index = self.hunits_arr.shape[axis]
                start_index = int(
                    self.hunits_arr.shape[axis] - width_irc[axis]
                )

            slices.append(slice(start_index, end_index))

        ct_chunk = self.hunits_arr[tuple(slices)]

        return ct_chunk, center_irc

    ########################################################################
    ###################### Classification Preprocessing ####################
    ########################################################################


class LunaDataset(Dataset):
    def __init__(self, ct, candidates_list):
        self.ct = ct
        self.candidates_list = copy.copy(candidates_list)

    def __len__(self):
        return len(self.candidates_list)

    def __getitem__(self, ndx):

        candidate_tuple = self.candidates_list[ndx]
        return self.sampleFromCandidate_tuple(candidate_tuple, self.ct)

    def sampleFromCandidate_tuple(self, candidate_tuple, ct):

        width_irc = (32, 48, 48)

        candidate_a, center_irc = ct.getCtChunk(
            candidate_tuple.center_xyz,
            width_irc,
        )
        candidate_t = torch.from_numpy(candidate_a).to(torch.float32)
        candidate_t = candidate_t.unsqueeze(0)

        return candidate_t, torch.tensor(center_irc)


#     ########################################################################
#     ###################### Segmentation Preprocessing ######################
#     ########################################################################


class Luna2dSegmentationDataset(Dataset):
    def __init__(
        self,
        ct,
        contextSlices_count=3,
    ):

        self.contextSlices_count = contextSlices_count
        self.sample_list = []

        index_count = int(ct.hunits_arr.shape[0])
        self.sample_list += [slice_ndx for slice_ndx in range(index_count)]
        self.ct = ct

    def __len__(self):
        return len(self.sample_list)

    def __getitem__(self, ndx):
        slice_ndx = self.sample_list[ndx % len(self.sample_list)]
        return self.getitem_fullSlice(self.ct, slice_ndx)

    def getitem_fullSlice(self, ct, slice_ndx):
        ct_tensor = torch.zeros((self.contextSlices_count * 2 + 1, 512, 512))

        start_ndx = slice_ndx - self.contextSlices_count
        end_ndx = slice_ndx + self.contextSlices_count + 1
        for i, context_ndx in enumerate(range(start_ndx, end_ndx)):
            context_ndx = max(context_ndx, 0)
            context_ndx = min(context_ndx, ct.hunits_arr.shape[0] - 1)
            ct_tensor[i] = torch.from_numpy(
                ct.hunits_arr[context_ndx].astype(np.float32)
            )

        ct_tensor.clamp_(-1000, 1000)

        return ct_tensor, slice_ndx


#     ########################################################################
#     ######################## Nodule Classification #########################
#     ########################################################################


class NoduleAnalysisApp:
    def __init__(self):

        ###############
        # Get paths of models for each use case
        ###############

        # self.use_cuda = torch.cuda.is_available()
        self.use_cuda = False
        self.device = torch.device("cuda" if self.use_cuda else "cpu")

        self.segmentation_path = os.path.join(
            BASE_DIR, "lung_cancer", "models", "mask_segmentation.state"
        )
        self.classification_path = os.path.join(
            BASE_DIR, "lung_cancer", "models", "cls_final-nodule-nonnodule.best.state"
        )
        self.malignancy_path = os.path.join(
            BASE_DIR,
            "lung_cancer",
            "models",
            "malignancy_classification.state",
        )

        (
            self.seg_model,
            self.cls_model,
            self.malignancy_model,
        ) = self.initModels()

    ###############
    # Read models and return as objects
    ###############

    def initModels(self):
        seg_dict = torch.load(self.segmentation_path)
        seg_model = models.UNetWrapper(
            in_channels=7,
            n_classes=1,
            depth=3,
            wf=4,
            padding=True,
            batch_norm=True,
            up_mode="upconv",
        )
        seg_model.load_state_dict(seg_dict["model_state"])
        seg_model.eval()

        cls_dict = torch.load(self.classification_path)
        model_cls = models.LunaModel
        cls_model = model_cls()
        cls_model.load_state_dict(cls_dict["model_state"])
        cls_model.eval()

        malignancy_model = model_cls()
        malignancy_dict = torch.load(self.malignancy_path)
        malignancy_model.load_state_dict(malignancy_dict["model_state"])
        malignancy_model.eval()

        if self.use_cuda:
            if torch.cuda.device_count() > 1:
                seg_model = nn.DataParallel(seg_model)
                cls_model = nn.DataParallel(cls_model)

            seg_model.to(self.device)
            cls_model.to(self.device)
            malignancy_model.to(self.device)

        return seg_model, cls_model, malignancy_model

    ########################################################################
    ###################### Segmentation Stuff ##############################
    ########################################################################

    def initSegmentationDl(self, ct):
        seg_ds = Luna2dSegmentationDataset(
            ct,
            contextSlices_count=3,
        )
        seg_dl = DataLoader(
            seg_ds,
            batch_size=(torch.cuda.device_count() if self.use_cuda else 1),
            num_workers=4,
            pin_memory=self.use_cuda,
        )
        return seg_dl

    def segmentCt(self, ct):
        with torch.no_grad():
            output_a = np.zeros_like(ct.hunits_arr, dtype=np.float32)
            seg_dl = self.initSegmentationDl(ct)  #  <3>
            for input_t, slice_ndx_list in seg_dl:

                input_g = input_t.to(self.device)
                prediction_g = self.seg_model(input_g)

                for i, slice_ndx in enumerate(slice_ndx_list):
                    output_a[slice_ndx] = prediction_g[i].cpu().numpy()

            mask_a = output_a > 0.5
            mask_a = morphology.binary_erosion(mask_a, iterations=1)

        return mask_a

    def groupSegmentationOutput(self, ct, mask_a):
        candidateLabel_a, candidate_count = measurements.label(mask_a)
        centerIrc_list = measurements.center_of_mass(
            ct.hunits_arr.clip(-1000, 1000) + 1001,
            labels=candidateLabel_a,
            index=np.arange(1, candidate_count + 1),
        )

        candidates_list = []
        for i, center_irc in enumerate(centerIrc_list):
            center_xyz = irc2xyz(
                center_irc,
                ct.origin_xyz,
                ct.voxSize_xyz,
                ct.direction_arr,
            )
            assert np.all(np.isfinite(center_irc)), repr(
                ["irc", center_irc, i, candidate_count]
            )
            assert np.all(np.isfinite(center_xyz)), repr(["xyz", center_xyz])
            candidate_tuple = CandidateTuple(center_xyz)
            candidates_list.append(candidate_tuple)

        return candidates_list

    # ########################################################################
    # ################## Nodule Classification Stuff #########################
    # ########################################################################

    def initClassificationDl(self, ct, candidates_list):
        cls_ds = LunaDataset(
            ct,
            candidates_list=candidates_list,
        )
        cls_dl = DataLoader(
            cls_ds,
            batch_size=(torch.cuda.device_count() if self.use_cuda else 1),
            num_workers=4,
            pin_memory=self.use_cuda,
        )
        return cls_dl

    def classifyCandidates(self, ct, candidates_list):
        cls_dl = self.initClassificationDl(ct, candidates_list)
        classifications_list = []
        for _, batch_tup in enumerate(cls_dl):
            input_t, center_list = batch_tup

            input_g = input_t.to(self.device)
            with torch.no_grad():
                _, probability_nodule_g = self.cls_model(input_g)
                _, probability_mal_g = self.malignancy_model(input_g)

            zip_iter = zip(
                center_list,
                probability_nodule_g[:, 1].tolist(),
                probability_mal_g[:, 1].tolist(),
            )
            for center_irc, prob_nodule, prob_mal in zip_iter:
                center_xyz = irc2xyz(
                    center_irc,
                    direction_arr=ct.direction_arr,
                    origin_xyz=ct.origin_xyz,
                    voxSize_xyz=ct.voxSize_xyz,
                )
                center_irc = xyz2irc(
                    [center_xyz.x, center_xyz.y, center_xyz.z],
                    direction_arr=ct.direction_arr,
                    origin_xyz=ct.origin_xyz,
                    voxSize_xyz=ct.voxSize_xyz,
                )
                cls_tup = Cls_Tup(
                    prob_nodule, prob_mal, center_xyz, center_irc
                )
                classifications_list.append(cls_tup)
        return classifications_list

    ########################################################################
    ###################### MAIN  ###########################################
    ########################################################################

    def main(self, image_data_path=os.path.join(ROOT_DIR, "data")):

        file = glob.glob(os.path.join(image_data_path, "*.mhd"))[0]
        ct = Ct(file)  # done
        mask_a = self.segmentCt(ct)  # done

        candidates_list = self.groupSegmentationOutput(ct, mask_a)
        classifications_list = self.classifyCandidates(ct, candidates_list)

        mal_list = []

        for tup in classifications_list:
            prob, prob_mal, center_xyz, center_irc = tup
            if prob > 0.5:
                mal_tup = Mal_Tup(prob, prob_mal, center_xyz, center_irc)
                mal_list.append(mal_tup)

        # visualize(ct, mal_list)
        result = convertOutput(mal_list)
        return ct, result

        # return ct, mal_list

    ########################################################################
    ###################### BUILD MASK ######################################
    ########################################################################


def convertOutput(mal_list):
    result = {}
    for index, mal_tup in enumerate(mal_list):
        prob, prob_mal, center_xyz, center_irc = mal_tup

        coord_xyz = dict(center_xyz._asdict())
        coord_irc = dict(center_irc._asdict())

        items = {}
        items['Nodule_Probability'] = prob
        items['Malignancy_Probability'] = prob_mal
        items['XYZ_Coordinates'] = coord_xyz
        items['IRC_Coordinates'] = coord_irc

        result[index] = items

    return result


def transparent_cmap(cmap, N=255):
    "Copy colormap and set alpha values"

    mycmap = copy.deepcopy(cmap)
    mycmap._init()
    mycmap._lut[:, -1] = np.linspace(0, 0.75, N + 4)
    return mycmap


def build2dLungMask(ct, positive_mask, center_ndx):
    mask_model = models.SegmentationMask().to("cuda")

    ct_g = (
        torch.from_numpy(ct.hunits_arr[center_ndx].astype(np.float32))
        .unsqueeze(0)
        .unsqueeze(0)
        .to("cuda")
    )
    pos_g = (
        torch.from_numpy(positive_mask[center_ndx].astype(np.float32))
        .unsqueeze(0)
        .unsqueeze(0)
        .to("cuda")
    )
    input_g = ct_g / 1000

    label_g, neg_g, pos_g, lung_mask, mask_dict = mask_model(input_g, pos_g)
    mask_tup = models.MaskTuple(**mask_dict)

    return mask_tup


def visualize(ct, mal_list):
    tgray = transparent_cmap(plt.cm.gray)
    tpurp = transparent_cmap(plt.cm.Purples)
    tblue = transparent_cmap(plt.cm.Blues)
    tgreen = transparent_cmap(plt.cm.Greens)
    torange = transparent_cmap(plt.cm.Oranges)
    tred = transparent_cmap(plt.cm.Reds)

    # clim=(0, 1.3)
    tup = mal_list[3]
    # fig = plt.figure(figsize=(5,30))
    positive_mask = ct.buildAnnotationMask(mal_list)

    return positive_mask
    # mask_tup = build2dLungMask(ct, positive_mask, int(tup.center_irc.index))
    # for attr_ndx, attr_str in enumerate(mask_tup._fields):
    #     subplot = fig.add_subplot(len(mask_tup), 1, attr_ndx + 1)
    #     subplot.set_title(attr_str)

    # plt.imshow(
    #     ct.hunits_arr[int(tup.center_irc.index)],
    #     clim=(-1000, 3000),
    #     cmap="RdGy",
    # )
    # plt.imshow(mask_tup[attr_ndx][0][0].cpu(), clim=clim, cmap=tblue)


if __name__ == "__main__":
    NoduleAnalysisApp().main()
