from PIL import Image

def make_white_transparent(img_path, out_path, tolerance=240):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is near white
        if item[0] >= tolerance and item[1] >= tolerance and item[2] >= tolerance:
            # Change all white (also shades of whites) to transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(out_path, "PNG")

make_white_transparent('public/images/logo.png', 'public/images/logo.png')
print("Done")
