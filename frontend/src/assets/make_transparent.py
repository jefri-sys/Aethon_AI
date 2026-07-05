from PIL import Image
import os

img_path = r'd:\Synapse\frontend\src\assets\logo.png'
img = Image.open(img_path).convert('RGBA')
datas = img.getdata()

newData = []
for item in datas:
    # If the pixel is close to white, make it transparent
    # If it's close to black, make it white
    # item is (R, G, B, A)
    avg = (item[0] + item[1] + item[2]) / 3
    if avg > 128:
        # white background -> transparent
        newData.append((255, 255, 255, 0))
    else:
        # black logo -> white logo
        # antialiasing preservation: 
        # let's set alpha based on darkness
        alpha = int((255 - avg))
        newData.append((255, 255, 255, alpha))
img.putdata(newData)
img.save(img_path, 'PNG')
