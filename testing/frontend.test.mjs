import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/jadenwu/Desktop/StyleSync/StyleSync';

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

test('upload screen reads real structured prediction fields', () => {
  const src = read('stylesync-vercel/public/screens-upload.jsx');

  assert.match(src, /prediction\.occasion/);
  assert.match(src, /prediction\.patternFamily/);
  assert.match(src, /prediction\.materialFamily/);
  assert.match(src, /prediction\.sleeveFamily/);

  assert.match(src, /occasion:\s*reveal\.occasion/);
  assert.match(src, /patternFamily:\s*reveal\.pattern/);
  assert.match(src, /materialFamily:\s*reveal\.material/);
  assert.match(src, /sleeveFamily:\s*reveal\.sleeve/);
});

test('frontend API client exposes prediction, upload, wardrobe, and recommendation calls', () => {
  const src = read('stylesync-vercel/public/api-client.js');

  assert.match(src, /async predict\(imageBlob\)/);
  assert.match(src, /async uploadImage\(file\)/);
  assert.match(src, /async addWardrobeItem\(item\)/);
  assert.match(src, /async recommend\(occasion, limit\)/);
});

test('outfit screen uses the recommendation engine instead of tag-only rendering', () => {
  const src = read('stylesync-vercel/public/screens-outfits.jsx');
  assert.match(src, /window\.SS_RECO/);
  assert.match(src, /recommend\(w,\s*occasion/);
});
