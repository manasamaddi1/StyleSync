import { NextResponse } from "next/server";
import { addItem, loadWardrobe } from "@/lib/wardrobeStore";

export async function GET() {
  const wardrobe = await loadWardrobe();
  return NextResponse.json({ wardrobe });
}

export async function POST(req: Request) {
  const body = await req.json();
  await addItem(body);
  return NextResponse.json({ ok: true });
}