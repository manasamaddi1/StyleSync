from pathlib import Path
import sys

import pandas as pd

MODULE_ROOT = Path(__file__).resolve().parent
DEEPFASHION_ROOT = MODULE_ROOT.parent
if str(MODULE_ROOT) not in sys.path:
    sys.path.insert(0, str(MODULE_ROOT))

from occasion_v1_scoring import build_filtered_dataset, load_rule_config, score_dataframe


DATA_ROOT = DEEPFASHION_ROOT / "data"
SOURCE_CSV = DATA_ROOT / "anno_fine_outfit_features.csv"
FILTERED_OUTPUT_CSV = DATA_ROOT / "anno_fine_v1_common_items.csv"
SCORED_OUTPUT_CSV = DATA_ROOT / "anno_fine_v1_occasion_scored.csv"


def main() -> None:
    config = load_rule_config()
    df = pd.read_csv(SOURCE_CSV)

    filtered_df = build_filtered_dataset(df, config)
    filtered_df.to_csv(FILTERED_OUTPUT_CSV, index=False)

    scored_df = score_dataframe(filtered_df, config)
    scored_df.to_csv(SCORED_OUTPUT_CSV, index=False)

    print(f"Loaded rule config:   {MODULE_ROOT / 'occasion_v1_rule_config.json'}")
    print(f"Saved filtered data:  {FILTERED_OUTPUT_CSV}")
    print(f"Saved scored data:    {SCORED_OUTPUT_CSV}")
    print(f"Kept rows: {len(scored_df):,}")
    print("Category group counts:")
    print(scored_df["category_group"].value_counts().to_string())
    print("Top occasion counts:")
    print(scored_df["top_occasion"].value_counts().to_string())
    print("Low-confidence count:")
    print(int(scored_df["low_confidence"].sum()))


if __name__ == "__main__":
    main()
