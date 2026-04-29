import { NextResponse } from "next/server";
import { loadWardrobe } from "@/lib/wardrobeStore";
import { generateOutfits } from "@/lib/outfitEngine";

export async function POST(req: Request) {
  const { genre, itemId } = await req.json();
  const wardrobe = await loadWardrobe();

  const outfits = generateOutfits(wardrobe, genre, 8);

  let finalOutfits = outfits.filter((o) => {
    return (
      o.top.item_id === itemId ||
      o.bottom.item_id === itemId ||
      o.shoes.item_id === itemId ||
      o.outerwear?.item_id === itemId
    );
  });

  while (finalOutfits.length < 3) {
    const extra = generateOutfits(wardrobe, genre, 1);
    if (!extra.length) break;

    const newOutfit = extra[0];

    const selected = wardrobe.find((x) => x.item_id === itemId);
    if (!selected) break;

    if (selected.category === "top") newOutfit.top = selected;
    if (selected.category === "bottom") newOutfit.bottom = selected;
    if (selected.category === "shoes") newOutfit.shoes = selected;
    if (selected.category === "outerwear") newOutfit.outerwear = selected;

    newOutfit.explanation = `This look is built around your selected ${selected.category} to fit the ${genre.replaceAll("_", " ")} vibe.`;

    finalOutfits.push(newOutfit);
  }

  return NextResponse.json({ outfits: finalOutfits.slice(0, 3) });
}