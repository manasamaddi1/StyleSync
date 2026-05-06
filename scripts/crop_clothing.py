# scripts/crop_clothing.py

from PIL import Image
import os
import pandas as pd

def center_zoom(img, zoom_fraction=0.10):
    """
    Crops zoom_fraction off each edge, keeping the center of the image.
    zoom_fraction=0.10 means 10% cropped from each side — a light zoom.

    Args:
        img           : PIL Image
        zoom_fraction : fraction to crop from each edge (default 0.10 = 10%)

    Returns:
        PIL Image — same aspect ratio, lightly zoomed in
    """
    width, height = img.size

    left   = int(width  * zoom_fraction)
    right  = int(width  * (1 - zoom_fraction))
    top    = int(height * zoom_fraction)
    bottom = int(height * (1 - zoom_fraction))

    return img.crop((left, top, right, bottom))


def load_image(image_id, raw_image_dir):
    """
    Loads an image from local disk.

    Args:
        image_id      : the image id (used as filename, e.g. 15970)
        raw_image_dir : path to folder containing raw images e.g. "data/raw_images"

    Returns:
        PIL Image, or None if file not found
    """
    path = os.path.join(raw_image_dir, f"{image_id}.jpg")

    if not os.path.exists(path):
        print(f"File not found: {path}")
        return None

    try:
        return Image.open(path).convert("RGB")
    except Exception as e:
        print(f"Failed to open {path}: {e}")
        return None


def batch_crop_from_df(combined_df, raw_image_dir, output_dir, zoom_fraction=0.10):
    """
    Loads each image from disk, applies center zoom, and saves to output_dir.

    Args:
        combined_df   : your merged dataframe with column 'id'
        raw_image_dir : folder where raw downloaded images are stored e.g. "data/raw_images"
        output_dir    : folder to save cropped images e.g. "data/processed_images"
        zoom_fraction : how much to crop from each edge (0.10 = 10%)
    """
    os.makedirs(output_dir, exist_ok=True)
    success, skipped, failed = 0, 0, 0

    for _, row in combined_df.iterrows():
        image_id    = row["id"]
        output_path = os.path.join(output_dir, f"{image_id}.jpg")

        # Skip if already processed
        if os.path.exists(output_path):
            skipped += 1
            continue

        img = load_image(image_id, raw_image_dir)
        if img is None:
            failed += 1
            continue

        try:
            cropped = center_zoom(img, zoom_fraction)
            cropped.save(output_path)
            success += 1
        except Exception as e:
            print(f"Failed to crop {image_id}: {e}")
            failed += 1

    print(f"\nDone. Success: {success} | Skipped: {skipped} | Failed: {failed}")


def preview_crop_from_df(combined_df, raw_image_dir, n=5, zoom_fraction=0.10):
    """
    Previews the center zoom on n images side by side.
    Run this in your notebook before processing the full dataset.

    Args:
        combined_df   : your merged dataframe
        raw_image_dir : folder where raw images are stored
        n             : number of images to preview
        zoom_fraction : how much to crop from each edge
    """
    import matplotlib.pyplot as plt

    sample = combined_df.head(n)
    fig, axes = plt.subplots(n, 2, figsize=(8, n * 4))

    for i, (_, row) in enumerate(sample.iterrows()):
        image_id     = row["id"]
        sub_category = row["subCategory"]

        img = load_image(image_id, raw_image_dir)
        if img is None:
            continue

        cropped = center_zoom(img, zoom_fraction)

        axes[i, 0].imshow(img)
        axes[i, 0].set_title(f"Original — ID: {image_id} ({sub_category})")
        axes[i, 0].axis("off")

        axes[i, 1].imshow(cropped)
        axes[i, 1].set_title(f"Zoomed 10% ({sub_category})")
        axes[i, 1].axis("off")

    plt.tight_layout()
    plt.show()