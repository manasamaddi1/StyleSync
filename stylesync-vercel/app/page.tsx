import Link from "next/link";

export default function HomePage() {
  return (
    <div className="text-white">
      <div className="p-14 rounded-[28px] bg-gradient-to-br from-violet-600 via-blue-600 to-slate-950 shadow-2xl">
        <h1 className="text-6xl font-extrabold">👕 StyleSync</h1>
        <p className="text-xl mt-4 opacity-90">
          Your AI wardrobe + outfit generator built for real outfit decisions.
        </p>
      </div>

      <h2 className="text-3xl font-bold mt-12">✨ What StyleSync Does</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
          <h3 className="font-bold text-lg">📸 Upload Clothing</h3>
          <p className="opacity-80 text-sm mt-2">
            Upload images of clothing items from your closet and store them digitally.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
          <h3 className="font-bold text-lg">🧠 Smart Tagging</h3>
          <p className="opacity-80 text-sm mt-2">
            Computer vision predicts category, color, and style tags automatically.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
          <h3 className="font-bold text-lg">👗 Outfit Generator</h3>
          <p className="opacity-80 text-sm mt-2">
            Choose a style genre and generate outfits instantly.
          </p>
        </div>
      </div>

      <hr className="my-12 border-white/10" />

      <h2 className="text-3xl font-bold">🚀 MVP Demo Flow</h2>

      <div className="mt-6 p-8 rounded-2xl bg-white/5 border border-white/10">
        <p className="mb-2">1️⃣ Upload clothing items</p>
        <p className="mb-2">2️⃣ View your wardrobe closet</p>
        <p className="mb-2">3️⃣ Select a style genre</p>
        <p className="mb-2">4️⃣ Generate ranked outfit recommendations</p>
        <p className="mb-2">5️⃣ Style one item multiple ways</p>
      </div>

      <hr className="my-12 border-white/10" />

      <h2 className="text-3xl font-bold">🎯 Get Started</h2>

      <div className="flex gap-4 mt-6">
        <Link
          href="/upload"
          className="bg-white text-slate-950 font-bold px-5 py-3 rounded-2xl"
        >
          📸 Upload an Item
        </Link>

        <Link
          href="/outfits"
          className="bg-white text-slate-950 font-bold px-5 py-3 rounded-2xl"
        >
          ✨ Generate Outfits
        </Link>
      </div>

      <p className="text-sm opacity-70 mt-6">
        Tip: Upload at least 5–8 items for the best outfit recommendations.
      </p>
    </div>
  );
}