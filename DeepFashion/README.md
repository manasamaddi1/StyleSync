# DeepFashion Notes

This folder contains the DeepFashion data and reference notes we can use for StyleSync.

## What This Dataset Is Good For

DeepFashion is useful for:

- clothing category classification
- clothing attribute prediction
- style-related attribute prediction
- optional bounding-box and landmark based preprocessing

For StyleSync, the most helpful pieces are:

- predicting the clothing item type, such as blouse, jacket, dress, or shorts
- predicting clothing attributes that can later be mapped to style genres
- using the official train, validation, and test split

## Current Local Structure

```text
DeepFashion/
└── data/
    ├── Anno_coarse/
    ├── Anno_fine/
    ├── Eval/
    └── img/
```

## What Is Inside `data/`

### `data/img`

- JPEG image files
- standard RGB clothing images
- easy to feed into a ResNet pipeline after resize, tensor conversion, and normalization

### `data/Anno_coarse`

Main large annotation set for the category and attribute benchmark.

Important files:

- `list_category_cloth.txt`
  - maps category ids to category names
  - contains 50 clothing categories
- `list_category_img.txt`
  - maps each image path to a category label
  - covers 289,222 images
- `list_attr_cloth.txt`
  - lists 1,000 attributes and their attribute types
- `list_attr_img.txt`
  - per-image multi-label attribute annotations
- `list_bbox.txt`
  - bounding boxes for clothing items
- `list_landmarks.txt`
  - fashion landmarks for upper-body, lower-body, and full-body items

Attribute type meanings:

- `1`: texture-related
- `2`: fabric-related
- `3`: shape-related
- `4`: part-related
- `5`: style-related

This is the most useful annotation folder for our project.

### `data/Anno_fine`

Smaller fine-grained subset with train, val, and test text files for:

- categories
- attributes
- bounding boxes
- landmarks

This can be useful for experiments or faster iteration on a smaller subset.

### `data/Eval`

- `list_eval_partition.txt`
- official split for 289,222 images

Current counts:

- train: 209,222
- val: 40,000
- test: 40,000

## Why This Helps StyleSync

This dataset does more than basic clothing classification.

It can support:

1. clothing item classification
2. attribute prediction
3. style inference from attributes

Example workflow:

1. Train a model to predict clothing category.
2. Train a model, or a second head, to predict attributes.
3. Map predicted attributes into higher-level style genres such as `Athletic`, `Business Casual`, or `Punk`.

DeepFashion already includes style-related attributes, so it can help with genre prediction indirectly even if it does not directly label every image with our exact genre names.

## ResNet Compatibility

The JPEG images are easy to use with a ResNet model.

Typical preprocessing:

- load image with PIL or OpenCV
- resize to a fixed size such as `224x224`
- convert to tensor
- normalize with ImageNet mean and standard deviation if using a pretrained ResNet


## Download

Dataset source:

- Official DeepFashion project page: [ADD LINK HERE]
- Team download/setup instructions: [ADD LINK HERE]

Suggested setup note:

- keep the raw dataset local
- document the expected folder path as `StyleSync/DeepFashion/data/`
- if teammates need it, provide a small setup script or written download steps instead of pushing the full dataset to Git

## Licensing

DeepFashion is intended for non-commercial research and educational use. Check the official release terms before using it outside the class project context.
