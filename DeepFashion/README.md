# DeepFashion Notes

This folder contains the local DeepFashion data we can use for StyleSync.

The short version:

- `Anno_coarse` is the main full dataset annotation set for the `289,222` benchmark images.
- `Eval` contains the official `train` / `val` / `test` split for that full dataset.
- `Anno_fine` is a separate smaller subset with `20,000` images and simpler aligned split files.
- The main join key is always the image path string, usually called `image_name`.

## Why We Want This Dataset

DeepFashion is much more useful for StyleSync than a small Kaggle fashion set because it gives us:

- many more images
- many more clothing categories
- many more clothing attributes
- optional bounding boxes
- optional landmark points
- official evaluation splits

That means we can train for:

1. clothing category prediction
2. multi-label attribute prediction
3. later style mapping from attributes into StyleSync style genres

## Local Folder Structure

```text
DeepFashion/
├── README.md
├── deepFashionEDA.ipynb
└── data/
    ├── Anno_coarse/
    ├── Anno_fine/
    ├── Eval/
    └── img/
```

## Dataset Rundown

### Images

- image root: `data/img/`
- image format: `.jpg`
- local image folders: about `5,620`
- annotated images in the benchmark files: `289,222`
- images are grouped by item folder, for example:
  - `img/Sheer_Pleated-Front_Blouse/img_00000001.jpg`
  - `img/Sheer_Pleated-Front_Blouse/img_00000002.jpg`
- each folder is usually one clothing item with multiple views or photos

Approximate dataset shape:

- average images per folder: about `51.5`
- median images per folder: `50`
- smallest folder: `1` image
- largest folder: `179` images

### Categories

The full dataset has `50` categories.

Category type codes:

- `1`: upper-body
- `2`: lower-body
- `3`: full-body / outerwear

Examples:

- upper-body: `Blouse`, `Jacket`, `Tee`, `Tank`
- lower-body: `Jeans`, `Skirt`, `Shorts`, `Leggings`
- full-body / outerwear: `Dress`, `Jumpsuit`, `Romper`, `Coat`

Most common categories locally:

- `Dress`: `72,158`
- `Tee`: `36,887`
- `Blouse`: `24,557`
- `Shorts`: `19,666`
- `Tank`: `15,429`

### Attributes

The full coarse annotation set has `1,000` attributes.

Attribute type codes:

- `1`: texture-related
- `2`: fabric-related
- `3`: shape-related
- `4`: part-related
- `5`: style-related

Counts by type:

- texture: `156`
- fabric: `218`
- shape: `180`
- part: `216`
- style: `230`

On average, each image has about `3.32` positive attributes in the coarse labels.

Common attributes include:

- `print`
- `floral`
- `lace`
- `knit`
- `sleeve`
- `maxi`
- `shirt`
- `denim`
- `striped`
- `chiffon`

## What Each Folder Does

### `data/img`

This is the actual image data.

You will train on these JPEGs.

### `data/Anno_coarse`

This is the main full-size annotation set and the most important folder for StyleSync.

It includes:

- full per-image categories
- full per-image attributes
- full per-image bounding boxes
- full per-image landmarks

Use this when you want to train on the full DeepFashion benchmark.

### `data/Eval`

This provides the official split for the full coarse dataset.

File:

- `list_eval_partition.txt`

Counts:

- `train`: `209,222`
- `val`: `40,000`
- `test`: `40,000`

Use this when building your main training dataframe from `Anno_coarse`.

### `data/Anno_fine`

This is a separate smaller benchmark subset.

It includes:

- `20,000` total images
- `14,000` train
- `2,000` val
- `4,000` test
- `26` simplified attributes instead of `1,000`
- matching split files for categories, attributes, boxes, and landmarks

This is helpful if you want:

- a smaller and cleaner experiment first
- a simpler attribute task
- faster debugging before using the full coarse benchmark

## Which TXT Files Matter

There are a lot of `.txt` files, but they fall into a few groups.

### Full Coarse Dataset Files

These are the main files for the full `289,222` image benchmark.

#### Category dictionary

- `data/Anno_coarse/list_category_cloth.txt`

What it does:

