import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/jadenwu/Desktop/StyleSync/StyleSync';

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('shared wardrobe type includes structured recommendation fields', () => {
  const src = read('stylesync-vercel/lib/types.ts');

  assert.match(src, /occasion\?: Occasion/);
  assert.match(src, /occasionConfidence\?: number/);
  assert.match(src, /patternFamily\?: PatternFamily/);
  assert.match(src, /materialFamily\?: MaterialFamily/);
  assert.match(src, /sleeveFamily\?: SleeveFamily/);
});

test('wardrobe API persists the core wardrobe record and save contract', () => {
  const src = read('stylesync-vercel/app/api/wardrobe/route.ts');

  assert.match(src, /if \(!body\.cat \|\| !body\.image\)/);
  assert.match(src, /cat:\s*body\.cat/);
  assert.match(src, /color:\s*body\.color/);
  assert.match(src, /swatch:\s*body\.swatch/);
  assert.match(src, /tags:\s*body\.tags/);
  assert.match(src, /image:\s*body\.image/);
});

test('recommendation engine consumes structured wardrobe fields', () => {
  const src = read('stylesync-vercel/lib/recommend.ts');

  assert.match(src, /occasionConfidence:/);
  assert.match(src, /patternFamily:/);
  assert.match(src, /materialFamily:/);
  assert.match(src, /sleeveFamily:/);
  assert.match(src, /FALLBACK_MIN_SCORE = 0\.35/);
  assert.match(src, /FALLBACK_MAX_GAP = 0\.15/);
});
