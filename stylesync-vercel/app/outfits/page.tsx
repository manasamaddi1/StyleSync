"use client";

import { useState } from "react";
import OutfitCard from "@/components/OutfitCard";
import { GENRES } from "@/lib/constants";

export default function OutfitsPage() {
  const [genre, setGenre] = useState(GENRES[0]);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function generate() {
    setError("");
    const res = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genre }),
    });

    const data = await res.json();
    setOutfits(data.outfits);

    if (!data.outfits.length) {
      setError("Not enough clothing items. Upload more tops, bottoms, and shoes.");
    }
  }

  return (
    <div className="text-white">
      <h1 className="text-4xl font-extrabold mb-6">✨ Outfit Generator</h1>

      <div className="flex gap-4 items-center">
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
          🎯 Generate Outfits
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