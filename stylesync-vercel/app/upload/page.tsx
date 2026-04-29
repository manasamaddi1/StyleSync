"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [prediction, setPrediction] = useState<any>(null);
  const [status, setStatus] = useState<string>("");

  async function handlePredict() {
    if (!file) return;

    // We can't store real uploads easily without blob storage,
    // so for MVP we store base64 in KV.
    const base64 = await toBase64(file);

    const res = await fetch("/api/predict", {
      method: "POST",
      body: JSON.stringify({ image_base64: base64 }),
    });

    const data = await res.json();
    setPrediction({ ...data.prediction, image_url: base64 });
  }

  async function handleSave() {
    if (!prediction) return;

    const item_id = uuidv4().slice(0, 8);

    const res = await fetch("/api/wardrobe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id,
        image_url: prediction.image_url,
        category: prediction.category,
        color: prediction.color,
        style_tags: prediction.style_tags,
      }),
    });

    if (res.ok) setStatus("✅ Item saved to wardrobe!");
  }

  return (
    <div className="text-white">
      <h1 className="text-4xl font-extrabold mb-6">📸 Upload Clothing Item</h1>

      <input
        type="file"
        accept="image/png,image/jpeg"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          if (f) setPreview(URL.createObjectURL(f));
        }}
        className="mb-6"
      />

      {preview && (
        <div className="mb-6">
          <img src={preview} className="rounded-2xl max-w-md shadow-xl" />
        </div>
      )}

      <button
        onClick={handlePredict}
        className="bg-white text-slate-950 font-bold px-5 py-3 rounded-2xl"
      >
        🧠 Predict Metadata
      </button>

      {prediction && (
        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <h2 className="text-2xl font-bold">Predicted Metadata</h2>

          <p className="mt-3">Category: {prediction.category}</p>
          <p>Color: {prediction.color}</p>
          <p>Tags: {prediction.style_tags.join(", ")}</p>
          <p>Confidence: {prediction.confidence}</p>

          <button
            onClick={handleSave}
            className="mt-6 bg-green-500 text-white font-bold px-5 py-3 rounded-2xl"
          >
            ✅ Save to Wardrobe
          </button>

          {status && <p className="mt-4 opacity-90">{status}</p>}
        </div>
      )}
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}