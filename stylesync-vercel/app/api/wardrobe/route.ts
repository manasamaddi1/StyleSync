// GET  /api/wardrobe → { wardrobe: WardrobeItem[] }
// POST /api/wardrobe → save a new WardrobeItem  (body: WardrobeItem)
// Returns: { ok: true, item }

import { NextResponse } from 'next/server';
import { addWardrobeItem, loadWardrobe } from '@/lib/kv-store';
import type { WardrobeItem } from '@/lib/types';
import { v4 as uuid } from 'uuid';

export const runtime = 'nodejs';

export async function GET() {
  const wardrobe = await loadWardrobe();
  return NextResponse.json({ wardrobe });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<WardrobeItem>;

    if (!body.cat || !body.image) {
      return NextResponse.json(
        { error: 'cat and image are required' },
        { status: 400 },
      );
    }

    const item: WardrobeItem = {
      id: body.id ?? uuid().slice(0, 8),
      label: body.label ?? 'New piece',
      cat: body.cat,
      color: body.color ?? 'gray',
      swatch: body.swatch ?? '#B5B0A5',
      pattern: body.pattern,
      fabric: body.fabric,
      tags: body.tags ?? [],
      image: body.image,
      confidence: body.confidence,
      createdAt: body.createdAt ?? Date.now(),
    };

    await addWardrobeItem(item);
    return NextResponse.json({ ok: true, item });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
