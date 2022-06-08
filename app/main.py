from asyncio import as_completed
import base64
from distutils.log import error
import os
import shutil
from pathlib import Path

import numpy as np
import json
from PIL import Image


from flask import Flask, current_app, request, jsonify, send_file, send_from_directory, make_response
from flask.templating import render_template
from flask_cors import CORS

from app.lung_cancer import dl_main, plot_output

APP = Flask(__name__)
CORS(APP)
ROOT_DIR = Path(__file__).resolve().parent.parent
ALLOWED_EXTENSIONS = ["raw", "mhd"]


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )

def success_response(message, statusCode, results = None):
    response = make_response(jsonify({
        "message": message,
        "results": results
    }), statusCode)
    return response

def error_response(message, statusCode):
    response = make_response(jsonify({"message": message}), statusCode)
    return response


@APP.route("/")
def index():
    return render_template("index.html")


@APP.route("/team")
def team():
    return render_template("team.html")


@APP.route("/upload", methods=["POST"])
def upload():
    if request.method == "POST":
        try:
            raw = request.files["rawfile"]
            mhd = request.files["mhdfile"]
            if (raw is None or raw.filename == '') or (mhd is None or mhd.filename == ''):
                return error_response("Missing files. Please upload all required files.", 400)

            if not allowed_file(raw.filename) and not allowed_file(mhd.filename):
                return error_response("Unsupported file format.", 400)

        except KeyError:
            return error_response("Missing files. Please upload all required files.", 400)
        
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

        return success_response("Data uploaded to directory. Ready for inferencing!!", 200) 

@APP.route("/predict", methods=["GET"])
def predict():
    try:
        ct, prediction = dl_main.NoduleAnalysisApp().main()
        plot_output.main(ct, prediction)
        return success_response("Prediction results have been generated.", 200, results=prediction)
    except:
        return error_response("Something went very wrong! Please try again.", 500)


@APP.route("/result", methods=["GET"])
def results():
    return render_template("result.html")


@APP.route("/getplot", methods=["POST"])
def getplot():
    try:
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
    except:
        return error_response("Something went very wrong! Please try again.", 500)


@APP.route("/download", methods=["GET", "POST"])
def download():
    output_file = os.path.join(ROOT_DIR, "nodules")
    output_dir = os.path.join(ROOT_DIR, "output")

    if (os.path.isdir(output_dir)):
        zip_file_path = shutil.make_archive(output_file, 'zip', output_dir)


        # with open(
        #     os.path.join(ROOT_DIR, "nodules.zip"), "rb"
        # ) as image_byte:
        #     file = image_byte.read()

        # uploads = os.path.join(ROOT_DIR, "nodules.zip")
        # filename = "nodules.zip"

        # response = base64.b64encode(file)

        # zip_file = open(zip_file_path)
        # memory_file = io.BytesIO()
        # return send_file(zip_file_path, attachment_filename='nodules.zip', as_attachment=True)
        return send_from_directory(ROOT_DIR, filename="nodules.zip", as_attachment=True)
    
    else:
        return error_response("Output directory is missing.", 500)
