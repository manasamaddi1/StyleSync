import math
from pathlib import Path

import pandas as pd


MODULE_ROOT = Path(__file__).resolve().parent
DEEPFASHION_ROOT = MODULE_ROOT.parent
DATA_ROOT = DEEPFASHION_ROOT / "data"
VALIDATION_DIR = MODULE_ROOT / "validation"
SCORED_CSV = DATA_ROOT / "anno_fine_v1_occasion_scored.csv"
SUMMARY_CSV = VALIDATION_DIR / "label_distribution_summary.csv"
EDGE_CASE_CSV = VALIDATION_DIR / "edge_case_audit.csv"
REVIEW_SAMPLE_CSV = VALIDATION_DIR / "review_sample_stratified.csv"
CONFLICT_CASES_CSV = VALIDATION_DIR / "conflict_cases.csv"
REPORT_MD = MODULE_ROOT / "occasion_v1_validation_report.md"


def _append_summary(rows: list[pd.DataFrame], df: pd.DataFrame, summary_type: str, group_cols: list[str]) -> None:
    grouped = df.groupby(group_cols).size().reset_index(name="count")
    total = grouped["count"].sum()
    grouped["share"] = grouped["count"] / total
    grouped["summary_type"] = summary_type
    rows.append(grouped)


def build_label_distribution_summary(df: pd.DataFrame) -> pd.DataFrame:
    rows: list[pd.DataFrame] = []
    _append_summary(rows, df, "top_occasion", ["top_occasion"])
    _append_summary(rows, df, "second_occasion", ["second_occasion"])
    _append_summary(rows, df, "category_name__top_occasion", ["category_name", "top_occasion"])
    _append_summary(rows, df, "category_group__top_occasion", ["category_group", "top_occasion"])
    _append_summary(rows, df, "category_name__second_occasion", ["category_name", "second_occasion"])
    _append_summary(rows, df, "category_group__second_occasion", ["category_group", "second_occasion"])
    return pd.concat(rows, ignore_index=True).fillna("")


def build_edge_case_audit(df: pd.DataFrame) -> pd.DataFrame:
    cases = []

    masks = {
        "denim_with_dressy_top": (df["material_family"] == "denim") & (df["top_occasion"].isin(["business_casual", "formal"])),
        "graphic_with_formal_top": (df["pattern_family"] == "graphic") & (df["top_occasion"] == "formal"),
        "shorts_with_formal_top": (df["category_name"] == "Shorts") & (df["top_occasion"] == "formal"),
        "joggers_or_leggings_not_casual": (df["category_name"].isin(["Joggers", "Leggings"])) & (df["top_occasion"] != "casual"),
        "blazer_with_casual_top": (df["category_name"] == "Blazer") & (df["top_occasion"] == "casual"),
        "coat_formal_without_strong_signal": (
            (df["category_name"] == "Coat")
            & (df["top_occasion"] == "formal")
            & (~df["pattern_family"].isin(["solid", "embroidered"]))
            & (df["material_family"] != "chiffon")
        ),
        "formal_or_social_low_margin": df["top_occasion"].isin(["formal", "social"]) & (df["score_margin"] < 2),
    }

    keep_columns = [
        "image_name",
        "category_name",
        "category_group",
        "pattern_family",
        "material_family",
        "fit_family",
        "length_family",
        "sleeve_family",
        "neckline_family",
        "top_occasion",
        "second_occasion",
        "top_score",
        "second_score",
        "score_margin",
        "low_confidence",
        "guardrail_applied",
        "top_occasion_reasons",
    ]

    for edge_case_type, mask in masks.items():
        subset = df.loc[mask, keep_columns].copy()
        subset.insert(0, "edge_case_type", edge_case_type)
        cases.append(subset)

    if not cases:
        return pd.DataFrame(columns=["edge_case_type"] + keep_columns)
    return pd.concat(cases, ignore_index=True)


def build_review_sample(df: pd.DataFrame) -> pd.DataFrame:
    review_cols = [
        "image_name",
        "image_path",
        "category_name",
        "category_group",
        "pattern_family",
        "material_family",
        "fit_family",
        "length_family",
        "sleeve_family",
        "neckline_family",
        "top_occasion",
        "second_occasion",
        "top_score",
        "second_score",
        "score_margin",
        "low_confidence",
        "guardrail_applied",
        "top_occasion_reasons",
    ]

    samples = []
    for occasion, sub in df.groupby("top_occasion"):
        samples.append(sub.sample(min(20, len(sub)), random_state=7))

    for category, sub in df.groupby("category_name"):
        samples.append(sub.sample(min(6, len(sub)), random_state=11))

    for occasion in ["formal", "social"]:
        sub = df[df["top_occasion"] == occasion]
        if not sub.empty:
            samples.append(sub.sample(min(30, len(sub)), random_state=19))

    if not samples:
        result = df.head(0).copy()
    else:
        result = pd.concat(samples, ignore_index=True).drop_duplicates(subset=["image_name"]).copy()

    result = result.sort_values(["top_occasion", "category_name", "score_margin", "image_name"]).reset_index(drop=True)
    result = result[review_cols]
    result["review_status"] = ""
    result["preferred_label_if_wrong"] = ""
    result["review_reason_code"] = ""
    result["review_notes"] = ""
    return result


def build_conflict_cases(df: pd.DataFrame, margin_threshold: int = 2) -> pd.DataFrame:
    conflict_df = df[df["score_margin"] < margin_threshold].copy()
    return conflict_df.sort_values(["score_margin", "top_score", "category_name", "image_name"]).reset_index(drop=True)


