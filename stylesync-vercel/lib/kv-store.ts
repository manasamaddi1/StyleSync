// Persistence layer. Wardrobe + saved outfits live in Vercel KV (Redis-like).
// One key per collection — small at this scale (<1000 items per user).

import { kv } from '@vercel/kv';
import type { WardrobeItem, SavedOutfit } from './types';

const WARDROBE_KEY = 'stylesync:wardrobe';
const OUTFITS_KEY  = 'stylesync:outfits';

// ───── Wardrobe ─────

export async function loadWardrobe(): Promise<WardrobeItem[]> {
  const data = await kv.get<WardrobeItem[]>(WARDROBE_KEY);
  return data ?? [];
}

export async function addWardrobeItem(item: WardrobeItem): Promise<void> {
  const list = await loadWardrobe();
  list.unshift(item); // newest first
  await kv.set(WARDROBE_KEY, list);
}

export async function deleteWardrobeItem(id: string): Promise<void> {
  const list = await loadWardrobe();
  await kv.set(WARDROBE_KEY, list.filter((x) => x.id !== id));
}

export async function updateWardrobeItem(
  id: string,
  patch: Partial<WardrobeItem>,
): Promise<WardrobeItem | null> {
  const list = await loadWardrobe();
  let updated: WardrobeItem | null = null;
  const next = list.map((x) => {
    if (x.id !== id) return x;
    updated = { ...x, ...patch, id: x.id };
    return updated;
  });
  if (updated) await kv.set(WARDROBE_KEY, next);
  return updated;
}

// ───── Saved outfits ─────

export async function loadOutfits(): Promise<SavedOutfit[]> {
  const data = await kv.get<SavedOutfit[]>(OUTFITS_KEY);
  return data ?? [];
}

export async function addOutfit(outfit: SavedOutfit): Promise<void> {
  const list = await loadOutfits();
  list.unshift(outfit);
  // Cap at 50 so KV value doesn't grow unbounded
  await kv.set(OUTFITS_KEY, list.slice(0, 50));
}

export async function deleteOutfit(id: string): Promise<void> {
  const list = await loadOutfits();
  await kv.set(OUTFITS_KEY, list.filter((x) => x.id !== id));
}
