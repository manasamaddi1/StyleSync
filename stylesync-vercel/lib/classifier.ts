import { CATEGORIES, COLORS, STYLE_TAGS } from "./constants";

export function classifyClothingFake() {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  const numTags = Math.random() > 0.5 ? 2 : 1;
  const tags = [...STYLE_TAGS].sort(() => 0.5 - Math.random()).slice(0, numTags);

  const confidence = Math.round((0.75 + Math.random() * 0.24) * 100) / 100;

  return {
    category,
    color,
    style_tags: tags,
    confidence,
  };
}