def compute_category_entropy(df: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for category_name, sub in df.groupby("category_name"):
        counts = sub["top_occasion"].value_counts()
        probabilities = counts / counts.sum()
        entropy = -sum(p * math.log2(p) for p in probabilities if p > 0)
        rows.append(
            {
                "category_name": category_name,
                "count": len(sub),
                "top_label": counts.index[0],
                "top_label_share": float(probabilities.iloc[0]),
                "label_entropy": entropy,
            }
        )
    return pd.DataFrame(rows).sort_values(["top_label_share", "count"], ascending=[False, False])


def build_report(df: pd.DataFrame, summary_df: pd.DataFrame, edge_df: pd.DataFrame, conflict_df: pd.DataFrame) -> str:
    top_counts = df["top_occasion"].value_counts()
    second_counts = df["second_occasion"].value_counts()
    low_confidence_count = int(df["low_confidence"].sum())
    category_entropy = compute_category_entropy(df)
    dominance_watch = category_entropy[(category_entropy["count"] >= 100) & (category_entropy["top_label_share"] >= 0.9)]

    top_reason_rows = []
    for occasion in ["casual", "everyday_polished", "business_casual", "formal", "social"]:
        reason_counts = {}
        for reason_str in df.loc[df["top_occasion"] == occasion, "top_occasion_reasons"]:
            for token in str(reason_str).split("|"):
                if not token:
                    continue
                key = token.split(":")[0]
                reason_counts[key] = reason_counts.get(key, 0) + 1
        sorted_reasons = sorted(reason_counts.items(), key=lambda item: item[1], reverse=True)[:5]
        top_reason_rows.append((occasion, sorted_reasons))

    lines = [
        "# Occasion V1 Validation Report",
        "",
        "This report summarizes the tuned rule-based scorer output and its main validation artifacts.",
        "",
        "## Dataset Overview",
        "",
        f"- rows scored: `{len(df):,}`",
        f"- low-confidence rows: `{low_confidence_count}`",
        f"- conflict rows (`score_margin < 2`): `{len(conflict_df)}`",
        "",
        "### Top Occasion Counts",
        "",
    ]
    for label, count in top_counts.items():
        lines.append(f"- `{label}`: `{count}`")

    lines.extend(["", "### Second Occasion Counts", ""])
    for label, count in second_counts.items():
        lines.append(f"- `{label}`: `{count}`")

    lines.extend(["", "## Edge Case Audit", ""])
    edge_counts = edge_df["edge_case_type"].value_counts()
    if edge_counts.empty:
        lines.append("- no edge cases flagged")
    else:
        for edge_case_type, count in edge_counts.items():
            lines.append(f"- `{edge_case_type}`: `{count}`")

    lines.extend(["", "## Logic Checks", ""])
    checks = [
        ("jeans_top_labels", df[df["category_name"] == "Jeans"]["top_occasion"].value_counts().to_dict()),
        ("joggers_top_labels", df[df["category_name"] == "Joggers"]["top_occasion"].value_counts().to_dict()),
        ("leggings_top_labels", df[df["category_name"] == "Leggings"]["top_occasion"].value_counts().to_dict()),
        ("blazer_top_labels", df[df["category_name"] == "Blazer"]["top_occasion"].value_counts().to_dict()),
        ("shorts_formal_count", int(((df["category_name"] == "Shorts") & (df["top_occasion"] == "formal")).sum())),
        ("graphic_formal_count", int(((df["pattern_family"] == "graphic") & (df["top_occasion"] == "formal")).sum())),
        ("denim_formal_count", int(((df["material_family"] == "denim") & (df["top_occasion"] == "formal")).sum()))
    ]
    for name, value in checks:
        lines.append(f"- `{name}`: `{value}`")

    lines.extend(["", "## Dominance Watchlist", ""])
    if dominance_watch.empty:
        lines.append("- no high-dominance categories over the threshold")
    else:
        for _, row in dominance_watch.iterrows():
            lines.append(
                f"- `{row['category_name']}`: top label `{row['top_label']}` on `{row['top_label_share']:.1%}` of `{int(row['count'])}` rows"
            )

    lines.extend(["", "## Top Drivers By Label", ""])
    for label, reason_pairs in top_reason_rows:
        lines.append(f"### {label}")
        if not reason_pairs:
            lines.append("- no rows")
        else:
            for reason, count in reason_pairs:
                lines.append(f"- `{reason}`: `{count}`")
        lines.append("")

    lines.extend(
        [
            "## Artifacts",
            "",
            f"- summary CSV: `{SUMMARY_CSV}`",
            f"- edge case CSV: `{EDGE_CASE_CSV}`",
            f"- review sample CSV: `{REVIEW_SAMPLE_CSV}`",
            f"- conflict cases CSV: `{CONFLICT_CASES_CSV}`",
        ]
    )
    return "\n".join(lines).strip() + "\n"


def main() -> None:
    VALIDATION_DIR.mkdir(exist_ok=True)
    df = pd.read_csv(SCORED_CSV)

    summary_df = build_label_distribution_summary(df)
    edge_df = build_edge_case_audit(df)
    review_df = build_review_sample(df)
    conflict_df = build_conflict_cases(df)

    summary_df.to_csv(SUMMARY_CSV, index=False)
    edge_df.to_csv(EDGE_CASE_CSV, index=False)
    review_df.to_csv(REVIEW_SAMPLE_CSV, index=False)
    conflict_df.to_csv(CONFLICT_CASES_CSV, index=False)
    REPORT_MD.write_text(build_report(df, summary_df, edge_df, conflict_df))

    print(f"Saved: {SUMMARY_CSV}")
    print(f"Saved: {EDGE_CASE_CSV}")
    print(f"Saved: {REVIEW_SAMPLE_CSV}")
    print(f"Saved: {CONFLICT_CASES_CSV}")
    print(f"Saved: {REPORT_MD}")


if __name__ == "__main__":
    main()
