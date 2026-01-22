from flask import Flask, render_template, request, Response, jsonify
from ultralytics import YOLO
from PIL import Image
import os
import uuid
from flask_cors import CORS
import time
import base64
import numpy as np
from io import BytesIO



app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# CORS configuration - allow all origins for API endpoints
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     allow_headers=['Content-Type', 'Authorization', 'Accept'],
     methods=['GET', 'POST', 'OPTIONS'],
     supports_credentials=False)

# Ensure CORS headers are added to all responses
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    return response


model = YOLO('model/face_emotion_recognition.pt')

def get_emoji_path(emotion):
    jpeg_path = f'static/emojis/{emotion}.jpeg'
    jpg_path = f'static/emojis/{emotion}.jpg'
    if os.path.exists(jpeg_path):
        return jpeg_path
    elif os.path.exists(jpg_path):
        return jpg_path
    return None

# ============================================
# REST API ENDPOINTS
# ============================================

@app.route('/analyze_frame', methods=['POST', 'OPTIONS'])
def analyze_frame():
    """Analyze an image file uploaded directly (multipart/form-data)"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    try:
        # Check if image file is in the request
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Open image directly from file stream
        image = Image.open(file.stream)
        
        # Convert PIL image to numpy array for YOLO
        image_np = np.array(image)
        
        # Run emotion detection
        results = model(image_np)
        
        emotion = None
        confidence = 0.0
        
        if results and results[0].boxes and len(results[0].boxes.cls) > 0:
            pred_idx = int(results[0].boxes.cls[0])
            emotion = model.names[pred_idx]
            confidence = float(results[0].boxes.conf[0]) if len(results[0].boxes.conf) > 0 else 0.0
        
        return jsonify({
            'emotion': emotion,
            'confidence': confidence,
            'emoji_path': get_emoji_path(emotion) if emotion else None
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({"status": "API running"})




if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
