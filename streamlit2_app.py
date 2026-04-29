import streamlit as st
import os
import json
import uuid
import random
from PIL import Image

# -------------------------------
# CONFIG
# -------------------------------
st.set_page_config(page_title="StyleSync", layout="wide")

st.markdown("""
<style>
.block-container {
    padding-top: 2rem;
    padding-left: 4rem;
    padding-right: 4rem;
}

.hero {
    padding: 50px;
    border-radius: 28px;
    background: linear-gradient(135deg, #7C3AED 0%, #2563EB 45%, #0F172A 100%);
    color: white;
    box-shadow: 0px 12px 30px rgba(0,0,0,0.25);
    margin-bottom: 35px;
}

.hero-title {
    font-size: 70px;
    font-weight: 800;
    margin: 0;
}

.hero-subtitle {
    font-size: 22px;
    opacity: 0.92;
    margin-top: 10px;
}

.feature-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    padding: 20px;
    border-radius: 18px;
    box-shadow: 0px 6px 18px rgba(0,0,0,0.18);
    height: 160px;
}

.feature-title {
    font-size: 18px;
    font-weight: 750;
    margin-bottom: 8px;
}

.feature-desc {
    font-size: 14px;
    opacity: 0.85;
}

.flow-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
    padding: 25px;
    border-radius: 20px;
    margin-top: 15px;
}

.flow-step {
    font-size: 16px;
    margin-bottom: 10px;
}

.cta-button {
    display: inline-block;
    background: white;
    color: #0F172A;
    padding: 10px 18px;
    border-radius: 14px;
    font-weight: 700;
    margin-right: 12px;
    text-decoration: none;
}

</style>
""", unsafe_allow_html=True)

WARDROBE_PATH = "wardrobe.json"
UPLOAD_DIR = "uploads"

CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes"]
COLORS = ["black", "white", "blue", "red", "green", "gray", "beige", "brown"]
STYLE_TAGS = ["business_casual", "athletic", "punk", "minimal", "casual"]
GENRES = ["business_casual", "athletic", "punk", "casual", "minimal"]


# -------------------------------
# STORAGE FUNCTIONS
# -------------------------------
def load_wardrobe():
    if not os.path.exists(WARDROBE_PATH):
        return []
    with open(WARDROBE_PATH, "r") as f:
        return json.load(f)


def save_wardrobe(items):
    with open(WARDROBE_PATH, "w") as f:
        json.dump(items, f, indent=2)


def generate_item_id():
    return str(uuid.uuid4())[:8]


def add_item(item):
    wardrobe = load_wardrobe()
    wardrobe.append(item)
    save_wardrobe(wardrobe)


def delete_item(item_id):
    wardrobe = load_wardrobe()
    wardrobe = [x for x in wardrobe if x["item_id"] != item_id]
    save_wardrobe(wardrobe)


# -------------------------------
# CLASSIFIER STUB (FAKE CV MODEL)
# -------------------------------
def classify_clothing(image_path):
    category = random.choice(CATEGORIES)
    color = random.choice(COLORS)
    tags = random.sample(STYLE_TAGS, k=random.randint(1, 2))
    confidence = round(random.uniform(0.75, 0.99), 2)

    return {
        "category": category,
        "color": color,
        "style_tags": tags,
        "confidence": confidence
    }


# -------------------------------
# OUTFIT ENGINE STUB
# -------------------------------
def generate_outfits(wardrobe, genre, n_outfits=3):
    tops = [x for x in wardrobe if x["category"] == "top"]
    bottoms = [x for x in wardrobe if x["category"] == "bottom"]
    shoes = [x for x in wardrobe if x["category"] == "shoes"]
    outerwear = [x for x in wardrobe if x["category"] == "outerwear"]

    outfits = []

    for _ in range(n_outfits):
        if not tops or not bottoms or not shoes:
            break

        outfit = {
            "top": random.choice(tops),
            "bottom": random.choice(bottoms),
            "shoes": random.choice(shoes),
            "outerwear": random.choice(outerwear) if outerwear and random.random() > 0.5 else None,
            "genre": genre,
            "explanation": f"This outfit matches {genre.replace('_',' ').title()} because it satisfies the required outfit structure."
        }

        outfits.append(outfit)

    return outfits


