import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd


MODULE_ROOT = Path(__file__).resolve().parent
RULE_CONFIG_PATH = MODULE_ROOT / "occasion_v1_rule_config.json"
DEFAULT_LABELS = ["casual", "everyday_polished", "business_casual", "formal", "social"]


def load_rule_config(path: Path = RULE_CONFIG_PATH) -> Dict[str, Any]:
    with path.open() as f:
        return json.load(f)


def build_allowed_categories(config: Dict[str, Any]) -> set[str]:
    return {category for categories in config["category_groups"].values() for category in categories}


def category_group_for(name: str, config: Dict[str, Any]) -> Optional[str]:
    for group, categories in config["category_groups"].items():
        if name in categories:
            return group
    return None


def add_score(score_map: Dict[str, int], reason_map: Dict[str, List[str]], occasion: str, points: int, reason: str) -> None:
    score_map[occasion] += points
    sign = "+" if points >= 0 else ""
    reason_map[occasion].append(f"{reason}:{sign}{points}")


def _matches_condition(row: pd.Series, condition: Dict[str, Any]) -> bool:
    field = condition["field"]
    op = condition["op"]
    value = condition["value"]
    row_value = row[field]

    if op == "eq":
        return row_value == value
    if op == "neq":
        return row_value != value
    if op == "in":
        return row_value in value
    if op == "not_in":
        return row_value not in value
    raise ValueError(f"Unsupported condition op: {op}")


def _sorted_labels(scores: Dict[str, int], labels: List[str]) -> List[str]:
    return sorted(labels, key=lambda label: (scores[label], -labels.index(label)), reverse=True)


def _best_available_label(
    ordered_labels: List[str],
    preferred_labels: List[str],
    excluded: Optional[str] = None,
) -> Optional[str]:
    for label in preferred_labels:
        if label in ordered_labels and label != excluded:
            return label
    for label in ordered_labels:
        if label != excluded:
            return label
    return None


def _apply_label_guardrails(
    row: pd.Series,
    scores: Dict[str, int],
    labels: List[str],
    config: Dict[str, Any],
) -> Tuple[str, List[str]]:
    ordered_labels = _sorted_labels(scores, labels)
    top_label = ordered_labels[0]
    second_label = ordered_labels[1]
    top_score = scores[top_label]
    second_score = scores[second_label]
    margin = top_score - second_score
    guard_notes: List[str] = []

    guardrail = config.get("label_guardrails", {}).get(top_label)
    if not guardrail:
        return top_label, guard_notes

    violated = False
    if top_score < guardrail.get("min_score", -10**9):
        violated = True
        guard_notes.append(f"guardrail={top_label}:min_score")
    if margin < guardrail.get("min_margin", -10**9):
        violated = True
        guard_notes.append(f"guardrail={top_label}:min_margin")
    if row["category_name"] in guardrail.get("forbidden_categories", []):
        violated = True
        guard_notes.append(f"guardrail={top_label}:forbidden_category")
    if row["pattern_family"] in guardrail.get("forbidden_patterns", []):
        violated = True
        guard_notes.append(f"guardrail={top_label}:forbidden_pattern")
    if row["material_family"] in guardrail.get("forbidden_materials", []):
        violated = True
        guard_notes.append(f"guardrail={top_label}:forbidden_material")

    if not violated:
        return top_label, guard_notes

    fallback_label = _best_available_label(ordered_labels, guardrail["fallback_order"], excluded=top_label)
    guard_notes.append(f"fallback={top_label}->{fallback_label}")
    return fallback_label, guard_notes


def _apply_conservative_fallback(
    current_label: str,
    row: pd.Series,
    scores: Dict[str, int],
    labels: List[str],
    config: Dict[str, Any],
) -> Tuple[str, List[str]]:
    ordered_labels = _sorted_labels(scores, labels)
    top_score = scores[ordered_labels[0]]
    second_score = scores[ordered_labels[1]]
    margin = top_score - second_score
    threshold = config.get("fallback", {}).get("low_margin_threshold", 0)
    guarded_labels = config.get("fallback", {}).get("guarded_labels", [])
    safe_labels = config.get("fallback", {}).get("safe_labels", ["casual", "everyday_polished"])

    notes: List[str] = []
    if current_label in safe_labels or current_label not in guarded_labels or margin >= threshold:
        return current_label, notes

    fallback_label = _best_available_label(ordered_labels, safe_labels, excluded=current_label)
    notes.append(f"conservative_fallback={current_label}->{fallback_label}")
    return fallback_label, notes


def score_item(row: pd.Series, config: Dict[str, Any]) -> pd.Series:
    labels = config.get("labels", DEFAULT_LABELS)
    scores = {label: 0 for label in labels}
    reasons = {label: [] for label in labels}

    category_name = row["category_name"]
    base_rules = config["base_scores"].get(category_name, {})
    for label, points in base_rules.items():
        add_score(scores, reasons, label, points, f"category={category_name}")

    for family_name, family_rules in config.get("modifiers", {}).items():
        family_value = row[family_name]
        for label, points in family_rules.get(family_value, {}).items():
            add_score(scores, reasons, label, points, f"{family_name}={family_value}")

    for rule in config.get("conditional_rules", []):
        if all(_matches_condition(row, condition) for condition in rule.get("when_all", [])):
            for label, points in rule["deltas"].items():
                add_score(scores, reasons, label, points, f"rule={rule['name']}")

    ordered_before_guard = _sorted_labels(scores, labels)
    raw_top = ordered_before_guard[0]
    raw_second = ordered_before_guard[1]

    top_label, guardrail_notes = _apply_label_guardrails(row, scores, labels, config)
    top_label, fallback_notes = _apply_conservative_fallback(top_label, row, scores, labels, config)

    ordered_after = _sorted_labels(scores, labels)
    second_label = next(label for label in ordered_after if label != top_label)
    top_score = scores[top_label]
    second_score = scores[second_label]
    margin = top_score - second_score
    low_confidence = margin < config.get("fallback", {}).get("low_margin_threshold", 0)
    applied_notes = guardrail_notes + fallback_notes

    top_reason_parts = reasons[top_label] + applied_notes
    return pd.Series(
        {
            "casual_score": scores["casual"],
            "everyday_polished_score": scores["everyday_polished"],
            "business_casual_score": scores["business_casual"],
            "formal_score": scores["formal"],
            "social_score": scores["social"],
            "raw_top_occasion": raw_top,
            "raw_second_occasion": raw_second,
            "top_occasion": top_label,
            "second_occasion": second_label,
            "top_score": top_score,
            "second_score": second_score,
            "score_margin": margin,
            "low_confidence": low_confidence,
            "guardrail_applied": "|".join(applied_notes),
            "top_occasion_reasons": "|".join(top_reason_parts),
        }
    )


def build_filtered_dataset(df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
    allowed_categories = build_allowed_categories(config)
    filtered_df = df[df["category_name"].isin(allowed_categories)].copy()
    filtered_df["category_group"] = filtered_df["category_name"].map(lambda name: category_group_for(name, config))
    return filtered_df


def score_dataframe(df: pd.DataFrame, config: Dict[str, Any]) -> pd.DataFrame:
    scored_columns = df.apply(lambda row: score_item(row, config), axis=1)
    return pd.concat([df.reset_index(drop=True), scored_columns.reset_index(drop=True)], axis=1)
