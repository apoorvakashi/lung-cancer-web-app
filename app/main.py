import base64
import io
import os
import shutil
from pathlib import Path

import numpy as np
import json
from PIL import Image


from flask import Flask, current_app, request, jsonify, send_file, send_from_directory
from flask.templating import render_template

from app.lung_cancer import dl_main, plot_output

APP = Flask(__name__)
ROOT_DIR = Path(__file__).resolve().parent.parent
ALLOWED_EXTENSIONS = {"raw", "mhd"}


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


@APP.route("/")
def index():
    return render_template("index.html")


@APP.route("/team")
def team():
    return render_template("team.html")


@APP.route("/upload", methods=["POST"])
def upload():
    if request.method == "POST":
        raw = request.files["rawfile"]
        mhd = request.files["mhdfile"]
        if (raw is None or raw.filename == "") or (
            mhd is None or mhd.filename == ""
        ):
            return jsonify({"error": "No file provided"})

        if not allowed_file(raw.filename) and not allowed_file(mhd.filename):
            return jsonify({"error": "Image format not supported"})
        raw_data = raw.read()
        mhd_data = mhd.read()

        decoded_mhd_data = mhd_data.decode("ascii").split("\n")[:-1]
        mhd_data_dict = {}

        for value in decoded_mhd_data:
            key, val = value.split(" = ")
            mhd_data_dict[key] = val

        mhd_data_dict["ElementDataFile"] = "sample.raw"

        mhd_data_string = ""
        for key, val in mhd_data_dict.items():
            mhd_data_string += f"{key} = {val}\n"

        if not os.path.exists(os.path.join(ROOT_DIR, "data")):
            os.mkdir(os.path.join(ROOT_DIR, "data"))

        with open(os.path.join(ROOT_DIR, "data", "sample.mhd"), "w") as file:
            file.write(mhd_data_string)

        with open(os.path.join(ROOT_DIR, "data", "sample.raw"), "wb") as file:
            file.write(raw_data)

        return {"State": "Data uploaded to directory. Ready for inferencing!!"}


@APP.route("/predict", methods=["GET"])
def predict():
    ct, prediction = dl_main.NoduleAnalysisApp().main()
    plot_output.main(ct, prediction)
    return jsonify({"Prediction": prediction})


@APP.route("/result", methods=["GET"])
def results():
    return render_template("result.html")


@APP.route("/getplot", methods=["POST"])
def getplot():
    data = json.loads(request.data.decode("ascii"))
    id = data["id"]

    img_crop = np.load(os.path.join(ROOT_DIR, "output", str(id) + ".npy"))
    plot_output.plot_nodule(img_crop)
    with open(
        os.path.join(ROOT_DIR, "output", "plots", "plot.png"), "rb"
    ) as image_byte:
        file = image_byte.read()

    response = base64.b64encode(file)
    return response


@APP.route("/download", methods=["GET", "POST"])
def download():
    output_file = os.path.join(ROOT_DIR, "nodules")
    dir = os.path.join(ROOT_DIR, "output")
    shutil.make_archive(output_file, 'zip', dir)

    # with open(
    #     os.path.join(ROOT_DIR, "nodules.zip"), "rb"
    # ) as image_byte:
    #     file = image_byte.read()

    # uploads = os.path.join(ROOT_DIR, "nodules.zip")
    # filename = "nodules.zip"

    # response = base64.b64encode(file)
    return send_file("nodules.zip", as_attachment=True)
