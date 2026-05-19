# StyleSync Occasion V1 Plan

This document defines a compact V1 attribute schema and the first-pass pipeline for inferring occasion from clothing items.

The goal is not to solve all fashion recommendation at once.

The goal of V1 is:

1. detect a clothing item
2. convert it into a small set of useful fashion signals
3. infer likely occasion categories from those signals
4. later combine multiple items into an outfit recommendation

## Why We Need A V1

DeepFashion is strong at item-level clothing understanding:

- category
- pattern
- material hints
- fit hints
- some silhouette details

DeepFashion is not directly labeled with:

- occasion
- dress code
- outfit compatibility
- user preference

So the right use of DeepFashion is:

- use it as the structured item-understanding layer
- then build an occasion-scoring layer on top

## V1 Design Principle

We should not predict every possible attribute.

We should predict only the smallest set of features that is useful for:

- casual vs dressy decisions
- pairing items together
- explaining recommendations

## Compact V1 Schema

This is the recommended V1 schema for each clothing item.

### 1. Category

This is the most important first step.

- `category_name`
  - examples: `Tee`, `Blouse`, `Jeans`, `Dress`, `Blazer`
- `category_group`
  - `top`
  - `bottom`
  - `dress`
  - `outerwear`

Why it matters:

- category is the strongest clue for whether an item is casual, dressy, or versatile
- category also tells us which later attributes are relevant

### 2. Pattern Family

- `solid`
- `graphic`
- `floral`
- `striped`
- `embroidered`
- `other`

Why it matters:

- `solid` usually reads cleaner and easier to pair
- `graphic` often pushes more casual
- `floral` and `embroidered` can feel more styled or feminine
- strong patterns affect outfit pairing rules

### 3. Material Family

- `denim`
- `knit`
- `chiffon`
- `leather`
- `faux`
- `other`

Why it matters:

- material is one of the clearest signals for formality and season
- `denim` usually leans casual
- `chiffon` usually leans dressier
- `knit` usually leans casual or cozy
- `leather` can read edgy or elevated depending on category

### 4. Fit Family

- `tight`
- `loose`
- `pleated`
- `other`

Why it matters:

- fit helps with outfit pairing
- `loose` + `tight` is a common balancing rule
- some fit cues affect how formal or polished the item feels

### 5. Length Family

- `mini_length`
- `maxi_length`
- `regular`
- `not_applicable`

Why it matters:

- mostly important for dresses and bottoms
- helps separate more casual short pieces from dressier long silhouettes

### 6. Sleeve Family

- `sleeveless`
- `short_sleeve`
- `long_sleeve`
- `not_applicable`

Why it matters:

- sleeve coverage matters for occasion and season
- long sleeves often read more polished than tanks or sleeveless pieces

### 7. Neckline Family

- `crew_neckline`
- `v_neckline`
- `square_neckline`
- `other`
- `not_applicable`

Why it matters:

- neckline is a useful refinement for tops and dresses
- not the strongest signal alone, but helpful as a tiebreaker

## What V1 Uses From DeepFashion Right Now

From the current reduced file [anno_fine_outfit_features.csv](/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/data/anno_fine_outfit_features.csv), we already have:

- `category_name`
- `category_type`
- `pattern_family`
- `material_family`
- `fit_family`
- `length_family`
- `sleeve_family`
- `neckline_family`

That means V1 can be built now, even without extra dataset changes.

## Category Group Mapping

We need a simple mapping from raw category names into four app-level groups.

### Tops

Examples:

- `Tee`
- `Blouse`
- `Tank`
- `Top`
- `Sweater`
- `Button-Down`
- `Turtleneck`
- `Hoodie`

### Bottoms

Examples:

- `Jeans`
- `Shorts`
- `Skirt`
- `Leggings`
- `Joggers`
- `Chinos`
- `Sweatpants`

### Dresses

Examples:

- `Dress`
- `Sundress`
- `Shirtdress`

### Outerwear

Examples:

- `Blazer`
- `Jacket`
- `Cardigan`
- `Coat`
- `Bomber`
- `Parka`
- `Peacoat`

Note:

- some full-body DeepFashion categories like `Romper`, `Jumpsuit`, and `Kimono` do not fit perfectly into these four groups
- for V1, these can either be treated as `dress`-like or handled as special cases

## Occasion Labels For V1

These are the first app-level occasion targets.

- `casual`
- `everyday_polished`
- `business_casual`
- `formal`
- `social`

This is a manageable first set.

It is much easier than trying to directly classify very specific events like:

- formal dinner
- rooftop brunch
- networking mixer

Later, the app can map from these broad labels into more specific use cases.

## Occasion Inference Pipeline

This is the recommended step-by-step V1 pipeline.

### Step 1. Predict Or Read Item Features

For each clothing item, extract:

- `category_name`
- `category_group`
- `pattern_family`
- `material_family`
- `fit_family`
- `length_family`
- `sleeve_family`
- `neckline_family`

