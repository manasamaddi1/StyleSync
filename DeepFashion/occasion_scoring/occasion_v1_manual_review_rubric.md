# Occasion V1 Manual Review Rubric

Use this rubric when reviewing rows from [review_sample_stratified.csv](/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/validation/review_sample_stratified.csv).

## Goal

Judge whether the assigned `top_occasion` is defensible for the item based on:

- category
- pattern
- material
- fit
- length
- sleeve coverage
- neckline
- the assigned `second_occasion`

## Review Fields

Each reviewed row should fill in:

- `review_status`
- `preferred_label_if_wrong`
- `review_reason_code`
- `review_notes`

## Allowed Review Status Values

- `correct`
  - the `top_occasion` is the best label
- `acceptable_alt`
  - the `top_occasion` is not the reviewer’s first choice, but still believable
- `wrong`
  - the `top_occasion` is not defensible and should be replaced

## Preferred Label Rule

If `review_status = wrong`, then `preferred_label_if_wrong` must be one of:

- `casual`
- `everyday_polished`
- `business_casual`
- `formal`
- `social`

If `review_status` is `correct` or `acceptable_alt`, leave `preferred_label_if_wrong` blank.

## Reason Codes

Use one primary reason code per row.

- `too_casual`
- `too_dressy`
- `material_overweighted`
- `pattern_overweighted`
- `fit_overweighted`
- `category_overweighted`
- `rare_rule_noise`
- `guardrail_needed`
- `acceptable_borderline`

## Review Guidance

### `casual`

Usually defensible for:

- tees
- jeans
- joggers
- leggings
- graphic items
- denim-heavy items
- loose or sporty pieces

### `everyday_polished`

Usually defensible for:

- blouses
- skirts
- cardigans
- cleaner solid or striped items
- pieces that look more styled than casual but not clearly officewear or formalwear

### `business_casual`

Usually defensible for:

- blazers
- structured blouses
- clean skirts
- polished cardigans
- solid, long-sleeve, crew-neckline items with workwear energy

### `formal`

Should stay rare.

Only mark as clearly correct when the item has strong dressy cues such as:

- blazer-like tailoring
- chiffon
- polished solid styling
- maxi/formal silhouette
- clearly elevated construction

### `social`

Should stay rare.

Usually defensible for:

- tight + mini combinations
- leather/faux statement pieces
- embroidered or chiffon pieces with going-out energy

## Acceptance Targets

The scorer is good enough for V1 if the review sample shows:

- low obvious-error rate overall
- very low obvious-error rate for `formal`
- very low obvious-error rate for `social`
- most disagreements are `acceptable_alt`, not `wrong`
