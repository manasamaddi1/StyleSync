# Occasion V1 Tuning Log

This log records the explicit tuning passes used to move from the original hardcoded scorer to the current auditable rubric-based scorer.

## Pass 1: Category Sanity

Main intent:

- reduce category overreach
- keep broad-safe defaults
- prevent special items from looking too dressy by default

Changes:

- lowered `Blouse` from a dual elevated base to a safer `everyday_polished` + `business_casual` profile
- removed default `social` lift from `Tank`, `Top`, `Shorts`, and `Skirt`
- removed default `formal` lift from `Coat`
- kept `Blazer` as the main workwear/formal-leaning category

Why:

- categories were previously doing too much work on their own
- `Coat` especially was becoming `formal` too easily
- conservative baselines make later modifiers easier to trust

## Pass 2: Modifier Sanity

Main intent:

- make material and pattern rules more realistic
- add explicit suppressions for obvious mismatches

Changes:

- kept `denim` as a strong `casual` boost and added strong penalties against `business_casual` / `formal`
- kept `graphic` as a `casual` boost and added a `formal` suppression
- reduced `knit` and `faux` as sources of accidental `formal`
- kept `chiffon`, `embroidered`, `tight`, and `mini_length` as the main rare-label drivers
- added category-specific rules:
  - `Leggings` and `Joggers` strongly suppress dressy labels
  - `Shorts` strongly suppress `formal`
  - `Tank` defaults back toward `casual` unless it has dressier signals
  - `Coat` is no longer treated as formal by default
  - `sleeveless` suppresses workwear/formal signals

Why:

- these are the easiest rules to defend visually
- they directly target the most obvious false positives

## Pass 3: Ambiguity Control

Main intent:

- avoid forcing `formal` or `social` when the evidence is weak
- preserve explainability while preferring broad-safe labels

Changes:

- added label guardrails for `formal` and `social`
- added `min_score` and `min_margin` thresholds
- added forbidden category/pattern/material checks for those rare labels
- added low-margin tracking with:
  - `top_score`
  - `second_score`
  - `score_margin`
  - `low_confidence`
  - `guardrail_applied`
- added conservative fallback behavior so weak `formal` / `social` cases fall back to safer labels

Why:

- these are the labels that are hardest to verify
- the scorer should only use them when the case is easy to justify

## Pass 4: Rare-Label Quality

Main intent:

- keep `formal` and `social` rare but defensible
- make their audit process explicit

Changes:

- created the validation workflow and review sample generator
- added edge-case audits for:
  - denim with dressy labels
  - graphic with `formal`
  - shorts with `formal`
  - joggers/leggings outside `casual`
  - blazer with `casual`
  - coat with weakly justified `formal`
- added the manual review rubric and stratified review sample
- added a narrow positive formal rule for:
  - `Blouse` + `chiffon` + `square_neckline` + `long_sleeve`
- added a negative formal rule for:
  - `sleeveless Coat`

Why:

- rare labels need stronger evidence than common labels
- this makes future rule edits traceable and reviewable
