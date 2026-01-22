# Stasis - Backend (ML) hey 🧠

![Facial Expression Recognition](https://img.shields.io/badge/Facial%20Expression%20Recognition-Open%20Source-brightgreen)

This repository contains the **backend machine learning component** for **Stasis**, a learning application that leverages computer vision and AI to enhance productivity. This backend service provides facial expression recognition capabilities using YOLOv9 and Flask, detecting emotions in images and live camera feeds. It identifies five emotions: Angry, Happy, Natural, Sad, and Surprised, achieving a mean Average Precision (mAP50) of 0.731.

## Credits

This project is based on the original work by [Bananacat123-hue](https://github.com/Bananacat123-hue) from the [Facial Expression Recognition - Sure Trust](https://github.com/Bananacat123-hue/Facial_Expression_Recognition-Sure_Trust-) repository. Special thanks to the original author for their excellent implementation and contribution to the open-source community.

## Table of Contents

- [Credits](#credits)
- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

This repository serves as the machine learning backend for Stasis, a learning application designed to boost productivity through AI-powered features. This component specifically handles the computer vision and facial expression recognition functionality using deep learning techniques to classify emotions from facial images. The backend provides REST API endpoints that the main Stasis application can integrate with for emotion detection capabilities.

## Features

- **Emotion Detection API**: Backend service that accurately detects five emotions from images and live video feeds.
- **Flask REST API**: Provides endpoints for integration with the main Stasis application.
- **Real-Time Processing**: Analyzes live camera input for immediate emotion feedback.
- **Image Upload Support**: Processes uploaded images and returns emotion classification results.
- **Emoji Feedback**: Provides emoji suggestions based on detected emotions.
- **YOLOv9 Model**: Uses state-of-the-art object detection for accurate emotion recognition.

## Technologies Used

This project utilizes the following technologies:

- **Python**: The primary programming language for the application.
- **OpenCV**: For image processing and computer vision tasks.
- **Flask**: A lightweight web framework for creating the web interface.
- **HTML/CSS/JS**: For building the front end of the application.
- **YOLOv9**: A state-of-the-art object detection model used for emotion recognition.
- **TensorFlow**: For deep learning tasks and model training.
- **Roboflow Dataset**: A dataset used for training the emotion detection model.

## Installation

To set up the backend ML service locally, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone <your-repository-url>
   ```

2. **Navigate to the Project Directory**:

   ```bash
   cd stasis
   ```

3. **Install Required Packages**:

   Make sure you have Python installed. Then, install the required packages using pip:

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Application**:

   Start the Flask server:

   ```bash
   python app.py
   ```

5. **Access the Web Interface**:

   Open your web browser and go to `http://127.0.0.1:5000` to access the application.

## Usage

Once the backend service is running, it provides API endpoints that can be accessed by the main Stasis application:

1. **Image Upload Endpoint**: Send images to the API for emotion detection analysis.

2. **Live Camera Processing**: Stream video data to the backend for real-time emotion recognition.

3. **Emoji Feedback**: Receive emotion classifications along with appropriate emoji suggestions.

The backend service runs on `http://127.0.0.1:5000` by default and can be integrated with the main Stasis application.


## Contributing

We welcome contributions to improve this project. Here’s how you can help:

1. **Fork the Repository**: Click on the fork button to create a copy of the repository in your account.

2. **Create a New Branch**: Use a descriptive name for your branch.

   ```bash
   git checkout -b feature/YourFeatureName
   ```

3. **Make Your Changes**: Implement your feature or fix a bug.

4. **Commit Your Changes**: Write a clear commit message.

   ```bash
   git commit -m "Add your message here"
   ```

5. **Push to Your Branch**:

   ```bash
   git push origin feature/YourFeatureName
   ```

6. **Create a Pull Request**: Go to the original repository and submit a pull request.

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute this software.

---

Thank you for your interest in Stasis! This project builds upon the excellent work of the original author. Your contributions and feedback are always welcome.
