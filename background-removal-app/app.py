from flask import Flask, request, jsonify, send_file
from rembg import remove
from PIL import Image, UnidentifiedImageError
import requests
from io import BytesIO

app = Flask(__name__)

@app.route('/remove-background', methods=['POST'])
def remove_bg():
    image_url = request.json.get('image_url')
    if not image_url:
        return "No image URL provided", 400

    try:
        response = requests.get(image_url, timeout=10)  # Timeout set to 10 seconds
        response.raise_for_status()
    except requests.RequestException as e:
        app.logger.error(f"Failed to fetch image: {e}")
        return "Failed to fetch image", 500

    try:
        image = Image.open(BytesIO(response.content))
        image = image.convert("RGBA")
        new_image = remove(image)
    except UnidentifiedImageError as e:
        app.logger.error(f"Unidentified image error: {e}")
        return "Failed to process image", 500
    except Exception as e:
        app.logger.error(f"Error processing image: {e}")
        return "Error processing image", 500

    img_io = BytesIO()
    new_image.save(img_io, 'PNG', quality=70)  # Reduce the quality if file size is too large
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/test', methods=['GET'])
def test_route():
    return {"message": "Hello, this is a test"}

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5001)  # Set debug to False for production

