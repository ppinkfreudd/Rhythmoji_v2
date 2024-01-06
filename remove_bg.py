import PIL
from PIL import image
from rembg import remove
import requests
from io import BytesIO
import sys

def remove_background(image_url):
    response = requests.get(image_url)
    image = Image.open(BytesIO(response.content))
    image = image.convert("RGBA")
    image.save('unfiltered_image.png')

    # Process the image to remove the background...
    new_image = remove(image)

    new_image_path = 'rhythmoji_no_bg.png'
    new_image.save(new_image_path)

    return new_image_path  # Or return a URL if you upload the processed image

if __name__ == "__main__":
    input_url = sys.argv[1]
    result = remove_background(input_url)
    print(result)  # The Node.js app will capture this output
