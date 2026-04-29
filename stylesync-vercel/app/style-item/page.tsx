"use client";

import { useEffect, useState } from "react";
import OutfitCard from "@/components/OutfitCard";
import { GENRES } from "@/lib/constants";

export default function StyleItemPage() {
  const [wardrobe, setWardrobe] = useState<any[]>([]);
  const [itemId, setItemId] = useState("");
  const [genre, setGenre] = useState(GENRES[0]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function loadWardrobe() {
    const res = await fetch("/api/wardrobe");
    const data = await res.json();
    setWardrobe(data.wardrobe);
    if (data.wardrobe.length) setItemId(data.wardrobe[0].item_id);
  }

  async function generate() {
    setError("");

    const res = await fetch("/api/style-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre, itemId }),
    });

    const data = await res.json();
    setOutfits(data.outfits);

    if (!data.outfits.length) {
      setError("Could not generate styling options. Upload more items.");
    }
  }

  useEffect(() => {
    loadWardrobe();
  }, []);

  if (!wardrobe.length) {
    return (
      <div className="text-white">
        <h1 className="text-4xl font-extrabold mb-4">👔 Style This Item</h1>
        <p className="opacity-70">Your wardrobe is empty. Upload clothing items first.</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <h1 className="text-4xl font-extrabold mb-6">👔 Style This Item</h1>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="bg-white text-slate-950 px-4 py-2 rounded-xl font-semibold"
        >
          {wardrobe.map((item) => (
            <option key={item.item_id} value={item.item_id}>
              {item.category} | {item.color} | {item.item_id}
            </option>
          ))}
        </select>

        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="bg-white text-slate-950 px-4 py-2 rounded-xl font-semibold"
        >
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <button
          onClick={generate}
          className="bg-white text-slate-950 font-bold px-5 py-3 rounded-2xl"
        >
          ✨ Generate 3 Looks
        </button>
      </div>

      {error && <p className="mt-6 text-red-400 font-semibold">{error}</p>}

      <div className="mt-10 flex flex-col gap-8">
        {outfits.map((o, idx) => (
          <OutfitCard key={idx} outfit={o} />
        ))}
      </div>
    </div>
  );
}