from flask import Flask, render_template, request, Response, jsonify
from ultralytics import YOLO
from PIL import Image
import os
import uuid
import cv2
from flask_cors import CORS
import time
import base64
import numpy as np
from io import BytesIO



app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# CORS configuration - allow localhost for development
CORS(app, origins=[
    'http://localhost:3000',      # Next.js dev server
    'http://127.0.0.1:3000',
    'http://localhost:5173',      # Vite dev server
    'http://127.0.0.1:5173',
    'http://localhost:5000',      # Flask self
    'http://127.0.0.1:5000',
    os.environ.get('FRONTEND_URL', '')  # Production frontend URL
])


model = YOLO('model/face_emotion_recognition.pt')

def get_emoji_path(emotion):
    jpeg_path = f'static/emojis/{emotion}.jpeg'
    jpg_path = f'static/emojis/{emotion}.jpg'
    if os.path.exists(jpeg_path):
        return jpeg_path
    elif os.path.exists(jpg_path):
        return jpg_path
    return None

@app.route('/analyze_frame', methods=['POST'])
def analyze_frame():
    """Analyze a base64-encoded image frame from client-side webcam"""
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Decode base64 image
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]  # Remove data:image/jpeg;base64, prefix
        
        image_bytes = base64.b64decode(image_data)
        image = Image.open(BytesIO(image_bytes))
        
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

@app.route('/', methods=['GET', 'POST'])
def index():
    emotion = None
    emoji_path = None
    uploaded_path = None
    show_text = False

    if request.method == 'POST':
        file = request.files.get('image')
        if file:
            filename = f'{uuid.uuid4()}.jpg'
            uploaded_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(uploaded_path)

            results = model(uploaded_path)
            if results and results[0].boxes and len(results[0].boxes.cls) > 0:
                pred_idx = int(results[0].boxes.cls[0])
                emotion = model.names[pred_idx]
                emoji_path = get_emoji_path(emotion)
                if not emoji_path:
                    show_text = True

    return render_template('index.html',
                           emotion=emotion,
                           emoji_path=emoji_path,
                           uploaded_path=uploaded_path,
                           show_text=show_text)

# ============================================
# DEVELOPMENT / DEBUG ROUTES (localhost only)
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': time.time()
    })

@app.route('/api/info', methods=['GET'])
def api_info():
    """API information endpoint"""
    return jsonify({
        'version': '1.0.0',
        'endpoints': {
            'analyze_frame': '/analyze_frame (POST) - Analyze base64 image',
            'upload': '/ (POST) - Upload image file',
            'health': '/health (GET) - Health check',
            'test': '/test (GET) - Test model with sample'
        },
        'model': 'YOLO face_emotion_recognition',
        'emotions': list(model.names.values()) if model else []
    })

@app.route('/test', methods=['GET'])
def test_model():
    """Test endpoint to verify model is working"""
    try:
        # Create a simple test image (black square)
        test_image = np.zeros((224, 224, 3), dtype=np.uint8)
        results = model(test_image)
        return jsonify({
            'status': 'success',
            'message': 'Model is working',
            'model_classes': list(model.names.values())
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') != 'production'
    app.run(host='0.0.0.0', port=port, debug=debug)
