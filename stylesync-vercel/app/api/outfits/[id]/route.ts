// DELETE /api/outfits/[id]

import { NextResponse } from 'next/server';
import { deleteOutfit } from '@/lib/kv-store';

export const runtime = 'nodejs';

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await deleteOutfit(id);
  return NextResponse.json({ ok: true });
}
