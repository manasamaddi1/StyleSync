from PIL import Image
import os
import requests
import pandas as pd
from io import BytesIO

SUBCATEGORY_TO_REGION = {
    "Tops":       "top",
    "Outerwear":  "top",
    "Dress":      "full",
    "Bottomwear": "bottom",
    "Shoes":      "none",
}

def download_image(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return Image.open(BytesIO(response.content)).convert("RGB")
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        return None

def crop_by_subcategory(img, sub_category, padding_fraction=0.10):
    width, height = img.size
    region = SUBCATEGORY_TO_REGION.get(sub_category)
    padding = int(height * padding_fraction)

    if region == "top":
        # Take the top 70% instead of 55% — less aggressive
        return img.crop((0, 0, width, int(height * 0.70) + padding))
    elif region == "bottom":
        # Start at 30% from top instead of 45% — includes more of the item
        return img.crop((0, int(height * 0.30) - padding, width, height))
    else:
        return img

def batch_crop_from_df(combined_df, output_dir, padding_fraction=0.05):
    os.makedirs(output_dir, exist_ok=True)
    success, skipped, failed = 0, 0, 0

    for _, row in combined_df.iterrows():
        image_id     = row["id"]
        url          = row["link"]
        sub_category = row["subCategory"]
        output_path  = os.path.join(output_dir, f"{image_id}.jpg")

        if os.path.exists(output_path):
            skipped += 1
            continue

        img = download_image(url)
        if img is None:
            failed += 1
            continue

        try:
            cropped = crop_by_subcategory(img, sub_category, padding_fraction)
            cropped.save(output_path)
            success += 1
            print(f"Saved: {image_id}.jpg ({sub_category})")
        except Exception as e:
            print(f"Failed to crop {image_id}: {e}")
            failed += 1

    print(f"\nDone. Success: {success} | Skipped: {skipped} | Failed: {failed}")

def preview_crop_from_df(combined_df, n=5):
    import matplotlib.pyplot as plt

    sample = combined_df.head(n)
    fig, axes = plt.subplots(n, 2, figsize=(8, n * 4))

    for i, (_, row) in enumerate(sample.iterrows()):
        image_id     = row["id"]
        url          = row["link"]
        sub_category = row["subCategory"]

        img = download_image(url)
        if img is None:
            continue

        cropped = crop_by_subcategory(img, sub_category)

        axes[i, 0].imshow(img)
        axes[i, 0].set_title(f"Original — ID: {image_id}")
        axes[i, 0].axis("off")

        axes[i, 1].imshow(cropped)
        axes[i, 1].set_title(f"Cropped ({sub_category})")
        axes[i, 1].axis("off")

    plt.tight_layout()
    plt.show()