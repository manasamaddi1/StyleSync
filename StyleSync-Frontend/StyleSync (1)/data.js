// Cozy data — basic color names + warm-toned swatches
window.SS_GENRES = [
  { key: 'casual',          label: 'Casual',       emoji: '☁', desc: 'Soft & weekendy' },
  { key: 'business_casual', label: 'Professional', emoji: '✦', desc: 'Polished but easy' },
  { key: 'minimal',         label: 'Minimal',      emoji: '◌', desc: 'Pared back' },
  { key: 'athletic',        label: 'Athletic',     emoji: '↗', desc: 'Built to move' },
  { key: 'punk',            label: 'Edgy',         emoji: '✺', desc: 'A little louder' },
  { key: 'cottage',         label: 'Cottagecore',  emoji: '✿', desc: 'Linen + tea' },
];

const sw = {
  black:  '#2A2620',
  white:  '#F0E8D9',
  cream:  '#E5DAC0',
  gray:   '#B5B0A5',
  brown:  '#7B5A3F',
  tan:    '#D6C7A6',
  red:    '#B85547',
  orange: '#C97B5C',
  yellow: '#E8CE85',
  green:  '#7C9079',
  blue:   '#5A7CA8',
  pink:   '#D89AA0',
  purple: '#9479A0',
};
window.SS_SWATCH = sw;

window.SS_SEED_WARDROBE = [
  { id: 't1', cat: 'top', label: 'Linen tee',      color: 'white',  swatch: sw.white,  pattern: 'solid',  tags: ['casual','minimal'] },
  { id: 't2', cat: 'top', label: 'Oxford shirt',   color: 'cream',  swatch: sw.cream,  pattern: 'stripe', tags: ['business_casual','minimal'] },
  { id: 't3', cat: 'top', label: 'Wool cardigan',  color: 'green',  swatch: sw.green,  pattern: 'rib',    tags: ['cottage','casual'] },
  { id: 't4', cat: 'top', label: 'Henley',         color: 'brown',  swatch: sw.brown,  pattern: 'solid',  tags: ['casual'] },
  { id: 't5', cat: 'top', label: 'Silk blouse',    color: 'pink',   swatch: sw.pink,   pattern: 'solid',  tags: ['business_casual'] },

  { id: 'b1', cat: 'bottom', label: 'Wide jeans',    color: 'blue',   swatch: sw.blue,   pattern: 'denim',  tags: ['casual'] },
  { id: 'b2', cat: 'bottom', label: 'Linen trouser', color: 'tan',    swatch: sw.tan,    pattern: 'solid',  tags: ['business_casual','cottage'] },
  { id: 'b3', cat: 'bottom', label: 'Corduroys',     color: 'orange', swatch: sw.orange, pattern: 'rib',    tags: ['casual','cottage'] },
  { id: 'b4', cat: 'bottom', label: 'Track pant',    color: 'blue',   swatch: sw.blue,   pattern: 'stripe', tags: ['athletic'] },
  { id: 'b5', cat: 'bottom', label: 'Tea-length skirt', color: 'yellow', swatch: sw.yellow, pattern: 'solid', tags: ['cottage','minimal'] },

  { id: 's1', cat: 'shoes', label: 'Suede loafer',  color: 'brown',  swatch: sw.brown,  pattern: 'solid',  tags: ['business_casual'] },
  { id: 's2', cat: 'shoes', label: 'Canvas sneaker',color: 'white',  swatch: sw.white,  pattern: 'sole',   tags: ['casual'] },
  { id: 's3', cat: 'shoes', label: 'Mary jane',     color: 'black',  swatch: sw.black,  pattern: 'solid',  tags: ['cottage','minimal'] },
  { id: 's4', cat: 'shoes', label: 'Trail runner',  color: 'green',  swatch: sw.green,  pattern: 'sole',   tags: ['athletic'] },

  { id: 'o1', cat: 'outerwear', label: 'Tweed blazer', color: 'tan',   swatch: sw.tan,   pattern: 'mesh',   tags: ['business_casual','cottage'] },
  { id: 'o2', cat: 'outerwear', label: 'Wool coat',    color: 'cream', swatch: sw.cream, pattern: 'solid',  tags: ['minimal'] },
  { id: 'o3', cat: 'outerwear', label: 'Quilted vest', color: 'green', swatch: sw.green, pattern: 'puff',   tags: ['casual','cottage'] },
];

window.SS_SEED_OUTFITS = [
  {
    id: 'look-seed-1',
    name: 'Saturday market',
    slots: { outerwear: 't3', top: 't1', bottom: 'b3', shoes: 's2' },
    tag: 'casual',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'look-seed-2',
    name: 'Coffee meeting',
    slots: { outerwear: 'o1', top: 't2', bottom: 'b2', shoes: 's1' },
    tag: 'business_casual',
    createdAt: Date.now() - 86400000 * 5,
  },
];

window.SS_INCOMING = {
  id: 'new1', cat: 'top', label: 'Pointelle tee', color: 'yellow', swatch: sw.yellow, pattern: 'rib', tags: ['cottage','minimal'],
};