This can come from:

- DeepFashion-based model predictions
- or the current DeepFashion annotations during experimentation

### Step 2. Convert Features Into Occasion Signals

Turn raw features into a smaller set of style meanings.

Examples:

- `denim` -> casual signal
- `graphic` -> casual signal
- `knit` -> casual / cozy signal
- `chiffon` -> dressy signal
- `blazer` -> polished / formal signal
- `solid` -> clean / versatile signal
- `embroidered` -> styled / decorative signal
- `long_sleeve` -> slightly more polished signal

This step is easier to reason about than jumping straight from raw attributes to final occasion labels.

### Step 3. Score Each Occasion

Each item gets a score for each occasion:

- `casual_score`
- `everyday_polished_score`
- `business_casual_score`
- `formal_score`
- `social_score`

These scores can start as simple rules.

Example idea:

- `Tee` adds to `casual`
- `Jeans` adds to `casual`
- `Blazer` adds to `business_casual` and `formal`
- `Dress` adds to `everyday_polished`, `formal`, or `social` depending on material and length
- `graphic` increases `casual`
- `chiffon` increases `formal`
- `denim` increases `casual`
- `solid` slightly increases `business_casual` and `formal`

### Step 4. Pick The Best Occasion Label

After scoring, select:

- the top occasion label
- optionally the top 2 labels if the item is versatile

Example:

- blazer: `business_casual` primary, `formal` secondary
- floral blouse: `everyday_polished` primary, `business_casual` secondary
- graphic tee: `casual` primary

### Step 5. Use Occasion + Compatibility For Outfit Recommendation

After each item has occasion scores, recommend outfits by combining:

- occasion alignment
- category pairing rules
- compatibility rules

For example:

- only pair items whose top occasion scores are compatible
- avoid mixing a strongly `formal` blazer with very `casual` graphic shorts unless the app intentionally supports contrast styling

## Suggested First-Pass Scoring Rules

These are intentionally simple.

### Casual

Increase `casual_score` for:

- `Tee`
- `Tank`
- `Hoodie`
- `Sweater`
- `Jeans`
- `Shorts`
- `denim`
- `graphic`
- `knit`
- `loose`

### Everyday Polished

Increase `everyday_polished_score` for:

- `Blouse`
- `Top`
- `Cardigan`
- `Skirt`
- `solid`
- `striped`
- `v_neckline`
- `mini_length` or `regular` when the rest of the item is polished

### Business Casual

Increase `business_casual_score` for:

- `Blazer`
- `Blouse`
- `Button-Down`
- `Skirt`
- `Cardigan`
- `solid`
- `long_sleeve`
- `crew_neckline`
- clean silhouettes with low pattern intensity

### Formal

Increase `formal_score` for:

- `Dress`
- `Blazer`
- `Coat`
- `chiffon`
- `solid`
- `maxi_length`
- more polished silhouettes

Reduce `formal_score` for:

- `graphic`
- `denim`
- `Hoodie`
- `Shorts`

### Social

Increase `social_score` for:

- `Dress`
- `mini_length`
- `tight`
- `leather`
- `faux`
- `embroidered`
- statement silhouettes

## Example Inference

### Example 1

Item:

- `Blazer`
- `solid`
- `long_sleeve`
- `v_neckline`

Interpretation:

- polished category
- clean pattern
- structured sleeve coverage

Likely output:

- `business_casual`: high
- `formal`: medium
- `everyday_polished`: medium

### Example 2

Item:

- `Tee`
- `graphic`
- `loose`

Interpretation:

- relaxed category
- casual pattern
- relaxed fit

Likely output:

- `casual`: high
- `everyday_polished`: low
- `formal`: very low

### Example 3

Item:

- `Dress`
- `chiffon`
- `maxi_length`
- `solid`

Interpretation:

- dressy material
- long silhouette
- clean pattern

Likely output:

- `formal`: high
- `social`: medium
- `everyday_polished`: low to medium

## What This V1 Does Well

- gives a clean starting point for recommendation
- is explainable
- works with current DeepFashion-derived features
- does not require occasion labels to begin prototyping

## What This V1 Does Not Solve Yet

- color coordination
- weather sensitivity
- user taste
- trend awareness
- full outfit-level style supervision
- subtle social context

These can be added later.

## Recommended Next Build Steps

1. create a script that maps `category_name` to `category_group`
2. create an occasion scoring script for each item
3. save a new CSV with:
   - item features
   - occasion scores
   - top occasion label
4. build outfit-pairing logic on top of that file

## Summary

V1 should not try to predict occasion directly from raw images in one jump.

V1 should do this:

1. identify the clothing item
2. reduce the item into a compact attribute schema
3. infer broad occasion scores using rules
4. use those scores to recommend compatible outfits

This gives StyleSync a practical and explainable first recommendation system using the DeepFashion features we already have.
