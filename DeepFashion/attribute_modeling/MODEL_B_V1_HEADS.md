# Model B V1 Heads

This document defines the final V1 attribute heads for Model B.

Model B is the shared attribute model that runs after category prediction.

For V1, we are not including shoes.

The supported category groups are:

- `tops`
- `bottomwear`
- `outerwear`

We are also dropping `length_family` from V1 because it was not useful enough for recommendation logic.

## Active Recommendation Heads

The active recommendation-focused model uses these 3 heads:

1. `pattern_family`
2. `material_family`
3. `sleeve_family`

## Category Usage

### Tops

Use these heads:

- `pattern_family`
- `material_family`
- `sleeve_family`

### Bottomwear

Use these heads:

- `pattern_family`
- `material_family`

Do not use:

- `sleeve_family`

### Outerwear

Use these heads:

- `pattern_family`
- `material_family`
- `sleeve_family`

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

Label set for the active recommendation-focused V2 track:

- `denim`
- `knit`
- `chiffon`
- `leather`
- `other`

Why this V2 version:

- `faux` was too rare as a standalone class
- `faux` and `leather` overlap visually in the current dataset
- merging `faux -> leather` makes the material head more learnable
- still preserves a useful elevated-texture signal for recommendation

Dataset note:

- the preserved V1 dataset still exists for comparison
- the active V2 modeling dataset remaps `faux` to `leather`

### 3. `sleeve_family`

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

## Heads Removed From V1

### `length_family`

Dropped from V1.

Why:

- too much `not_applicable`
- almost no useful class separation in the kept categories
- bottomwear was almost entirely `regular`
- not strong enough to justify a full head

### `fit_family`

Dropped from the active recommendation track.

Why:

- too dominated by `other`
- weak signal compared with pattern and sleeve
- did not improve recommendation value enough for the added noise

### `neckline_family`

Dropped from the active recommendation track.

Why:

- only useful for tops
- more helpful for item description than pairing logic
- lower recommendation value than the remaining 3 heads

## Final Training Behavior

### Heads supervised for all categories

- `pattern_family`
- `material_family`

### Heads supervised for tops and outerwear

- `sleeve_family`

## Final Summary

Model B V1 should use:

- 1 shared backbone
- 3 active heads
- category-based masking during training

Active head list:

- `pattern_family`
- `material_family`
- `sleeve_family`

Active category mapping:

- `tops`: all 3 heads
- `bottomwear`: `pattern_family`, `material_family`
- `outerwear`: all 3 heads
