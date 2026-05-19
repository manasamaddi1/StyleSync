# Occasion V1 Validation Report

This report summarizes the tuned rule-based scorer output and its main validation artifacts.

## Dataset Overview

- rows scored: `11,987`
- low-confidence rows: `5335`
- conflict rows (`score_margin < 2`): `5335`

### Top Occasion Counts

- `casual`: `7173`
- `everyday_polished`: `3607`
- `business_casual`: `1186`
- `social`: `19`
- `formal`: `2`

### Second Occasion Counts

- `everyday_polished`: `7216`
- `business_casual`: `2701`
- `social`: `990`
- `casual`: `787`
- `formal`: `293`

## Edge Case Audit

- `denim_with_dressy_top`: `13`
- `blazer_with_casual_top`: `6`

## Logic Checks

- `jeans_top_labels`: `{'casual': 497, 'everyday_polished': 5}`
- `joggers_top_labels`: `{'casual': 294}`
- `leggings_top_labels`: `{'casual': 331}`
- `blazer_top_labels`: `{'business_casual': 504, 'everyday_polished': 22, 'casual': 6}`
- `shorts_formal_count`: `0`
- `graphic_formal_count`: `0`
- `denim_formal_count`: `0`

## Dominance Watchlist

- `Leggings`: top label `casual` on `100.0%` of `331` rows
- `Joggers`: top label `casual` on `100.0%` of `294` rows
- `Tee`: top label `casual` on `100.0%` of `2289` rows
- `Shorts`: top label `casual` on `99.8%` of `1160` rows
- `Tank`: top label `casual` on `99.4%` of `1041` rows
- `Jeans`: top label `casual` on `99.0%` of `502` rows
- `Sweater`: top label `casual` on `95.6%` of `800` rows
- `Blazer`: top label `business_casual` on `94.7%` of `532` rows

## Top Drivers By Label

### casual
- `category=Tee`: `2288`
- `pattern_family=graphic`: `2083`
- `sleeve_family=short_sleeve`: `1634`
- `sleeve_family=sleeveless`: `1515`
- `category=Shorts`: `1158`

### everyday_polished
- `pattern_family=solid`: `1909`
- `category=Blouse`: `1306`
- `neckline_family=v_neckline`: `1193`
- `category=Skirt`: `876`
- `material_family=chiffon`: `837`

### business_casual
- `sleeve_family=long_sleeve`: `1148`
- `pattern_family=solid`: `963`
- `neckline_family=crew_neckline`: `680`
- `category=Blazer`: `504`
- `category=Cardigan`: `243`

### formal
- `pattern_family=solid`: `2`
- `material_family=chiffon`: `2`
- `sleeve_family=long_sleeve`: `2`
- `neckline_family=square_neckline`: `2`
- `rule=chiffon_square_blouse_can_be_formal`: `2`

### social
- `fit_family=tight`: `13`
- `pattern_family=embroidered`: `10`
- `material_family=chiffon`: `10`
- `sleeve_family=sleeveless`: `9`
- `pattern_family=floral`: `6`

## Artifacts

- summary CSV: `/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/occasion_scoring/validation/label_distribution_summary.csv`
- edge case CSV: `/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/occasion_scoring/validation/edge_case_audit.csv`
- review sample CSV: `/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/occasion_scoring/validation/review_sample_stratified.csv`
- conflict cases CSV: `/Users/jadenwu/Desktop/StyleSync/StyleSync/DeepFashion/occasion_scoring/validation/conflict_cases.csv`
