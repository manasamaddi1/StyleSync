# Recommendation Logic V1

This document defines the first recommendation layer for StyleSync before implementation.

The goal is to use the outputs of the current CV pipeline to generate explainable outfit recommendations from a user's closet.

## V1 Recommendation Goal

Each clothing item is first converted into a structured item record using:

- category group
- occasion class
- color
- `pattern_family`
- `material_family`
- `sleeve_family`

Then the recommendation layer uses those signals to build outfits that are:

- visually compatible
- occasion-consistent
- explainable
- stable and repeatable for real closet use

## Style Objective

V1 should optimize for:

- timeless compatibility
- explainability
- stable closet matching
- not seasonal trend imitation

This is important because the app does not yet have the signals or labels needed to support highly editorial or trend-reactive styling.

The V1 engine should be grounded in a few stable outfit-building principles:

- keep the color palette tight
- use one anchor or one statement piece
- use neutrals or a grounded base to support bolder elements
- mix patterns carefully rather than freely
- use texture/material contrast as a secondary refinement, not the main driver

This matches common fashion guidance from editorial and style sources more closely than trying to imitate runway-level styling logic.

## Occasion Labels

V1 recommendation uses only these three occasion classes:

- `casual`
- `formal`
- `sports`

This is intentionally simple because the recommendation layer should be easy to debug and easy to explain.

## Available Signals

### Current Final Attribute Model

The current final attribute checkpoint for recommendation is the V3 pattern-simplified model:

- `models/model_b_v3_pattern_simplified_resnet50_best.pt`

This model uses the final recommendation-facing attribute schema:

- `pattern_family`
  - `solid`
  - `graphic`
  - `floral`
  - `striped`
  - `other`
- `material_family`
  - `denim`
  - `knit`
  - `chiffon`
  - `leather`
  - `other`
- `sleeve_family`
  - `sleeveless`
  - `short_sleeve`
  - `long_sleeve`

The earlier `embroidered` pattern class was collapsed into `other` in the final V3 setup because it was the weakest and least stable pattern class.

On the held-out test set, this final attribute model achieved:

- `pattern_family`
  - accuracy: `0.7955`
  - macro F1: `0.7176`
- `material_family`
  - accuracy: `0.7415`
  - macro F1: `0.6323`
- `sleeve_family`
  - accuracy: `0.9270`
  - macro F1: `0.9194`

This is the model the recommendation layer should treat as the current source of truth.

### 1. Category

Predicted by the category model:

- `top`
- `bottom`
- `outerwear`
- `shoes`

This is the strongest structural signal because it determines which slots an item can fill.

### 2. Occasion

Predicted by the occasion model:

- `casual`
- `formal`
- `sports`

This is the primary signal for candidate filtering.

### 3. Color

Predicted by the K-means color classifier.

This is one of the most useful recommendation signals because it is:

- visually important
- intuitive to explain
- strong enough to matter even when some attributes are noisy

### 4. Pattern Family

Current working labels:

- `solid`
- `graphic`
- `floral`
- `striped`
- `other`

This is a useful mid-strength signal for balancing an outfit.

### 5. Material Family

Current working labels:

- `denim`
- `knit`
- `chiffon`
- `leather`
- `other`

This is useful, but less reliable than category, occasion, color, and sleeve.

### 6. Sleeve Family

Current working labels:

- `sleeveless`
- `short_sleeve`
- `long_sleeve`

This is mostly useful for coverage and layering logic.

## Final Model Reliability Guidance

Based on the final Model B V3 results, the recommendation layer should not treat every signal equally.

### Strong Signals

These are reliable enough to use directly:

- category
- occasion
- color
- `pattern_family`
  - especially `solid`, `striped`, `graphic`, `floral`
- `sleeve_family`

### Medium Signals

These should help refine a recommendation, but not dominate it:

- `material_family`
  - especially `denim`
  - then `knit`
  - then `leather`

### Weak / Cautious Signals

These should have lower influence:

- `pattern_family = other`
- `material_family = chiffon`
- `material_family = other`

Concrete rule:

- no weak signal should override strong color agreement or strong occasion agreement
- weak signals should only break ties or slightly boost or depress an outfit score

This means the V1 scoring system should be reliability-weighted rather than flat.

## Best V1 Approach

The best V1 implementation is a **rule-based scoring engine**.

Not a learned compatibility model.

### Why Rule-Based Is Best Right Now

- there is no outfit-level training dataset with true compatibility labels
- the upstream item models are good, but not perfect
- the app needs explainable results
- rule-based logic is easier to debug and tune against obvious failures
- it fits the current frontend better than a heavy backend ranking model

