// POST /api/predict
// Body: multipart/form-data with field "image"
// Returns: { prediction: { category, subcategory, color, swatch, confidence } }

import { NextResponse } from 'next/server';
import { predictClothing } from '@/lib/hf-client';

export const runtime = 'nodejs';
export const maxDuration = 60; // HF Space cold-start can take 30s+

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image');
    if (!image || !(image instanceof Blob)) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const prediction = await predictClothing(image);
    return NextResponse.json({ prediction });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
