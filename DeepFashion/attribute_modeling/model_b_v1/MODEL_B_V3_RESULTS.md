# Model B V3 Results

This document summarizes the final working Model B attribute results and what the recommendation layer should rely on versus treat cautiously.

## Final Test Metrics

| Head | Accuracy | Majority Baseline | Macro F1 | Support |
|---|---:|---:|---:|---:|
| `pattern_family` | `0.7955` | `0.5342` | `0.7176` | `2445` |
| `material_family` | `0.7415` | `0.6618` | `0.6323` | `2445` |
| `sleeve_family` | `0.9270` | `0.5074` | `0.9194` | `1768` |

## Per-Class Recall

### `pattern_family`

| Label | Recall |
|---|---:|
| `solid` | `0.9119` |
| `graphic` | `0.6853` |
| `floral` | `0.6986` |
| `striped` | `0.8010` |
| `other` | `0.4327` |

### `material_family`

| Label | Recall |
|---|---:|
| `denim` | `0.8041` |
| `knit` | `0.5559` |
| `chiffon` | `0.4274` |
| `leather` | `0.5000` |
| `other` | `0.8288` |

### `sleeve_family`

| Label | Recall |
|---|---:|
| `sleeveless` | `0.9321` |
| `short_sleeve` | `0.8648` |
| `long_sleeve` | `0.9543` |

## What Improved In V3

- Collapsing `embroidered -> other` helped the `pattern_family` head overall.
- `pattern_family` is now the clearest recommendation signal after `sleeve_family`.
- `material_family` is meaningfully better than baseline and usable, especially for `denim`.
- `sleeve_family` stayed extremely strong and reliable.

## Recommendation Guidance

### Safe To Use As Primary Signals

These are strong enough to directly affect outfit scoring:

- `pattern_family`
  - `solid`
  - `striped`
  - `graphic`
  - `floral`
- `material_family`
  - `denim`
- `sleeve_family`
  - `sleeveless`
  - `short_sleeve`
  - `long_sleeve`

Why:

- these labels have the strongest recall or strongest overall head performance
- they are easier to explain in product language
- they are useful for pairing and occasion refinement

### Use, But With Lower Weight

These should still contribute, but less aggressively:

- `material_family`
  - `knit`
  - `leather`

Why:

- both are usable, but not as stable as `denim`
- they should refine a score, not dominate it

### Treat Cautiously

These should be fallback or soft signals only:

- `pattern_family`
  - `other`
- `material_family`
  - `chiffon`
  - `other`

Why:

- `pattern_family other` has low recall
- `material_family other` is common and easy for the model to over-predict
- `chiffon` is meaningful, but still relatively weak and should not heavily drive recommendation ranking by itself

## What The Recommender Should Do

### Good Uses

- Use `pattern_family` to control visual balance.
  - prefer one statement pattern at a time
  - use `solid` as an anchor
- Use `sleeve_family` for coverage, layering, and seasonality.
- Use `material_family denim` as a strong casual cue.
- Use `knit` and `leather` as secondary style refinements.

### Avoid Over-Relying On

- `other` buckets as hard constraints
- `chiffon` as a dominant ranking signal
- very fine material distinctions when multiple items already match on occasion and color

## Suggested Recommendation Weights

A practical V1 weighting for outfit scoring:

- occasion consistency: highest weight
- category coverage: highest weight
- color harmony: high weight
- `pattern_family`: medium-high weight
- `sleeve_family`: medium weight
- `material_family`: medium weight overall
  - stronger when `denim`
  - weaker when `knit` or `leather`
  - weakest when `other` or uncertain

## Final Takeaway

The current Model B V3 is good enough to support recommendation logic.

The recommendation layer should trust:

- occasion
- category
- color
- `pattern_family`
- `sleeve_family`

It should use `material_family` carefully:

- strong when the prediction is clear like `denim`
- softer when the prediction is `knit`, `leather`, `chiffon`, or `other`

This is a strong V1 recommendation signal set, but not a reason to use every predicted attribute as an equally hard rule.