### Why Not Pure Learned Compatibility Yet

A learned recommendation model would require:

- true outfit-level labels
- negative examples
- a much larger evaluation setup
- stronger confidence calibration from upstream models

That is not the best next step for the current state of the project.

### Best Practical Framing

V1 should be:

- occasion-centered
- rule-based
- weighted by signal reliability
- explanation-friendly

## Recommendation Data Record

Each closet item should be stored in a canonical recommendation format like:

- `id`
- `label`
- `image`
- `category_group`
- `subcategory`
- `occasion`
- `occasion_confidence` or occasion score if available
- `color_name`
- `color_swatch`
- `pattern_family`
- `material_family`
- `sleeve_family`
- optional fallback fields:
  - `tags`
  - `fabric`
  - `manual_overrides`

The recommendation logic should primarily use model outputs.

Manual `tags` and `fabric` should only be fallback or override signals when structured predictions are missing.

## Outfit Structure

V1 outfit slots:

- `top`
- `bottom`
- optional `outerwear`
- optional `shoes`

Minimum valid outfit:

- `top + bottom`

Optional:

- add `outerwear` if it supports the same overall vibe and does not clash
- add `shoes` if available

Important V1 preference:

- try to fill all slots if strong candidates exist
- do not force weak items into an outfit just to make it look complete
- a strong `top + bottom` look is better than a full outfit with a poor outerwear or shoe match

## Occasion Behavior

V1 recommendation is still occasion-centered, but not perfectly hard-constrained.

The actual rule should be:

- the target occasion is always primary
- items from the target occasion should dominate the candidate pool
- if a slot is empty, allow a closest-score fallback from another occasion
- this fallback should be limited and penalized, not treated as equally good

This is the best compromise between:

- maintaining occasion consistency
- and still filling more slots when strong candidates actually exist

In practice, V1 should not rely on weights alone to enforce this behavior.

It should use an explicit occasion penalty layer before the final weighted score.

### Closest-Score Fallback Rule

For V1, closest-score fallback should mean:

- if a slot cannot be filled from the target-occasion pool
- look only at remaining items in the same slot category
- rank them by their score for the target occasion
- select the highest target-occasion scorer among the non-target items

Fallback should only be allowed if both are true:

- target-occasion score is at least `0.35`
- the gap between the item's top occasion score and the target-occasion score is at most `0.15`

This keeps fallback strict enough to preserve outfit coherence while still helping sparse closets.

## V1 Recommendation Pipeline

### Step 1. Choose Target Occasion

The user or the app selects one occasion:

- `casual`
- `formal`
- `sports`

### Step 2. Filter Closet Into Candidate Pools

Build separate candidate pools for:

- tops
- bottoms
- outerwear
- shoes

Candidate selection rules:

- first include items whose predicted occasion matches the target occasion
- if a slot is too sparse, allow a closest-score fallback from another occasion
- fallback items must take a score penalty

### Step 3. Generate Candidate Outfits

Create outfit combinations from those candidate pools.

For V1:

- prioritize `top + bottom`
- then optionally layer `outerwear`
- then optionally add `shoes`
- do not require every optional slot to be filled if the best candidate is weak

### Step 4. Score Each Outfit

Each outfit gets a total score made from several sub-scores.

Before computing the final weighted score, apply an occasion penalty stage:

- if an item matches the target occasion, no penalty
- if an item is a closest-score fallback from another occasion, apply a noticeable penalty
- if an item is a strong mismatch, apply a large penalty or reject the outfit entirely

This is better than relying on weights alone because it makes occasion the real controlling rule.

## V1 Scoring System

### 1. Occasion Consistency Score

Highest weight.

Reward:

- all items strongly align with the target occasion

Penalty:

- fallback items from another occasion
- weak occasion alignment
- obvious occasion clashes

Important:

- occasion should behave like a gated rule, not just another soft feature
- an outfit with a strong occasion mismatch should not be rescued by good color or pattern compatibility

### 2. Slot Completeness Score

Medium weight.

Reward:

- valid outfit structure
- `top + bottom`
- optional useful layer
- optional shoes

Penalty:

- incomplete outfit

Important:

- slot completeness should matter, but not more than strong visual compatibility
- a partial outfit with strong occasion, color, and pattern agreement should beat a full outfit with weak add-on pieces

### 3. Color Compatibility Score

High weight.

This should be the strongest visual compatibility signal after occasion.

Reward:

- tonal or monochrome combinations
- neutral base + one accent
- restrained complementary pairing
- repeated palette coherence across the outfit

Penalty:

- too many competing loud colors
- visually muddy color combinations

Practical V1 color strategies:

- tonal / monochrome
- neutral base + one accent
- restrained complementary pairing

#### Color Groups

V1 should use these color groups:

##### Neutrals

- `black`
- `white`
- `cream`
- `gray`
- `brown`
- `tan`

##### Cool Accents

- `blue`
- `green`
- `purple`

##### Warm Accents

- `red`
- `orange`
- `yellow`
- `pink`

#### Exact V1 Color Rules

Reward most:

- all neutrals
- tonal / same-family outfits
- one accent + neutrals
- warm-with-warm palettes
- cool-with-cool palettes

Allow, but lower score:

- two accents if one is clearly dominant and the other is softer
- warm + cool only when a neutral anchor exists

Penalize:

- more than one strong accent color by default
- multiple unrelated bright colors
- warm and cool accents mixed without a neutral anchor
- too many unique colors in one outfit

Practical V1 summary:

- neutrals always pair safely
- allow at most one strong accent color by default
- if accents exist, at least one other item should be neutral
- tonal dressing should receive a strong reward

### 4. Pattern Compatibility Score

Medium-high weight.

Reward:

- `solid` anchors the outfit
- one statement pattern paired with solids
- clean combinations like `solid + striped`

Penalty:

- too many strong patterns together
- noisy combinations like `graphic + floral`

Practical V1 rule:

- allow at most one strong non-solid statement piece by default

#### Pattern Groups

V1 should use these pattern groups:

##### Quiet Patterns

- `solid`
- `striped`

##### Loud Patterns

- `graphic`
- `floral`

##### Uncertain Pattern

- `other`

#### Exact V1 Pattern Rules

Reward most:

- `solid + solid`
- `solid + striped`
- `solid + graphic`
- `solid + floral`
- `striped + solid`

Allow, but lower score:

- `striped + striped`
- `striped + graphic`
- `striped + floral`

Penalize:

- `graphic + floral`
- `graphic + graphic`
- `floral + floral`
- `other + loud pattern`

Practical V1 summary:

- at least one main garment should be `solid` or `striped`
- allow at most one loud pattern by default
- `other` should behave like an uncertain pattern and should not drive styling strongly

### 5. Material Compatibility Score

Medium-low weight.

Reward:

- materials that support the overall mood without fighting the occasion

Examples:

- `denim + knit` works well for `casual`
- `chiffon + cleaner outerwear` can support `formal`

Penalty:

- combinations that push the outfit into conflicting visual moods

Important:

- material should behave more like a texture and mood refinement than a primary driver

### 6. Sleeve / Layering Score

Medium weight.

Reward:

- sleeve combinations that feel visually coherent
- sensible layering with outerwear

Penalty:

- awkward layer combinations
- outerwear that visually fights the top

This should refine ranking, not dominate it.

#### Exact V1 Sleeve / Layering Rules

Reward most:

- `long_sleeve top + outerwear`
- `short_sleeve top + outerwear`
- `sleeveless top + outerwear` when the occasion supports it
- no-outerwear outfits where sleeve does not conflict with the occasion

Allow, but lower score:

- `short_sleeve` in `formal`
- `sleeveless` in `formal` only when other signals are strong

Penalize:

- `sleeveless` in `formal`
- awkward outerwear + top combinations where coverage looks inconsistent
- any rare sleeveless outerwear-like case if it appears

Practical V1 summary:

- `formal` should prefer more coverage than `casual` or `sports`
- if `outerwear` exists, `long_sleeve` and `short_sleeve` tops should be slightly preferred over `sleeveless`
- sleeve should refine ranking and layering, but should not outweigh occasion or color

## Explicit V1 Formula

The V1 engine should use the following initial scoring weights:

- occasion consistency: `30%`
- color compatibility: `25%`
- slot completeness: `15%`
- pattern compatibility: `15%`
- sleeve/layering compatibility: `10%`
- material compatibility: `5%`

These are implementation defaults, not just illustrative examples.

## Occasion Penalty Layer

V1 should apply occasion penalties before the weighted score is finalized.

Recommended behavior:

- exact target-occasion item:
  - no penalty
- closest-score fallback item:
  - medium penalty
- obvious occasion mismatch:
  - large penalty or reject the outfit

Practical V1 interpretation:

- the weighted score should rank compatible outfits
- the occasion penalty layer should stop visually nice but occasion-wrong outfits from rising too high

