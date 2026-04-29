import type { WardrobeItem } from "@/lib/outfitEngine";

export default function ItemCard({ item }: { item: WardrobeItem }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 shadow-lg overflow-hidden">
      <img
        src={item.image_url}
        alt="Clothing Item"
        className="w-full h-56 object-cover"
      />

      <div className="p-4 text-white">
        <p className="font-bold text-lg">{item.category.toUpperCase()}</p>
        <p className="opacity-80">Color: {item.color}</p>
        <p className="opacity-80 text-sm mt-2">
          Tags: {item.style_tags.join(", ")}
        </p>
        <p className="text-xs opacity-60 mt-2">ID: {item.item_id}</p>
      </div>
    </div>
  );
}