import Link from "next/link";

export default function Navbar() {
  return (
    <div className="w-full px-8 py-5 flex justify-between items-center bg-slate-950 text-white">
      <Link href="/" className="text-xl font-extrabold">
        👕 StyleSync
      </Link>

      <div className="flex gap-5 text-sm font-semibold opacity-90">
        <Link href="/upload" className="hover:opacity-100 opacity-80">Upload</Link>
        <Link href="/wardrobe" className="hover:opacity-100 opacity-80">Wardrobe</Link>
        <Link href="/outfits" className="hover:opacity-100 opacity-80">Outfits</Link>
        <Link href="/style-item" className="hover:opacity-100 opacity-80">Style Item</Link>
      </div>
    </div>
  );
}