So the final scoring flow should be:

1. compute weighted compatibility score
2. subtract occasion mismatch penalties
3. reject outfits that violate hard mismatch rules

## Occasion-Specific Rules

### Casual

Should allow:

- `solid`
- `graphic`
- `striped`
- `denim`
- `knit`

More flexibility in color and layering.

### Formal

Should prefer:

- cleaner colors
- fewer loud patterns
- more polished materials
- more controlled layering

Should strongly penalize:

- `graphic`
- very casual color combinations
- obviously sporty items

Additional formal preferences:

- reward `solid` and `striped` more than louder patterns
- prefer outfits with more sleeve coverage
- prefer neutral or restrained color palettes
- allow `floral` only when anchored cleanly

### Sports

Should prefer:

- simple, functional pairings
- less decorative pattern logic
- clean sport-aligned color combinations

Should strongly penalize:

- overtly formal materials
- dressy combinations

Additional sports preferences:

- favor simpler color logic over decorative styling
- allow `graphic` more than in `formal`
- sleeve matters less here than occasion and color simplicity

## Explanations

Every recommendation should return a short explanation, not just a score.

Examples:

- "All pieces align closely with the same casual occasion."
- "The solid top anchors the patterned bottom."
- "The colors stay in the same soft neutral family."
- "This layer supports the outfit without adding visual noise."

This is important because the app should feel interpretable rather than black-box.

## What The Current System Cannot See Well

The recommender does **not** currently model:

- silhouette or fit balance at the outfit level
- body proportion
- item length balance
- footwear attributes
- season or weather
- user-specific style preference
- true outfit compatibility labels

This matters because a lot of fashion styling quality depends on silhouette and proportion, but the current model outputs mostly support:

- color
- occasion
- broad pattern
- broad material
- sleeve coverage

So V1 is strongest on:

- color harmony
- occasion consistency
- statement-versus-anchor balancing
- basic layer compatibility

And weaker on:

- editorial silhouette logic
- nuanced formalwear composition
- advanced sports styling
- personal taste adaptation

## Main Problems We Need To Solve

### 1. Frontend Data Shape Is Not Ready Yet

The current frontend still relies heavily on:

- freeform `tags`
- optional `fabric`
- seed wardrobe labels

The recommendation engine needs structured model outputs stored per item.

### 2. Occasion Is Item-Level, Not Outfit-Level

Even if every item is predicted as `formal`, the final combination may still not feel formal.

So the system still needs outfit-level compatibility scoring after occasion filtering.

### 3. Shoes Are In The UI But Not In The Attribute Model

Shoes should be included in V1 only through:

- category
- occasion
- color

Do not require pattern, material, or sleeve compatibility for shoes.

### 4. Some Signals Are Noisy

The system cannot treat all predicted attributes as hard truth.

This is why reliability-weighted scoring is the best approach.

### 5. Sparse Formal And Sports Closets

Some users will not have enough items in every occasion-slot combination.

V1 should not force weak items just to fill every slot.

Instead:

- always try to fill more slots if strong candidates exist
- allow limited fallback only when the candidate is still plausible
- prefer a stronger partial outfit over a weaker fully filled outfit

### 6. Color May Matter More Than Some Attributes

This should be treated as a strength, not a bug.

Color is one of the strongest practical recommendation signals in the current system and should be allowed to matter more than weak material classes.

### 7. Frontend Still Uses `tags` And `fabric`

These should be fallback or manual override signals only.

They should not be the main recommendation driver once structured predictions are available.

## What Not To Do In V1

- do not try to learn full outfit compatibility from scratch
- do not make every attribute a hard constraint
- do not rely mainly on freeform `tags`
- do not treat weak material predictions as strong rules
- do not overcomplicate shoes

## V1 Implementation Recommendation

The recommendation layer should be implemented as a deterministic module with functions like:

- `filter_items_by_occasion(items, occasion)`
- `build_candidate_pools(items)`
- `score_outfit(outfit, occasion)`
- `rank_outfits(outfits)`
- `explain_outfit(outfit)`

This keeps the logic:

- transparent
- testable
- easy to tune later

## Final Recommendation

The best V1 approach is:

- occasion-centered filtering
- limited closest-score fallback
- explicit occasion penalty layer
- rule-based scoring
- reliability-weighted use of attributes
- strong use of color, category, occasion, and pattern
- meaningful use of sleeve/layering logic
- softer use of weaker material classes

This is the best fit for the current models, the current frontend, and the current stage of the project.
