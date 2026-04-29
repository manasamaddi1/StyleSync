import { NextResponse } from "next/server";
import { loadWardrobe } from "@/lib/wardrobeStore";
import { generateOutfits } from "@/lib/outfitEngine";

export async function POST(req: Request) {
  const { genre } = await req.json();
  const wardrobe = await loadWardrobe();

  const outfits = generateOutfits(wardrobe, genre, 3);

  return NextResponse.json({ outfits });
}