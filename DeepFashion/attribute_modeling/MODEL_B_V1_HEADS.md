# Model B V1 Heads

This document defines the final V1 attribute heads for Model B.

Model B is the shared attribute model that runs after category prediction.

For V1, we are not including shoes.

The supported category groups are:

- `tops`
- `bottomwear`
- `outerwear`

We are also dropping `length_family` from V1 because it was not useful enough for recommendation logic.

## Final V1 Heads

Model B should have these 5 heads:

1. `pattern_family`
2. `material_family`
3. `fit_family`
4. `sleeve_family`
5. `neckline_family`

## Category Usage

### Tops

Use these heads:

- `pattern_family`
- `material_family`
- `fit_family`
- `sleeve_family`
- `neckline_family`

### Bottomwear

Use these heads:

- `pattern_family`
- `material_family`
- `fit_family`

Do not use:

- `sleeve_family`
- `neckline_family`

### Outerwear

Use these heads:

- `pattern_family`
- `material_family`
- `fit_family`
- `sleeve_family`

Do not use:

- `neckline_family`

## Final V1 Label Sets

### 1. `pattern_family`

Label set:

- `solid`
- `graphic`
- `floral`
- `striped`
- `embroidered`
- `other`

Why it stays:

- strongest overall head
- low `other`
- directly useful for recommendation

### 2. `material_family`

Label set:

- `denim`
- `knit`
- `chiffon`
- `leather`
- `faux`
- `other`

Why it stays:

- strong recommendation value
- helps identify casual vs elevated textures
- useful across all three category groups

### 3. `fit_family`

Label set:

- `tight`
- `loose`
- `pleated`
- `other`

Why it stays:

- useful for outfit balancing
- especially helpful for bottomwear
- weaker than pattern/material, but still worth keeping in V1

### 4. `sleeve_family`

Label set:

- `sleeveless`
- `short_sleeve`
- `long_sleeve`

Training note:

- supervise this head for `tops`
- supervise this head for `outerwear`
- do not supervise this head for `bottomwear`

Why it stays:

- strong and visually obvious
- healthy class spread for tops
- still useful for outerwear

### 5. `neckline_family`

Label set:

- `crew_neckline`
- `v_neckline`
- `other`

Training note:

- supervise this head only for `tops`
- do not supervise this head for `bottomwear`
- do not supervise this head for `outerwear`

Why this version:

- `square_neckline` is too rare for V1
- collapsing to `other` makes the head cleaner
- keeps the most useful neckline distinction without overfitting to tiny classes

## Heads Removed From V1

### `length_family`

Dropped from V1.

Why:

- too much `not_applicable`
- almost no useful class separation in the kept categories
- bottomwear was almost entirely `regular`
- not strong enough to justify a full head

## Final Training Behavior

### Heads supervised for all categories

- `pattern_family`
- `material_family`
- `fit_family`

### Heads supervised only for tops

- `neckline_family`

### Heads supervised for tops and outerwear

- `sleeve_family`

## Final Summary

Model B V1 should use:

- 1 shared backbone
- 5 total heads
- category-based masking during training

Final V1 head list:

- `pattern_family`
- `material_family`
- `fit_family`
- `sleeve_family`
- `neckline_family`

Final V1 category mapping:

- `tops`: all 5 heads
- `bottomwear`: first 3 heads
- `outerwear`: first 4 heads
