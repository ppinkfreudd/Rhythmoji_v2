from flask import Flask, request, jsonify, send_file
from rembg import remove
from PIL import Image, UnidentifiedImageError
import requests
from io import BytesIO

app = Flask(__name__)

@app.route('/remove-background', methods=['POST'])
def remove_bg():
    try:
        image_url = request.json.get('image_url')

        if not image_url:
            return "No image URL provided", 400

        try:
            response = requests.get(image_url, timeout=10000)
        except requests.RequestException as e:
            return f"Error fetching image: {e}", 500

        print(f"URL: {image_url}, Status Code: {response.status_code}, Response: {response.text[:100]}")
        
        if response.status_code != 200:
            return "Failed to fetch image", 500

        try:
            image = Image.open(BytesIO(response.content))
        except UnidentifiedImageError:
            return "Invalid image format", 400

        image = image.convert("RGBA")

        # Process the image to remove the background...
        new_image = remove(image)

        # Print success message
        print("Success!")

        # Instead of saving the file, return it directly
        img_io = BytesIO()
        new_image.save(img_io, 'PNG')
        img_io.seek(0)
        return send_file(img_io, mimetype='image/png')

    except Exception as e:
        print(f"An error occurred: {e}")
        return "An error occurred while processing the image", 500

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/test', methods=['GET'])
def test_route():
    return {"message": "Hello, this is a test"}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)  # Set debug to False for production

