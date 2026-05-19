# Occasion V1 Execution Notes

This file records the actual V1 execution choices used to turn the reduced DeepFashion fine dataset into an occasion-oriented modeling dataset.

It answers:

- what we kept
- what we dropped
- why we dropped it
- what files were generated

## V1 Decision

For V1, we are not trying to model every clothing category in DeepFashion.

We are intentionally simplifying the space to make the recommendation layer cleaner and more learnable.

The main V1 constraints are:

1. drop full-body clothing
2. drop rare categories
3. drop categories that are semantically too different from the rest of their group
4. keep only common, coherent items across tops, bottoms, and outerwear

## Source File

The V1 build starts from:

- [anno_fine_outfit_features.csv](/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/data/anno_fine_outfit_features.csv)

This is already the reduced attribute dataset built from `Anno_fine`.

## Categories Kept In V1

### Tops

- `Tee`
- `Blouse`
- `Tank`
- `Sweater`
- `Top`

Why:

- these are common
- they are visually coherent as a group
- they are useful for casual to dressy outfit recommendations

### Bottoms

- `Shorts`
- `Skirt`
- `Jeans`
- `Leggings`
- `Joggers`

Why:

- these are common enough to be usable
- they cover the main bottom silhouettes in the dataset
- they give a usable spread from casual to slightly polished

### Outerwear

- `Cardigan`
- `Jacket`
- `Blazer`
- `Coat`

Why:

- these are common enough
- they are good occasion-shifting layers
- they give useful structure differences from casual to formal

## Categories Dropped In V1

### Full-body clothing dropped completely

Examples:

- `Dress`
- `Romper`
- `Jumpsuit`
- `Kimono`
- `Kaftan`
- `Robe`
- `Onesie`
- `Coverup`
- `Caftan`

Why:

- full-body items do not fit cleanly into the app’s first pairing logic
- V1 is easier if we start with top + bottom + outerwear reasoning
- they can be added back later as a separate recommendation path

### Rare or inconsistent top-like items dropped

Examples:

- `Henley`
- `Jersey`
- `Turtleneck`
- `Flannel`
- `Button-Down`
- `Halter`

Why:

- too few examples
- likely to add noise
- not worth teaching the V1 system yet

### Rare or inconsistent bottom-like items dropped

Examples:

- `Cutoffs`
- `Sweatshorts`
- `Jeggings`
- `Chinos`
- `Culottes`
- `Trunks`
- `Capris`
- `Jodhpurs`
- `Sarong`

Why:

- too few examples
- some are highly specialized
- some do not match the main bottom distributions well

### Rare or inconsistent outerwear-like items dropped

Examples:

- `Hoodie`
- `Poncho`
- `Parka`
- `Bomber`
- `Anorak`
- `Peacoat`

Why:

- some are rare
- some are too stylistically different from the core outerwear group
- for V1, they risk making the occasion rules noisy

## Final V1 Category Groups

### `top`

- `Tee`
- `Blouse`
- `Tank`
- `Sweater`
- `Top`

### `bottom`

- `Shorts`
- `Skirt`
- `Jeans`
- `Leggings`
- `Joggers`

### `outerwear`

- `Cardigan`
- `Jacket`
- `Blazer`
- `Coat`

## Generated Files

### 1. Filtered common-item dataset

- [anno_fine_v1_common_items.csv](/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/data/anno_fine_v1_common_items.csv)

This file contains:

- only the kept V1 categories
- the reduced outfit features
- a `category_group` column

### 2. Occasion-scored V1 dataset

- [anno_fine_v1_occasion_scored.csv](/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/data/anno_fine_v1_occasion_scored.csv)

This file contains:

- the filtered V1 items
- `category_group`
- occasion scores
- `top_occasion`
- `second_occasion`
- `top_occasion_reasons`

## Scoring Logic Used

The scoring is intentionally rule-based for V1.

Broad idea:

- category gives the base score
- pattern adjusts it
- material adjusts it
- fit adjusts it
- length adjusts it
- sleeve and neckline provide smaller refinements

Example:

- `Blazer` strongly boosts `business_casual` and `formal`
- `graphic` boosts `casual`
- `denim` boosts `casual`
- `chiffon` boosts `formal`
- `tight` boosts `social`
- `solid` boosts cleaner occasions like `everyday_polished`, `business_casual`, and `formal`

## Why This Is A Good V1

- much cleaner category space
- easier to train and debug
- easier to explain recommendations
- avoids special-case garments too early
- supports the top + bottom + outerwear workflow well

## Known Limitations

- dresses are excluded for now even though they matter a lot for real occasion dressing
- rare categories are intentionally ignored
- V1 occasion labels are heuristic, not ground truth
- color is still missing

## Next Suggested Use

Use [anno_fine_v1_occasion_scored.csv](/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/data/anno_fine_v1_occasion_scored.csv) as the working dataset for:

- occasion prototyping
- rule tuning
- pairing tops with bottoms
- later layering outerwear on top
