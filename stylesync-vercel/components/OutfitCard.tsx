import type { Outfit } from "@/lib/outfitEngine";
import ItemCard from "./ItemCard";

export default function OutfitCard({ outfit }: { outfit: Outfit }) {
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white">
      <h2 className="text-2xl font-extrabold mb-5">Outfit</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="font-bold mb-2">Top</p>
          <ItemCard item={outfit.top} />
        </div>

        <div>
          <p className="font-bold mb-2">Bottom</p>
          <ItemCard item={outfit.bottom} />
        </div>

        <div>
          <p className="font-bold mb-2">Shoes</p>
          <ItemCard item={outfit.shoes} />
        </div>
      </div>

      {outfit.outerwear && (
        <div className="mt-6">
          <p className="font-bold mb-2">Outerwear</p>
          <div className="max-w-sm">
            <ItemCard item={outfit.outerwear} />
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-400/20">
        <p className="font-semibold">Explanation</p>
        <p className="opacity-85 mt-1">{outfit.explanation}</p>
      </div>
    </div>
  );
}