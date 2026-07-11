from PIL import Image

def remove_dark_background(input_path, output_path, threshold=30):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()

    new_data = []
    for item in data:
        # Check if the pixel is dark (r, g, b are all below threshold)
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            # Make the pixel fully transparent
            new_data.append((item[0], item[1], item[2], 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_dark_background("frontend/public/logo.jpg", "frontend/public/logo.png", threshold=40)
print("Saved transparent logo.png")
