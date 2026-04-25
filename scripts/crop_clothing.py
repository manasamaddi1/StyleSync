# src/crop_clothing.py

from PIL import Image
import os
import pandas as pd

# Map subCategory values directly to crop regions
SUBCATEGORY_TO_REGION = {
    "Tops":       "top",
    "Outerwear":  "top",
    "Dress":      "full",   # spans whole body, no crop needed
    "Bottomwear": "bottom",
    "Shoes":      "none",   # no crop needed
}

def crop_by_subcategory(image_path, sub_category, padding_fraction=0.05):
    """
    Crops an image based on the subCategory column from your dataset.

    Args:
        image_path       : path to the input image
        sub_category     : value from the subCategory column
                           e.g. "Tops", "Bottomwear", "Shoes"
        padding_fraction : small buffer so crops aren't too tight (0.05 = 5%)

    Returns:
        PIL Image of the cropped region
    """
    img = Image.open(image_path).convert("RGB")
    width, height = img.size

    region = SUBCATEGORY_TO_REGION.get(sub_category)

    if region is None:
        print(f"Warning: unknown subCategory '{sub_category}', returning full image")
        return img

    padding = int(height * padding_fraction)

    if region == "top":
        # Focus on upper portion — shirt/jacket/outerwear is centered higher
        top    = 0
        bottom = int(height * 0.55) + padding
        left   = 0
        right  = width

    elif region == "bottom":
        # Focus on lower portion — pants/skirts are centered lower
        top    = int(height * 0.45) - padding
        bottom = height
        left   = 0
        right  = width

    elif region == "full" or region == "none":
        # Dress or Shoes — return as-is
        return img

    return img.crop((left, top, right, bottom))


def batch_crop_from_csv(csv_path, image_dir, output_dir, padding_fraction=0.05):
    """
    Reads your dataset CSV and crops every image based on its subCategory.

    Args:
        csv_path         : path to your CSV file
        image_dir        : folder where your raw images are stored
        output_dir       : folder to save cropped images
        padding_fraction : buffer for crop tightness
    """
    os.makedirs(output_dir, exist_ok=True)

    df = pd.read_csv(csv_path)

    # Validate required columns exist
    required_columns = {"filename", "subCategory"}
    if not required_columns.issubset(df.columns):
        raise ValueError(f"CSV must contain columns: {required_columns}. Found: {set(df.columns)}")

    success  = 0
    skipped  = 0
    failed   = 0

    for _, row in df.iterrows():
        filename     = row["filename"]          # e.g. "15970.jpg"
        sub_category = row["subCategory"]       # e.g. "Tops"

        input_path  = os.path.join(image_dir, filename)
        output_path = os.path.join(output_dir, filename)

        if not os.path.exists(input_path):
            print(f"Skipping {filename} — file not found")
            skipped += 1
            continue

        try:
            cropped = crop_by_subcategory(input_path, sub_category, padding_fraction)
            cropped.save(output_path)
            success += 1
        except Exception as e:
            print(f"Failed on {filename}: {e}")
            failed += 1

    print(f"\nDone. Success: {success} | Skipped: {skipped} | Failed: {failed}")


def preview_crop(csv_path, image_dir, n=5):
    """
    Quick visual check — previews the crop on the first n images.
    Run this in a notebook to validate before processing the whole dataset.

    Args:
        csv_path  : path to your CSV
        image_dir : folder where raw images are stored
        n         : number of images to preview
    """
    import matplotlib.pyplot as plt

    df = pd.read_csv(csv_path).head(n)

    fig, axes = plt.subplots(n, 2, figsize=(8, n * 4))

    for i, (_, row) in enumerate(df.iterrows()):
        filename     = row["filename"]
        sub_category = row["subCategory"]
        input_path   = os.path.join(image_dir, filename)

        if not os.path.exists(input_path):
            continue

        original = Image.open(input_path).convert("RGB")
        cropped  = crop_by_subcategory(input_path, sub_category)

        axes[i, 0].imshow(original)
        axes[i, 0].set_title(f"Original\n{filename}")
        axes[i, 0].axis("off")

        axes[i, 1].imshow(cropped)
        axes[i, 1].set_title(f"Cropped ({sub_category})")
        axes[i, 1].axis("off")

    plt.tight_layout()
    plt.show()