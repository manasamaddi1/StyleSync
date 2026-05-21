# Model B V1 Modeling Spec

This folder contains the active PyTorch training workspace for Model B.

Model B is the shared attribute model that runs after category prediction.

Its purpose is to predict recommendation-friendly clothing attributes from a single clothing image for:

- `tops`
- `bottomwear`
- `outerwear`

Shoes are intentionally out of scope for this recommendation-focused track.

## Why One Shared Model

V1 uses one shared CNN backbone with multiple prediction heads instead of separate models per category.

Why:

- simpler training pipeline
- shared visual features help across categories
- easier to maintain than three separate attribute models
- category-specific logic is handled by masking irrelevant heads

## Active V2 Heads

The notebook implements these 3 active heads:

1. `pattern_family`
2. `material_family`
3. `sleeve_family`

Head definitions come from [MODEL_B_V1_HEADS.md](/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/attribute_modeling/MODEL_B_V1_HEADS.md).

## Label Sets

### `pattern_family`

- `solid`
- `graphic`
- `floral`
- `striped`
- `embroidered`
- `other`

### `material_family`

- `denim`
- `knit`
- `chiffon`
- `leather`
- `other`

### `sleeve_family`

- `sleeveless`
- `short_sleeve`
- `long_sleeve`

## Category-Based Supervision Rules

### Tops

Supervise:

- `pattern_family`
- `material_family`
- `sleeve_family`

### Bottomwear

Supervise:

- `pattern_family`
- `material_family`

Ignore:

- `sleeve_family`

### Outerwear

Supervise:

- `pattern_family`
- `material_family`
- `sleeve_family`

## Data Contract

The notebook uses:

- input CSV: [anno_fine_v2_common_items_material_merged.csv](/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/data/anno_fine_v2_common_items_material_merged.csv)
- image root: `DeepFashion/data/img/`

Expected columns:

- `image_path`
- `category_group`
- `pattern_family`
- `material_family`
- `sleeve_family`

V2 material rule:

- `faux` is merged into `leather` in the derived V2 CSV
- notebook preprocessing also maps any lingering `faux` value to `leather`

## Active Training Recipe

### Backbone

- `torchvision.models.resnet50`
- pretrained ImageNet weights
- shared feature extractor

### Heads

- one linear head per attribute family
- shared projection before the heads

### Device

- prefer MPS when available
- fall back to CPU automatically

### Training

- local disk images only
- `224x224` inputs
- moderate train-time augmentation
- optional weighted sampler focused on `material_family`
- stage 1 head warmup with a frozen backbone
- stage 2 unfreezes `layer4` for partial fine-tuning

### Loss

- one `CrossEntropyLoss` per head
- use masked targets with `ignore_index=-100`
- use class weights to reduce material imbalance
- aggregate the 3 losses into one total loss
- track majority baselines, macro F1, and per-class recall

### Outputs

The notebook should save:

- V2 model checkpoint
- V2 label vocab mapping JSON
- optional metrics JSON

Recommended output folder:

- `attribute_modeling/model_b_v1/outputs/`

## Notebook Deliverable

The main notebook should be decision-complete and runnable end to end.

It should include:

- path setup
- config
- CSV loading
- label vocab creation
- dataset and transforms
- dataloaders
- multi-head model definition
- masked loss computation
- training loop
- validation loop
- checkpoint saving
- sample prediction inspection
