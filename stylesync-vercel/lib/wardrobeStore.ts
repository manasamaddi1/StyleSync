import { kv } from "@vercel/kv";
import type { WardrobeItem } from "./outfitEngine";

const KEY = "stylesync:wardrobe";

export async function loadWardrobe(): Promise<WardrobeItem[]> {
  const data = await kv.get<WardrobeItem[]>(KEY);
  return data ?? [];
}

export async function saveWardrobe(items: WardrobeItem[]) {
  await kv.set(KEY, items);
}

export async function addItem(item: WardrobeItem) {
  const wardrobe = await loadWardrobe();
  wardrobe.push(item);
  await saveWardrobe(wardrobe);
}

export async function deleteItem(itemId: string) {
  const wardrobe = await loadWardrobe();
  const updated = wardrobe.filter((x) => x.item_id !== itemId);
  await saveWardrobe(updated);
}