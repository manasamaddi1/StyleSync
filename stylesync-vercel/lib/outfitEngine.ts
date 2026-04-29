export type WardrobeItem = {
  item_id: string;
  image_url: string;
  category: string;
  color: string;
  style_tags: string[];
};

export type Outfit = {
  top: WardrobeItem;
  bottom: WardrobeItem;
  shoes: WardrobeItem;
  outerwear?: WardrobeItem | null;
  genre: string;
  explanation: string;
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOutfits(wardrobe: WardrobeItem[], genre: string, nOutfits = 3): Outfit[] {
  const tops = wardrobe.filter((x) => x.category === "top");
  const bottoms = wardrobe.filter((x) => x.category === "bottom");
  const shoes = wardrobe.filter((x) => x.category === "shoes");
  const outerwear = wardrobe.filter((x) => x.category === "outerwear");

  const outfits: Outfit[] = [];

  for (let i = 0; i < nOutfits; i++) {
    if (!tops.length || !bottoms.length || !shoes.length) break;

    outfits.push({
      top: randomPick(tops),
      bottom: randomPick(bottoms),
      shoes: randomPick(shoes),
      outerwear: outerwear.length && Math.random() > 0.5 ? randomPick(outerwear) : null,
      genre,
      explanation: `This outfit matches ${genre.replaceAll("_", " ")} because it satisfies the required outfit structure.`,
    });
  }

  return outfits;
}