- maps category id to category name
- also includes category type

Example meaning:

- category `3` maps to `Blouse`

#### Per-image categories

- `data/Anno_coarse/list_category_img.txt`

What it does:

- maps each `image_name` to a category id

This is the file you use for per-image category labels.

#### Attribute dictionary

- `data/Anno_coarse/list_attr_cloth.txt`

What it does:

- lists all `1,000` attribute names
- gives the attribute type for each attribute

This tells you what each attribute column means.

#### Per-image attributes

- `data/Anno_coarse/list_attr_img.txt`

What it does:

- maps each `image_name` to `1,000` attribute labels
- uses `1` for present and `-1` for not present

This is the main full-dataset attribute label file.

This is the answer to the question "which txt file actually shows the attributes for each image?" for the coarse dataset.

#### Per-image bounding boxes

- `data/Anno_coarse/list_bbox.txt`

What it does:

- maps each `image_name` to `x_1 y_1 x_2 y_2`

Useful for cropping the clothing region before training.

#### Per-image landmarks

- `data/Anno_coarse/list_landmarks.txt`

What it does:

- maps each `image_name` to landmark coordinates
- also includes `clothes_type` and `variation_type`

Useful for more advanced preprocessing or pose-aware modeling.

### Full Coarse Split File

- `data/Eval/list_eval_partition.txt`

What it does:

- maps each `image_name` to `train`, `val`, or `test`

This is the official split file for the full dataset.

### Fine Subset Files

These files belong to the smaller `20,000` image fine subset.

#### Fine attribute dictionary

- `data/Anno_fine/list_attr_cloth.txt`

What it does:

- lists the `26` fine attributes

The fine attributes are:

- `floral`
- `graphic`
- `striped`
- `embroidered`
- `pleated`
- `solid`
- `lattice`
- `long_sleeve`
- `short_sleeve`
- `sleeveless`
- `maxi_length`
- `mini_length`
- `no_dress`
- `crew_neckline`
- `v_neckline`
- `square_neckline`
- `no_neckline`
- `denim`
- `chiffon`
- `cotton`
- `leather`
- `faux`
- `knit`
- `tight`
- `loose`
- `conventional`

#### Fine attribute file with image names included

- `data/Anno_fine/list_attr_img.txt`

What it does:

- maps each fine-subset image to `26` attribute labels
- uses `0` / `1` values

This is the easiest fine-subset attribute file to read because it already includes `image_name`.

#### Fine category dictionary

- `data/Anno_fine/list_category_cloth.txt`

What it does:

- maps category ids to names for the fine subset
- it uses the same `50` categories

#### Fine split image-name files

- `data/Anno_fine/train.txt`
- `data/Anno_fine/val.txt`
- `data/Anno_fine/test.txt`

What they do:

- list the image paths in each split

#### Fine split attribute files

- `data/Anno_fine/train_attr.txt`
- `data/Anno_fine/val_attr.txt`
- `data/Anno_fine/test_attr.txt`

What they do:

- give the `26` binary attributes for each image
- row order matches the corresponding `train.txt`, `val.txt`, or `test.txt`

Important:

- these files do not repeat the image names
- you must align them by row number with the corresponding split file

#### Fine split category files

- `data/Anno_fine/train_cate.txt`
- `data/Anno_fine/val_cate.txt`
- `data/Anno_fine/test_cate.txt`

What they do:

- give one category id per row
- row order matches the corresponding split image list

#### Fine split box files

- `data/Anno_fine/train_bbox.txt`
- `data/Anno_fine/val_bbox.txt`
- `data/Anno_fine/test_bbox.txt`

What they do:

- give bounding boxes
- row order matches the corresponding split image list

#### Fine split landmark files

- `data/Anno_fine/train_landmarks.txt`
- `data/Anno_fine/val_landmarks.txt`
- `data/Anno_fine/test_landmarks.txt`

What they do:

- give landmark coordinates
- row order matches the corresponding split image list

## How The Labels Connect To The Pictures

### For the coarse dataset

The connection is direct.

Every major annotation file starts with the same `image_name`, for example:

```text
img/Sheer_Pleated-Front_Blouse/img_00000001.jpg
```

