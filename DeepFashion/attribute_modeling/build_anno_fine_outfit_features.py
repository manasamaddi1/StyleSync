from pathlib import Path

import pandas as pd


DEEPFASHION_ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = DEEPFASHION_ROOT / "data"
SOURCE_CSV = DATA_ROOT / "anno_fine_merged.csv"
OUTPUT_CSV = DATA_ROOT / "anno_fine_outfit_features.csv"


KEEP_ATTRS = [
    "attr_01",  # floral
    "attr_02",  # graphic
    "attr_03",  # striped
    "attr_04",  # embroidered
    "attr_05",  # pleated
    "attr_06",  # solid
    "attr_08",  # long_sleeve
    "attr_09",  # short_sleeve
    "attr_10",  # sleeveless
    "attr_11",  # maxi_length
    "attr_12",  # mini_length
    "attr_14",  # crew_neckline
    "attr_15",  # v_neckline
    "attr_16",  # square_neckline
    "attr_18",  # denim
    "attr_19",  # chiffon
    "attr_21",  # leather
    "attr_22",  # faux
    "attr_23",  # knit
    "attr_24",  # tight
    "attr_25",  # loose
]


ATTR_RENAME = {
    "attr_01": "floral",
    "attr_02": "graphic",
    "attr_03": "striped",
    "attr_04": "embroidered",
    "attr_05": "pleated",
    "attr_06": "solid",
    "attr_08": "long_sleeve",
    "attr_09": "short_sleeve",
    "attr_10": "sleeveless",
    "attr_11": "maxi_length",
    "attr_12": "mini_length",
    "attr_14": "crew_neckline",
    "attr_15": "v_neckline",
    "attr_16": "square_neckline",
    "attr_18": "denim",
    "attr_19": "chiffon",
    "attr_21": "leather",
    "attr_22": "faux",
    "attr_23": "knit",
    "attr_24": "tight",
    "attr_25": "loose",
}


def pick_first_active(row: pd.Series, columns: list[str], default: str = "none") -> str:
    for column in columns:
        if row[column] == 1:
            return column
    return default


def active_labels(row: pd.Series, columns: list[str]) -> list[str]:
    return [column for column in columns if row[column] == 1]


def main() -> None:
    df = pd.read_csv(SOURCE_CSV)

    base_columns = [
        "image_name",
        "image_path",
        "image_exists",
        "split",
        "category_id",
        "category_name",
        "category_type",
        "x1",
        "y1",
        "x2",
        "y2",
    ]
    outfit_df = df[base_columns + KEEP_ATTRS].copy()
    outfit_df = outfit_df.rename(columns=ATTR_RENAME)

    pattern_columns = ["solid", "floral", "graphic", "striped", "embroidered"]
    material_columns = ["denim", "chiffon", "knit", "leather", "faux"]
    fit_columns = ["tight", "loose", "pleated"]
    length_columns = ["mini_length", "maxi_length"]
    sleeve_columns = ["sleeveless", "short_sleeve", "long_sleeve"]
    neckline_columns = ["crew_neckline", "v_neckline", "square_neckline"]

    outfit_df["pattern_family"] = outfit_df.apply(
        lambda row: pick_first_active(row, pattern_columns, default="other"),
        axis=1,
    )
    outfit_df["material_family"] = outfit_df.apply(
        lambda row: pick_first_active(row, material_columns, default="other"),
        axis=1,
    )
    outfit_df["fit_family"] = outfit_df.apply(
        lambda row: pick_first_active(row, fit_columns, default="other"),
        axis=1,
    )
    outfit_df["length_family"] = outfit_df.apply(
        lambda row: (
            pick_first_active(row, length_columns, default="regular")
            if row["category_type"] in {2, 3}
            else "not_applicable"
        ),
        axis=1,
    )
    outfit_df["sleeve_family"] = outfit_df.apply(
        lambda row: (
            pick_first_active(row, sleeve_columns, default="other")
            if row["category_type"] in {1, 3}
            else "not_applicable"
        ),
        axis=1,
    )
    outfit_df["neckline_family"] = outfit_df.apply(
        lambda row: (
            pick_first_active(row, neckline_columns, default="other")
            if row["category_type"] in {1, 3}
            else "not_applicable"
        ),
        axis=1,
    )

    compatibility_columns = pattern_columns + material_columns + fit_columns + length_columns
    outfit_df["outfit_feature_tags"] = outfit_df.apply(
        lambda row: "|".join(active_labels(row, compatibility_columns)),
        axis=1,
    )
    outfit_df["outfit_feature_count"] = outfit_df["outfit_feature_tags"].map(
        lambda value: 0 if not value else len(value.split("|"))
    )

    outfit_df.to_csv(OUTPUT_CSV, index=False)

    print(f"Saved: {OUTPUT_CSV}")
    print(f"Rows: {len(outfit_df):,}")
    print(f"Columns: {len(outfit_df.columns)}")
    print("Top pattern families:")
    print(outfit_df["pattern_family"].value_counts().head().to_string())
    print("Top material families:")
    print(outfit_df["material_family"].value_counts().head().to_string())


if __name__ == "__main__":
    main()
