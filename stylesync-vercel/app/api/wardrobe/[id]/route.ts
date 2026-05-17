// DELETE /api/wardrobe/[id]
// PATCH  /api/wardrobe/[id]  (body: Partial<WardrobeItem>)

import { NextResponse } from 'next/server';
import { deleteWardrobeItem, updateWardrobeItem } from '@/lib/kv-store';

export const runtime = 'nodejs';

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await deleteWardrobeItem(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const item = await updateWardrobeItem(id, patch);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}
