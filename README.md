## Lung Nodule Analysis -Overview
LUNA (Lung Nodule Analysis) is a deep learning-based solution for detecting and classifying lung tumors using 3D CT scans from the LUNA-16 challenge dataset. The project leverages deep learning techniques for image segmentation and classification, along with an interactive ReactJS web application for visualization.

### 🚀 Key Features:
Tumor Segmentation: Trained a modified U-Net model on 2D slices extracted from 3D CT scans, achieving 63.2% segmentation accuracy.
Tumor Classification: Built a CNN model in PyTorch for classifying nodules, reaching an AUC of 83.29%.
GPU Acceleration: Optimized training on an NVIDIA V100 GPU for efficient model execution.
Web Visualization: Developed a ReactJS-based interface to interactively display segmented nodules and classified tumors, improving accessibility for medical professionals.

### 🛠️ Tech Stack:
Deep Learning: Python, PyTorch, TensorFlow
Data Processing: NumPy, Pandas, OpenCV
Visualization: Matplotlib, Seaborn
Web App: ReactJS, Node.js

🔗 [Project Repository] (https://github.com/KirtanaSridharan/Lung-Nodule-Analysis-Pytorch)
