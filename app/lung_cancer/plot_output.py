import os
from pathlib import Path

import array
import numpy as np
from matplotlib import pyplot as plt

import scipy.ndimage

from app.lung_cancer import dl_main

BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent


def write_meta_header(filename, meta_dict):
    header = ""
    # do not use tags = meta_dict.keys() because the order of tags matters
    tags = [
        "ObjectType",
        "NDims",
        "BinaryData",
        "BinaryDataByteOrderMSB",
        "CompressedData",
        "CompressedDataSize",
        "TransformMatrix",
        "Offset",
        "CenterOfRotation",
        "AnatomicalOrientation",
        "ElementSpacing",
        "DimSize",
        "ElementType",
        "ElementDataFile",
        "Comment",
        "SeriesDescription",
        "AcquisitionDate",
        "AcquisitionTime",
        "StudyDate",
        "StudyTime",
    ]
    for tag in tags:
        if tag in meta_dict.keys():
            header += "%s = %s\n" % (tag, meta_dict[tag])
    f = open(filename, "w")
    f.write(header)
    f.close()


def dump_raw_data(filename, data):
    """Write the data into a raw format file. Big endian is always used."""
    # Begin 3D fix
    data = data.reshape([data.shape[0], data.shape[1] * data.shape[2]])
    # End 3D fix
    rawfile = open(filename, "wb")
    a = array.array("f")
    for o in data:
        a.fromlist(list(o))
    # if is_little_endian():
    #    a.byteswap()
    a.tofile(rawfile)
    rawfile.close()


def write_mhd_file(mhdfile, data, dsize):
    assert mhdfile[-4:] == ".mhd"
    meta_dict = {}
    meta_dict["ObjectType"] = "Image"
    meta_dict["BinaryData"] = "True"
    meta_dict["BinaryDataByteOrderMSB"] = "False"
    meta_dict["ElementType"] = "MET_FLOAT"
    meta_dict["NDims"] = str(len(dsize))
    meta_dict["DimSize"] = " ".join([str(i) for i in dsize])
    meta_dict["ElementDataFile"] = os.path.split(Path(mhdfile).resolve())[1].replace(
        ".mhd", ".raw"
    )   
    write_meta_header(mhdfile, meta_dict)

    pwd = Path(mhdfile).resolve().parent
    if pwd:
        data_file = os.path.join(pwd , meta_dict["ElementDataFile"])
    else:
        data_file = os.path.join(meta_dict["ElementDataFile"])

    dump_raw_data(data_file, data)


def save_nodule(nodule_crop, name_index):
    if not os.path.exists(os.path.join(ROOT_DIR, "output")):
        os.mkdir(os.path.join(ROOT_DIR, "output"))
    np.save(
        os.path.join(ROOT_DIR, "output", str(name_index) + ".npy"), nodule_crop
    )
    write_mhd_file(
        os.path.join(ROOT_DIR, "output", str(name_index) + ".mhd"),
        nodule_crop,
        nodule_crop.shape[::-1],
    )


def resample(image, old_spacing, new_spacing=[1, 1, 1]):

    resize_factor = old_spacing / new_spacing
    new_real_shape = image.shape * resize_factor
    new_shape = np.round(new_real_shape)
    real_resize_factor = new_shape / image.shape
    new_spacing = old_spacing / real_resize_factor

    image = scipy.ndimage.interpolation.zoom(
        image, real_resize_factor, mode="nearest"
    )

    return image, new_spacing


def plot_nodule(nodule_crop):
    if not os.path.exists(os.path.join(ROOT_DIR, "output", "plots")):
        os.mkdir(os.path.join(ROOT_DIR, "output", "plots"))
    f, plots = plt.subplots(
        int(nodule_crop.shape[0] / 4) + 1, 4, figsize=(10, 10)
    )

    for z_ in range(nodule_crop.shape[0]):
        plots[int(z_ / 4), z_ % 4].imshow(nodule_crop[z_, :, :])

    # The last subplot has no image because there are only 19 images.
    plt.savefig(os.path.join(ROOT_DIR, 'output', 'plots', 'plot.png'), bbox_inches='tight')


def main(ct, mal_list):

    # mal_list_new = [tup for tup in mal_list if tup[1] > 0.7]

    origin = np.array(ct.origin_xyz)[::-1]
    old_spacing = np.array(ct.voxSize_xyz)[::-1]
    image, new_spacing = resample(ct.hunits_arr, old_spacing)

    for key, val in mal_list.items():

        nodule_center = np.array([val['XYZ_Coordinates']['x'], val['XYZ_Coordinates']['y'], val['XYZ_Coordinates']['z']])[::-1]
        v_center = np.rint((nodule_center - origin) / new_spacing)
        v_center = np.array(v_center, dtype=int)
        window_size = 9
        zyx_1 = v_center - window_size  # Attention: Z, Y, X
        zyx_2 = v_center + window_size + 1
        img_crop = image[
            zyx_1[0] : zyx_2[0], zyx_1[1] : zyx_2[1], zyx_1[2] : zyx_2[2]
        ]
        save_nodule(img_crop, key)

    # img_crop = np.load("../data/output/87.npy")
    # plot_nodule(img_crop)
