// GET  /api/outfits → { outfits: SavedOutfit[] }
// POST /api/outfits → save a SavedOutfit  (body: SavedOutfit)

import { NextResponse } from 'next/server';
import { addOutfit, loadOutfits } from '@/lib/kv-store';
import type { SavedOutfit } from '@/lib/types';
import { v4 as uuid } from 'uuid';

export const runtime = 'nodejs';

export async function GET() {
  const outfits = await loadOutfits();
  return NextResponse.json({ outfits });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<SavedOutfit>;
    const outfit: SavedOutfit = {
      id: body.id ?? 'look-' + uuid().slice(0, 8),
      name: body.name ?? 'Untitled',
      slots: body.slots ?? { top: null, bottom: null, shoes: null, outerwear: null, dress: null },
      tag: body.tag ?? null,
      createdAt: body.createdAt ?? Date.now(),
    };
    await addOutfit(outfit);
    return NextResponse.json({ ok: true, outfit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
