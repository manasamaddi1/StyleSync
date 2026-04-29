"use client";

import { useEffect, useState } from "react";
import ItemCard from "@/components/ItemCard";

export default function WardrobePage() {
  const [wardrobe, setWardrobe] = useState<any[]>([]);

  async function loadWardrobe() {
    const res = await fetch("/api/wardrobe");
    const data = await res.json();
    setWardrobe(data.wardrobe);
  }

  async function deleteItem(id: string) {
    await fetch(`/api/wardrobe/${id}`, { method: "DELETE" });
    loadWardrobe();
  }

  useEffect(() => {
    loadWardrobe();
  }, []);

  if (!wardrobe.length) {
    return (
      <div className="text-white">
        <h1 className="text-4xl font-extrabold mb-4">🧥 My Digital Closet</h1>
        <p className="opacity-70">No clothing items yet. Go upload some!</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-4xl font-extrabold mb-8">🧥 My Digital Closet</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {wardrobe.map((item) => (
          <div key={item.item_id}>
            <ItemCard item={item} />
            <button
              onClick={() => deleteItem(item.item_id)}
              className="mt-3 w-full bg-red-500 text-white font-bold px-4 py-2 rounded-xl"
            >
              🗑 Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}