# -------------------------------
# UI COMPONENTS
# -------------------------------
def render_item_card(item):
    st.image(item["image_path"], use_container_width=True)
    st.markdown(f"**Category:** {item['category'].title()}")
    st.markdown(f"**Color:** {item['color'].title()}")
    st.markdown("**Tags:** " + ", ".join(item["style_tags"]))


def render_outfit(outfit):
    st.subheader("Outfit")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("### Top")
        render_item_card(outfit["top"])

    with col2:
        st.markdown("### Bottom")
        render_item_card(outfit["bottom"])

    with col3:
        st.markdown("### Shoes")
        render_item_card(outfit["shoes"])

    if outfit["outerwear"]:
        st.markdown("### Outerwear")
        render_item_card(outfit["outerwear"])

    st.info(outfit["explanation"])


# -------------------------------
# PAGES
# -------------------------------
def home_page():
    st.markdown("""
    <div class="hero">
        <div class="hero-title">👕 StyleSync</div>
        <div class="hero-subtitle">
            Your AI wardrobe + outfit generator built for real outfit decisions.
        </div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("## ✨ What StyleSync Does")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        <div class="feature-card">
            <div class="feature-title">📸 Upload Clothing</div>
            <div class="feature-desc">
                Upload images of clothing items from your closet and store them digitally.
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div class="feature-card">
            <div class="feature-title">🧠 Smart Tagging</div>
            <div class="feature-desc">
                Computer vision predicts category, color, and style tags automatically.
            </div>
        </div>
        """, unsafe_allow_html=True)

    with col3:
        st.markdown("""
        <div class="feature-card">
            <div class="feature-title">👗 Outfit Generator</div>
            <div class="feature-desc">
                Choose a style genre (Business Casual, Punk, Athletic) and generate outfits.
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")

    st.markdown("## 🚀 MVP Demo Flow")

    st.markdown("""
    <div class="flow-box">
        <div class="flow-step">1️⃣ Upload clothing items</div>
        <div class="flow-step">2️⃣ View your wardrobe closet</div>
        <div class="flow-step">3️⃣ Select a style genre</div>
        <div class="flow-step">4️⃣ Generate ranked outfit recommendations</div>
        <div class="flow-step">5️⃣ Style one item multiple ways</div>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")

    st.markdown("## 🎯 Get Started")

    colA, colB = st.columns(2)

    with colA:
        if st.button("📸 Upload an Item"):
            st.session_state.page = "Upload"
            st.rerun()

    with colB:
        if st.button("✨ Generate Outfits"):
            st.session_state.page = "Outfits"
            st.rerun()

    st.caption("Tip: Upload at least 5–8 items for the best outfit recommendations.")

def upload_page():
    st.title("📸 Upload Clothing Item")

    uploaded_file = st.file_uploader("Upload an image of ONE clothing item", type=["png", "jpg", "jpeg"])

    if uploaded_file:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        item_id = generate_item_id()
        file_path = os.path.join(UPLOAD_DIR, f"{item_id}_{uploaded_file.name}")

        with open(file_path, "wb") as f:
            f.write(uploaded_file.getbuffer())

        st.image(file_path, caption="Uploaded Item", use_container_width=True)

        st.markdown("## Predicted Metadata")
        prediction = classify_clothing(file_path)

        st.write(f"**Category:** {prediction['category']}")
        st.write(f"**Color:** {prediction['color']}")
        st.write(f"**Style Tags:** {', '.join(prediction['style_tags'])}")
        st.write(f"**Confidence:** {prediction['confidence']}")

        if st.button("✅ Save to Wardrobe"):
            new_item = {
                "item_id": item_id,
                "image_path": file_path,
                "category": prediction["category"],
                "color": prediction["color"],
                "style_tags": prediction["style_tags"]
            }

            add_item(new_item)
            st.success("Item saved to wardrobe!")


def wardrobe_page():
    st.title("🧥 My Digital Closet")

    wardrobe = load_wardrobe()

    if len(wardrobe) == 0:
        st.warning("No clothing items yet. Go to Upload and add some!")
        return

    cols = st.columns(3)

    for i, item in enumerate(wardrobe):
        with cols[i % 3]:
            st.markdown("---")
            render_item_card(item)

            if st.button("🗑️ Delete", key=f"delete_{item['item_id']}"):
                delete_item(item["item_id"])
                st.rerun()


def outfits_page():
    st.title("✨ Outfit Generator")

    wardrobe = load_wardrobe()

    if len(wardrobe) == 0:
        st.warning("Your wardrobe is empty. Upload clothing items first.")
        return

    genre = st.selectbox("Select a style genre:", GENRES)

    if st.button("🎯 Generate Outfits"):
        outfits = generate_outfits(wardrobe, genre, n_outfits=3)

        if len(outfits) == 0:
            st.error("Not enough clothing items. Upload more tops, bottoms, and shoes.")
        else:
            st.success(f"Generated {len(outfits)} outfits!")

            for outfit in outfits:
                st.markdown("---")
                render_outfit(outfit)


def style_this_item_page():
    st.title("👔 Style This Item")

    wardrobe = load_wardrobe()

    if len(wardrobe) == 0:
        st.warning("Your wardrobe is empty. Upload clothing items first.")
        return

    item_options = {
        f"{item['category'].title()} | {item['color'].title()} | {item['item_id']}": item
        for item in wardrobe
    }

    selected_label = st.selectbox("Choose an item you want to style:", list(item_options.keys()))
    selected_item = item_options[selected_label]

    st.markdown("## Selected Item")
    render_item_card(selected_item)

    st.markdown("---")

    genre = st.selectbox("Choose a genre:", GENRES)

    if st.button("✨ Generate 3 Looks"):
        # generate more outfits so we can filter
        outfits = generate_outfits(wardrobe, genre, n_outfits=8)

        final_outfits = []

        # try filtering outfits that already contain the item
        for outfit in outfits:
            if (
                outfit["top"]["item_id"] == selected_item["item_id"]
                or outfit["bottom"]["item_id"] == selected_item["item_id"]
                or outfit["shoes"]["item_id"] == selected_item["item_id"]
                or (outfit["outerwear"] and outfit["outerwear"]["item_id"] == selected_item["item_id"])
            ):
                final_outfits.append(outfit)

        # if not enough, force the item into outfits
        while len(final_outfits) < 3:
            new_outfit_list = generate_outfits(wardrobe, genre, n_outfits=1)
            if len(new_outfit_list) == 0:
                break

            new_outfit = new_outfit_list[0]

            if selected_item["category"] == "top":
                new_outfit["top"] = selected_item
            elif selected_item["category"] == "bottom":
                new_outfit["bottom"] = selected_item
            elif selected_item["category"] == "shoes":
                new_outfit["shoes"] = selected_item
            elif selected_item["category"] == "outerwear":
                new_outfit["outerwear"] = selected_item

            new_outfit["explanation"] = (
                f"This look is built around your selected {selected_item['category']} "
                f"to fit the {genre.replace('_',' ').title()} vibe."
            )

            final_outfits.append(new_outfit)

        if len(final_outfits) == 0:
            st.error("Could not generate styling options. Try uploading more items.")
        else:
            st.success("Here are 3 ways to style your item!")

            for i, outfit in enumerate(final_outfits[:3]):
                st.markdown(f"## Look {i+1}")
                render_outfit(outfit)
                st.markdown("---")


# -------------------------------
# SIDEBAR NAVIGATION
# -------------------------------
st.sidebar.title("StyleSync Navigation")

if "page" not in st.session_state:
    st.session_state.page = "Home"

st.sidebar.title("StyleSync Navigation")

page = st.sidebar.radio(
    "Go to:",
    ["Home", "Upload", "Wardrobe", "Outfits", "Style This Item"],
    index=["Home", "Upload", "Wardrobe", "Outfits", "Style This Item"].index(st.session_state.page)
)

st.session_state.page = page

if page == "Home":
    home_page()
elif page == "Upload":
    upload_page()
elif page == "Wardrobe":
    wardrobe_page()
elif page == "Outfits":
    outfits_page()
elif page == "Style This Item":
    style_this_item_page()