That same exact string appears in:

- `list_category_img.txt`
- `list_attr_img.txt`
- `list_bbox.txt`
- `list_landmarks.txt`
- `list_eval_partition.txt`

So yes, for the coarse dataset you can merge on `image_name`.

That is the main join key.

### For the fine dataset

There are two patterns.

Pattern 1:

- `list_attr_img.txt` already includes image names, so it can be joined directly

Pattern 2:

- `train_attr.txt`, `val_attr.txt`, `test_attr.txt`
- `train_cate.txt`, `val_cate.txt`, `test_cate.txt`
- `train_bbox.txt`, `val_bbox.txt`, `test_bbox.txt`
- `train_landmarks.txt`, `val_landmarks.txt`, `test_landmarks.txt`

These do not include image names on each row.

Instead, they align by row order with:

- `train.txt`
- `val.txt`
- `test.txt`

So for `Anno_fine`, you usually build each split dataframe by reading the split image list first and then attaching the other files by row index.

## Recommended Files For StyleSync

If the goal is the best large training set, use:

- `data/Anno_coarse/list_category_img.txt`
- `data/Anno_coarse/list_attr_img.txt`
- `data/Anno_coarse/list_bbox.txt`
- `data/Eval/list_eval_partition.txt`
- `data/Anno_coarse/list_category_cloth.txt`
- `data/Anno_coarse/list_attr_cloth.txt`

If the goal is a quick first prototype, use:

- `data/Anno_fine/train.txt`
- `data/Anno_fine/train_attr.txt`
- `data/Anno_fine/train_cate.txt`
- and the matching `val` / `test` files

## Recommended Script Plan

The cleanest first script is a dataframe builder for the coarse dataset.

### Goal

Create one merged CSV with:

- `image_name`
- `image_path`
- `split`
- `category_id`
- `category_name`
- `category_type`
- optional `bbox`
- optional positive attribute names
- optional full multi-hot attribute columns

### Suggested Steps

1. Set `DATA_ROOT = DeepFashion/data/`.
2. Read `list_category_cloth.txt` into a category lookup table.
3. Read `list_attr_cloth.txt` into an attribute lookup table.
4. Read `list_category_img.txt` into a dataframe with columns:
   - `image_name`
   - `category_id`
5. Read `list_attr_img.txt` into a dataframe with columns:
   - `image_name`
   - `attr_1` through `attr_1000`
6. Read `list_eval_partition.txt` into a dataframe with columns:
   - `image_name`
   - `split`
7. Optionally read `list_bbox.txt` into:
   - `image_name`
   - `x1`
   - `y1`
   - `x2`
   - `y2`
8. Merge everything on `image_name`.
9. Add `image_path = DATA_ROOT / image_name`.
10. Map `category_id` to `category_name` and `category_type`.
11. Convert attribute columns into either:
   - raw multi-hot columns
   - or a list of positive attribute names per image
12. Save the merged dataframe to CSV or Parquet.

### Important Parsing Notes

- coarse attribute labels use `1` and `-1`, not `0` and `1`
- fine attribute labels use `0` and `1`
- the coarse text files are whitespace-separated
- some local folder names may have small capitalization differences from annotation paths, so validate path existence before training

### Good First Output

A very useful first artifact would be:

- `deepfashion_coarse_merged.csv`

with one row per image.

Then you can make smaller derivatives like:

- category-only training CSV
- attribute-only training CSV
- cropped-image CSV using bbox data

## Suggested Modeling Path

For StyleSync, a sensible order is:

1. Build the merged coarse dataframe.
2. Train a category classifier first.
3. Train a multi-label attribute model second.
4. Map predicted attributes into your custom style buckets.

If you want faster iteration first:

1. start with `Anno_fine`
2. debug the loader and training loop there
3. move to `Anno_coarse` once the pipeline works

## Notes About The Current Local Folder

- `deepFashionEDA.ipynb` currently exists but is empty
- the README is currently the best local guide
- the image tree has a few path naming inconsistencies to watch for when validating paths

## Licensing

DeepFashion is generally intended for research and educational use. Check the original release terms before using it outside the class-project context.
