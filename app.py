import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import numpy as np
from sklearn.cluster import KMeans
import gradio as gr

# ───── Architecture must match training exactly ─────
NUM_CLASSES = 5
LABEL_TO_SUBCATEGORY = {
    0: "Tops", 1: "Bottomwear", 2: "Shoes", 3: "Dress", 4: "Outerwear",
}
# Map training labels → our frontend's `cat` field
SUBCATEGORY_TO_FRONTEND_CAT = {
    "Tops": "top",
    "Bottomwear": "bottom",
    "Shoes": "shoes",
    "Dress": "dress",
    "Outerwear": "outerwear",
}

def build_model():
    m = models.resnet50(weights=None)         # weights loaded from state_dict below
    m.fc = nn.Linear(m.fc.in_features, NUM_CLASSES)
    return m

model = build_model()
state_dict = torch.load("resnet50_stylesync.pt", map_location="cpu")
model.load_state_dict(state_dict)
model.eval()

# Same as val_transform in your notebook
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

# ───── Color palette matched to our cozy frontend swatches ─────
COLOR_PALETTE = {
    "black":  (40, 38, 32),    "white":  (240, 232, 217),
    "cream":  (229, 218, 192), "gray":   (181, 176, 165),
    "brown":  (123, 90, 63),   "tan":    (214, 199, 166),
    "red":    (184, 85, 71),   "orange": (201, 123, 92),
    "yellow": (232, 206, 133), "green":  (124, 144, 121),
    "blue":   (90, 124, 168),  "pink":   (216, 154, 160),
    "purple": (148, 121, 160),
}

def closest_color(rgb):
    r, g, b = rgb
    return min(COLOR_PALETTE.items(),
               key=lambda kv: (kv[1][0]-r)**2 + (kv[1][1]-g)**2 + (kv[1][2]-b)**2)[0]

def extract_dominant_color(pil_img, k=3):
    """K-means on pixels; ignore near-white background."""
    small = pil_img.convert("RGB").resize((100, 100))
    pixels = np.array(small).reshape(-1, 3)
    mask = ~((pixels > 235).all(axis=1))      # drop white bg
    if mask.sum() > 100:
        pixels = pixels[mask]
    km = KMeans(n_clusters=k, n_init=5, random_state=42).fit(pixels)
    counts = np.bincount(km.labels_)
    return tuple(int(x) for x in km.cluster_centers_[counts.argmax()])

# ───── The main predict fn ─────
def predict(image: Image.Image):
    image = image.convert("RGB")

    # Category via ResNet
    tensor = preprocess(image).unsqueeze(0)
    with torch.no_grad():
        logits = model(tensor)
        probs  = torch.softmax(logits, dim=1)
        conf, idx = probs.max(dim=1)
    subcategory = LABEL_TO_SUBCATEGORY[idx.item()]
    category    = SUBCATEGORY_TO_FRONTEND_CAT[subcategory]

    # Color via k-means
    rgb        = extract_dominant_color(image)
    color_name = closest_color(rgb)
    swatch_hex = "#{:02X}{:02X}{:02X}".format(*COLOR_PALETTE[color_name])

    return {
        "category":    category,
        "subcategory": subcategory,
        "color":       color_name,
        "swatch":      swatch_hex,
        "confidence":  round(float(conf.item()), 3),
    }

gr.Interface(
    fn=predict,
    inputs=gr.Image(type="pil", label="Upload a clothing item"),
    outputs=gr.JSON(label="Prediction"),
    title="StyleSync Classifier",
    description="ResNet-50 fine-tuned on DeepFashion → 5 clothing categories + k-means dominant color.",
    api_name="predict",
).launch()
