from flask import Flask, render_template, request, Response, jsonify
from ultralytics import YOLO
from PIL import Image
import os
import uuid
import cv2
from flask_cors import CORS
import time



app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
CORS(app)  # Enable CORS for all routes


model = YOLO('model/face_emotion_recognition.pt')
camera = None
current_emotion = {"label": None, "timestamp": None}

def gen_frames():
    global camera, current_emotion
    if camera is None:
        camera = cv2.VideoCapture(0)

    while True:
        success, frame = camera.read()
        if not success:
            break

        frame = cv2.flip(frame, 1)

        results = model(frame)
        if results and results[0].boxes and len(results[0].boxes.cls) > 0:
            pred_idx = int(results[0].boxes.cls[0])
            label = model.names[pred_idx]
            current_emotion["label"] = label
            current_emotion["timestamp"] = time.time()
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/current_emotion')
def get_current_emotion():
    return jsonify(current_emotion)

@app.route('/shutdown_camera')
def shutdown_camera():
    global camera
    if camera:
        camera.release()
        camera = None
    return "Camera released"

if __name__ == '__main__':
    app.run(debug=True)
