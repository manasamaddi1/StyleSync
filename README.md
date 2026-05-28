# StyleSync

A wardrobe planning tool that turns photos of individual clothing items into complete outfit suggestions. Upload a photo of any clothing piece, and StyleSync classifies it, extracts its color and attributes, and adds it to your digital closet. From there, a rule-based outfit engine assembles complete looks filtered by occasion — casual, formal, or sports.

**Live app:** [style-synced.vercel.app](https://style-synced.vercel.app/#/home)  
**ML inference:** [aaron8wong/stylesync-app](https://huggingface.co/spaces/aaron8wong/stylesync-app) (Hugging Face Spaces)

---

## Table of Contents

- [Architecture](#architecture)
- [Key Algorithms & Modeling Decisions](#key-algorithms--modeling-decisions)
- [Repository Structure](#repository-structure)
- [Models](#models)
- [Setup & Running Locally](#setup--running-locally)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Limitations & Known Issues](#limitations--known-issues)

---

## Architecture

StyleSync has three layers: a **static frontend** served by Vercel, a **Next.js API layer** that handles routing and storage, and a **Gradio inference app** hosted on Hugging Face Spaces that runs the PyTorch models.

```
User uploads clothing image
        ↓
Static frontend (Vercel — public/)
        ↓  POST /api/predict
Next.js API routes (Vercel — app/api/)
        ↓  forwards image to HF Space
Gradio app on Hugging Face Spaces (app.py)
        ↓
Model A  →  clothing category (top, bottom, shoes, dress, outerwear)
Color extractor  →  dominant color via k-means
        ↓  returns structured JSON
Next.js API routes
        ↓  stores item in Vercel KV (Redis)
Wardrobe state persisted per session
        ↓
Outfit engine assembles combinations from wardrobe
```

**Key architectural decisions:**

**Gradio on Hugging Face Spaces for inference — not a self-hosted backend.** PyTorch models require more memory and compute than a standard serverless function allows. Hugging Face Spaces provides free GPU-capable hosting for Gradio apps, making it the most practical free-tier option for serving ResNet-50 models without managing infrastructure.

**Static frontend + Next.js API routes as a proxy layer.** The visible UI is a static HTML/JSX app served from `public/`. The Next.js `app/api/` layer acts purely as a backend-for-frontend — it proxies image uploads to the HF Space, and handles wardrobe and outfit CRUD via Vercel KV. This separation means the frontend can be developed and iterated independently of the inference backend.

**Vercel KV for wardrobe persistence.** Wardrobe and outfit data is stored in Vercel KV (Redis), which is natively integrated with Vercel deployments. This gives the app persistent state across sessions without requiring a separate database.

---

## Key Algorithms & Modeling Decisions

### Model A — Clothing Category Classifier

A **ResNet-50** pretrained on ImageNet, fine-tuned on the [Myntra Fashion Product Images Dataset](https://www.kaggle.com/datasets/paramaggarwal/fashion-product-images-dataset) to classify clothing into 5 categories: Tops, Bottomwear, Shoes, Dress, Outerwear.

**Dataset:** 23,393 images after filtering to the 5 relevant subCategories.

| subCategory | Count |
|-------------|-------|
| Tops | 12,776 |
| Shoes | 7,321 |
| Bottomwear | 2,537 |
| Dress | 480 |
| Outerwear | 279 |

**Training approach:**
- Stage 1 — frozen backbone, classification head only (warmup epochs)
- Stage 2 — unfreeze `layer4` for partial fine-tuning
- 80/20 train/validation split, batch size 32
- Class-weighted loss to handle the severe Tops vs Outerwear imbalance (~46:1)

**Final validation results:**

| Class | Precision | Recall | F1 |
|-------|-----------|--------|----|
| Tops | 0.996 | 0.968 | 0.982 |
| Bottomwear | 0.983 | 0.989 | 0.986 |
| Shoes | 0.999 | 0.999 | 0.999 |
| Dress | 0.739 | 0.940 | 0.828 |
| Outerwear | 0.542 | 0.968 | 0.695 |
| **Weighted avg** | **0.985** | **0.979** | **0.981** |

Outerwear precision (0.542) is the weakest point due to its small sample size (279 images). The model over-predicts Outerwear in ambiguous cases.

**Why no image cropping:** The Myntra dataset images are already centered on the labeled item, with other garments only at the periphery. Rule-based cropping (top 55% for tops, bottom 55% for bottoms) was tested but found to be unnecessarily aggressive — images were already 80–90% the target item. Training on full images performed better.

**Why ResNet-50:** Strong ImageNet pretraining provides transferable visual features without requiring a large fashion-specific dataset from scratch. Fine-tuning only the final layer and `layer4` keeps compute low enough for a standard laptop.

---

### Model B — Occasion Classifier

A second fine-tuned ResNet-50 trained to predict which of 3 occasions a clothing item belongs to: `casual`, `formal`, `sports`.

**Why only 3 occasions:** Early experiments with 5 classes (including Ethnic and Smart Casual) produced poor recall on underrepresented classes. Collapsing to 3 well-represented and visually distinct occasions improved macro F1 significantly and makes the recommendation logic more reliable and explainable.

**Class imbalance handling:** Two approaches were used:
- Class-weighted CrossEntropyLoss (v1 training)
- Data capping — Casual capped at 2,000 rows while keeping all Sports + Formal rows (v2 training)

**Final validation results (v2):**

| Occasion | Precision | Recall | F1 |
|----------|-----------|--------|----|
| Casual | 0.842 | 0.838 | 0.840 |
| Sports | 0.930 | 0.928 | 0.929 |
| Formal | 0.947 | 0.955 | 0.951 |

---

### Model C — Attribute Predictor (Multi-Head CNN) *(in progress)*

A shared **ResNet-50 backbone with three prediction heads**, trained on the [DeepFashion](http://mmlab.ie.cuhk.edu.hk/projects/DeepFashion.html) Fine-Grained Attribute dataset to predict clothing attributes used by the recommendation engine.

| Head | Classes | Applies To |
|------|---------|------------|
| `pattern_family` | solid, graphic, striped, other | Tops, Bottomwear, Outerwear |
| `material_family` | denim, leather, other | Tops, Bottomwear, Outerwear |
| `sleeve_family` | sleeveless, short_sleeve, long_sleeve | Tops, Outerwear |

**Why one shared model instead of three separate models:** A single backbone with multiple heads allows shared visual feature extraction, is simpler to train and maintain, and uses masked supervision — each category only trains the heads relevant to it. Bottomwear never contributes gradient signal to the `sleeve_family` head.

**Masked supervision:** Each training sample carries a binary mask per head. Heads irrelevant to the garment category use `ignore_index=-100` in the loss so they contribute no gradient for inapplicable samples.

**Two-stage training:**
- Stage 1 — frozen backbone, head warmup
- Stage 2 — unfreeze `layer3` and `layer4` with lower learning rate (`5e-5`)

**Final validation results (V3):**

| Head | Accuracy | Majority Baseline | Macro F1 |
|------|----------|-------------------|----------|
| `pattern_family` | 0.796 | 0.534 | 0.718 |
| `material_family` | 0.742 | 0.662 | 0.632 |
| `sleeve_family` | 0.927 | 0.507 | 0.919 |

`material_family` is the weakest head — only 8 points above the majority baseline. It is treated as a low-weight signal in the recommendation engine.

**Current status:** Model C weights exist and are trained. Integration into `app.py` is in progress.

---

### Color Extraction

Dominant color is extracted using **k-means clustering** (k=3) on the image pixels, resized to 100×100 before clustering. Near-white pixels are masked out before clustering to prevent white product backgrounds from dominating the result. The dominant cluster centroid is mapped to the closest named color using Euclidean distance in RGB space across a 13-color palette: black, white, cream, gray, brown, tan, red, orange, yellow, green, blue, pink, purple.

---

### Outfit Recommendation Engine *(in progress)*

The outfit engine (`recommendation/RECOMMENDATION_LOGIC_V1.md`) is a deterministic rule-based scoring system. It is not a learned compatibility model — there is no outfit-level training dataset with true compatibility labels, so a rule-based approach is more reliable and explainable at this stage.

**Scoring weights:**

| Signal | Weight |
|--------|--------|
| Occasion consistency | 30% |
| Color compatibility | 25% |
| Slot completeness | 15% |
| Pattern compatibility | 15% |
| Sleeve / layering | 10% |
| Material compatibility | 5% |

The engine applies an **occasion penalty layer** before finalizing scores — outfits with occasion mismatches are penalized or rejected regardless of visual compatibility scores. A closest-score fallback allows items from adjacent occasions to fill empty slots, but only when the item scores at least 0.35 for the target occasion and the gap to its top occasion is at most 0.15.

Every outfit suggestion includes a short natural-language explanation (e.g. "The solid top anchors the striped bottom" or "All pieces align with the same casual occasion").

---

## Repository Structure

```
StyleSync/
├── app.py                          ← Gradio inference app (deployed to HF Spaces)
├── requirements.txt                ← Python dependencies for app.py
│
├── models/
│   ├── resnet50_stylesync.pt               ← Model A v1 (currently live)
│   ├── resnet50_stylesync_improved.pt      ← Model A v2 (pending deployment)
│   └── resnet50_stylesync_occasion_v2.pt   ← Model B (occasion classifier)
│
├── DeepFashion/
│   ├── attribute_modeling/
│   │   └── model_b_v1/
│   │       ├── model_b_v1_training.ipynb   ← Model C v1 training
│   │       ├── model_b_v2_training.ipynb   ← Model C v2/v3 training
│   │       ├── MODEL_B_V1_MODELING.md      ← Model C design spec
│   │       └── outputs/
│   │           ├── model_b_v3_material_merged_resnet50_best.pt  ← Model C weights (best)
│   │           └── model_b_v3_material_merged_label_vocabs.json ← Label vocab mapping
│   ├── data/
│   │   ├── anno_fine_v2_common_items_material_merged.csv        ← Model C training CSV
│   │   └── img/                            ← DeepFashion images (large, local only)
│   └── occasion_scoring/                   ← Scripts and docs for occasion label derivation
│
├── data/
│   ├── combined_df.csv             ← 23,393 rows, merged styles + images, filtered to 5 subCategories
│   ├── balanced_df.csv             ← Class-balanced subset
│   ├── images.csv                  ← Raw Myntra image ID → URL mapping
│   ├── styles.csv                  ← Raw Myntra metadata
│   └── images/                     ← Downloaded Myntra images (large, local only)
│
├── notebooks/
│   ├── data_exploration.ipynb
│   ├── image_preprocessing.ipynb
│   ├── classifier_training_baseline.ipynb
│   ├── baseline_improved.ipynb
│   ├── model_training.ipynb
│   ├── model_eval_full_dataset.ipynb       ← Final Model A evaluation metrics
│   ├── occasion_classifier_training.ipynb  ← Model B v1 training
│   ├── occasion_classifier_v2.ipynb        ← Model B v2 training (data capping)
│   └── occasion_distribution_analysis.ipynb
│
├── scripts/
│   ├── crop_clothing.py            ← Center-zoom preprocessing utility (tested, not used in final pipeline)
│   └── download_balanced_images.py ← Downloads balanced image subset from Myntra URLs
│
├── recommendation/
│   └── RECOMMENDATION_LOGIC_V1.md  ← Full outfit engine design spec
│
├── StyleSync-Frontend/             ← Static React prototype (source of truth for UI)
│   ├── index.html
│   ├── app.jsx
│   ├── screens-*.jsx               ← Screen components: home, upload, wardrobe, outfits, remix
│   └── uploads/                    ← Sample wardrobe images
│
├── stylesync-vercel/               ← Next.js app (the deployed product)
│   ├── app/
│   │   └── api/
│   │       ├── predict/route.ts    ← POST → forwards image to HF Space
│   │       ├── upload/route.ts     ← POST → Vercel Blob storage
│   │       ├── wardrobe/route.ts   ← GET / POST → Vercel KV
│   │       ├── wardrobe/[id]/      ← DELETE / PATCH → Vercel KV
│   │       ├── outfits/route.ts    ← GET / POST → Vercel KV
│   │       └── outfits/[id]/       ← DELETE → Vercel KV
│   ├── lib/
│   │   ├── hf-client.ts            ← Hugging Face Space API client
│   │   ├── kv-store.ts             ← Vercel KV CRUD: wardrobe + outfit items
│   │   └── types.ts                ← Shared TypeScript types
│   └── public/                     ← Static frontend (copy of StyleSync-Frontend)
│       ├── index.html
│       ├── api-client.js           ← JS shim bridging static frontend → Next.js API routes
│       └── screens-*.jsx
│
└── backend/                        ← DEAD: only __pycache__ remains, not used
```

---

## Models

All models use ResNet-50 pretrained on ImageNet as the backbone.

| Model | File | Task | Status |
|-------|------|------|--------|
| Model A v1 | `models/resnet50_stylesync.pt` | Clothing category (5 classes) | ✅ Live in HF Space |
| Model A v2 | `models/resnet50_stylesync_improved.pt` | Clothing category (5 classes) | 🔄 Trained, pending deployment |
| Model B | `models/resnet50_stylesync_occasion_v2.pt` | Occasion (3 classes) | 🔄 Trained, pending integration |
| Model C | `DeepFashion/.../model_b_v3_material_merged_resnet50_best.pt` | Pattern, material, sleeve (3 heads) | 🔄 Trained, pending integration |

**Model weights are not committed to GitHub** due to file size. Contact a team member for access to the `.pt` files.

---

## Setup & Running Locally

### Prerequisites

- Python 3.10+
- Node.js 18+

### 1. Clone the repo

```bash
git clone https://github.com/manasamaddi1/StyleSync.git
cd StyleSync
```

### 2. Run the Gradio inference app locally

```bash
pip install -r requirements.txt
python app.py
```

Gradio runs at **http://localhost:7860**. You can upload a clothing image and get a JSON prediction directly from the UI, or call it programmatically via the Gradio API.

The `app.py` currently requires `resnet50_stylesync.pt` to be present in the project root. Make sure the model file is downloaded before running.

### 3. Run the Next.js frontend locally

```bash
cd stylesync-vercel
cp .env.local.example .env.local    # fill in values — see Environment Variables
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

### 4. Full local stack

For the full pipeline to work locally you need both running simultaneously:

- Terminal 1: `python app.py` (Gradio on port 7860)
- Terminal 2: `cd stylesync-vercel && npm run dev` (Next.js on port 3000)

Set `HF_SPACE_ID` in `.env.local` to point the Next.js API routes at your local Gradio instance instead of the deployed HF Space. Since `hf-client.ts` uses `@gradio/client` with just the Space ID, for local development you may need to run the Gradio app and call it directly at `http://localhost:7860`.

---

## Environment Variables

### `stylesync-vercel/.env.local`

| Variable | Description |
|----------|-------------|
| `HF_SPACE_ID` | Hugging Face Space ID for the inference app (e.g. `aaron8wong/stylesync-app`). Defaults to `aaron8wong/stylesync-app` if not set. Override this to point at a different Space or a local Gradio instance. |
| `KV_URL` | Vercel KV connection URL — auto-injected by Vercel when KV is provisioned |
| `KV_REST_API_URL` | Vercel KV REST URL — auto-injected by Vercel |
| `KV_REST_API_TOKEN` | Vercel KV token — auto-injected by Vercel |
| `KV_REST_API_READ_ONLY_TOKEN` | Vercel KV read-only token — auto-injected by Vercel |

The four `KV_*` variables are automatically set by Vercel when Vercel KV storage is enabled on the project. For local development, you can find these values in the Vercel dashboard under Storage → your KV database → `.env.local` tab.

---

## Deployment

### Frontend — Vercel

The frontend deploys automatically on every push to `main`. No manual steps required. Vercel builds the Next.js app and serves the static frontend from `public/`.

**To redeploy manually:**
```bash
cd stylesync-vercel
npx vercel --prod
```

### ML Inference — Hugging Face Spaces

The Gradio app (`app.py`) is deployed to [aaron8wong/stylesync-app](https://huggingface.co/spaces/aaron8wong/stylesync-app).

**To update the HF Space:**
1. Push updated `app.py` and `requirements.txt` to the HF Space repo
2. Upload updated `.pt` model weights via the HF Space Files tab
3. The Space restarts automatically

---

## Limitations & Known Issues

| Area | Limitation |
|------|------------|
| **Models B and C not yet live** | The deployed HF Space currently runs Model A (category) and color extraction only. Occasion and attribute predictions are pending integration into `app.py`. |
| **Outerwear precision** | Model A precision for Outerwear is 0.542 — the model over-predicts Outerwear for ambiguous items (heavy jackets, cardigans) due to the small training set (279 images). |
| **Material head is weak** | Model C's `material_family` head scores only 8 points above the majority-class baseline. It is intentionally down-weighted in the recommendation engine and should not be used as a strong signal. |
| **Color misses white backgrounds** | The k-means color extractor masks near-white pixels, but may still pick up off-white or cream backgrounds as the dominant color on very light garments. |
| **Outfit engine not yet deployed** | `RECOMMENDATION_LOGIC_V1.md` defines the full rule-based scoring system but it has not been implemented in code yet. Current outfit suggestions in the frontend are placeholder logic. |
| **Model weights not in repo** | `.pt` files are excluded from version control due to size. The Gradio app will fail to start without them present. |
| **No Dress or Shoes attribute predictions** | Model C only covers Tops, Bottomwear, and Outerwear. Shoes are handled through category, occasion, and color only. Dresses are out of scope for attribute prediction. |
| **Session-level wardrobe only** | Wardrobe data is tied to Vercel KV session keys. There is no user authentication — all items in a session are shared by anyone with the same session identifier. |
| **Recommendation engine not yet signal-complete** | The V1 engine cannot model silhouette, fit balance, item length, footwear attributes, season, or personal style preference. It is strongest on color harmony, occasion consistency, and basic pattern compatibility. |