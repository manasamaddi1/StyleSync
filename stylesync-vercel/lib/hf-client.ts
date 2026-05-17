// Thin wrapper around the Hugging Face Space hosting the ResNet classifier.
// Uses @gradio/client which handles Gradio's two-step REST protocol for us.

import { Client } from '@gradio/client';
import type { Prediction, Category } from './types';

const SPACE_ID = process.env.HF_SPACE_ID || 'aaron8wong/stylesync-app';

let cachedClient: Awaited<ReturnType<typeof Client.connect>> | null = null;

async function getClient() {
  if (!cachedClient) {
    cachedClient = await Client.connect(SPACE_ID);
  }
  return cachedClient;
}

// Defensive coercion — the model's category labels match our frontend
// already, but if anything drifts we map it here.
const VALID_CATEGORIES = new Set<Category>([
  'top', 'bottom', 'dress', 'outerwear', 'shoes',
]);

function coerceCategory(raw: unknown): Category {
  const s = String(raw).toLowerCase();
  return (VALID_CATEGORIES.has(s as Category) ? s : 'top') as Category;
}

/**
 * Run a single prediction. Accepts a Blob/File (image data).
 * Returns the structured prediction or throws on failure.
 */
export async function predictClothing(image: Blob): Promise<Prediction> {
  const client = await getClient();

  // Our HF Space registered the fn as `api_name="predict"` → the route is "/predict".
  const result = await client.predict('/predict', [image]);

  const data = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!data || typeof data !== 'object') {
    throw new Error('HF Space returned no prediction data');
  }

  const d = data as Record<string, unknown>;

  return {
    category:    coerceCategory(d.category),
    subcategory: String(d.subcategory ?? d.category ?? ''),
    color:       String(d.color ?? 'gray'),
    swatch:      String(d.swatch ?? '#B5B0A5'),
    confidence:  typeof d.confidence === 'number' ? d.confidence : 0,
  };
}
