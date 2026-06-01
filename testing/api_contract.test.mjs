import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/jadenwu/Desktop/StyleSync/StyleSync';

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('Gradio inference app returns the current prediction payload keys', () => {
  const src = read('app.py');

  assert.match(src, /"category":\s*category/);
  assert.match(src, /"subcategory":\s*subcategory/);
  assert.match(src, /"color":\s*color_name/);
  assert.match(src, /"swatch":\s*swatch_hex/);
  assert.match(src, /"confidence":/);
});

test('HF client parses the same structured prediction contract', () => {
  const src = read('stylesync-vercel/lib/hf-client.ts');

  assert.match(src, /d\.occasion/);
  assert.match(src, /d\.occasion_confidence/);
  assert.match(src, /d\.pattern_family/);
  assert.match(src, /d\.material_family/);
  assert.match(src, /d\.sleeve_family/);
});

test('Next.js predict route forwards the HF prediction object', () => {
  const src = read('stylesync-vercel/app/api/predict/route.ts');

  assert.match(src, /const prediction = await predictClothing\(image\)/);
  assert.match(src, /return NextResponse\.json\(\{ prediction \}\)/);
});
