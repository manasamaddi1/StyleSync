// POST /api/upload
// Body: multipart/form-data with field "file" (image)
// Returns: { url, pathname }
//
// Uploads the image to Vercel Blob storage and hands back a public CDN URL.
// The frontend stores this URL in the wardrobe item.

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuid } from 'uuid';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Derive an extension from the mimetype; fall back to .jpg
    const ext = (file.type.split('/')[1] || 'jpg').toLowerCase();
    const filename = `wardrobe/${uuid()}.${ext}`;

    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
