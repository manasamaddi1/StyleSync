// GarmentTile — cozy/casual placeholder for clothing
// Soft warm tones, rounded, paper texture feel. No detailed SVGs.

function patternBg(pattern, swatch) {
  switch (pattern) {
    case 'stripe':
      return `repeating-linear-gradient(90deg, ${swatch} 0 10px, color-mix(in oklab, ${swatch}, white 40%) 10px 14px)`;
    case 'denim':
      return `repeating-linear-gradient(45deg, ${swatch} 0 8px, color-mix(in oklab, ${swatch}, white 18%) 8px 11px)`;
    case 'mesh':
      return `radial-gradient(circle at 2px 2px, rgba(0,0,0,.18) 1.2px, transparent 2px) ${swatch}`;
    case 'pocket':
      return `linear-gradient(${swatch}, ${swatch})`;
    case 'sole':
      return `linear-gradient(180deg, ${swatch} 60%, color-mix(in oklab, ${swatch}, black 30%) 60%)`;
    case 'lace':
      return `linear-gradient(180deg, ${swatch} 70%, color-mix(in oklab, ${swatch}, black 25%) 70%)`;
    case 'puff':
      return `repeating-radial-gradient(circle at 30% 30%, ${swatch} 0 18px, color-mix(in oklab, ${swatch}, black 12%) 18px 22px)`;
    case 'rib':
      return `repeating-linear-gradient(0deg, ${swatch} 0 5px, color-mix(in oklab, ${swatch}, black 8%) 5px 7px)`;
    default:
      return swatch;
  }
}

function CategoryGlyph({ cat, color }) {
  const fill = { fill: color };
  if (cat === 'top') return (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <rect x="14" y="18" width="32" height="34" rx="6" {...fill} />
      <rect x="6"  y="14" width="14" height="14" rx="5" {...fill} />
      <rect x="40" y="14" width="14" height="14" rx="5" {...fill} />
    </svg>
  );
  if (cat === 'bottom') return (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <rect x="14" y="8"  width="32" height="10" rx="3" {...fill} />
      <rect x="14" y="20" width="12" height="34" rx="4" {...fill} />
      <rect x="34" y="20" width="12" height="34" rx="4" {...fill} />
    </svg>
  );
  if (cat === 'shoes') return (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <rect x="6"  y="32" width="48" height="14" rx="7" {...fill} />
      <rect x="14" y="20" width="22" height="14" rx="5" {...fill} />
    </svg>
  );
  if (cat === 'dress') return (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <rect x="22" y="8" width="16" height="10" rx="3" {...fill} />
      <polygon points="14,52 46,52 40,18 20,18" {...fill} />
    </svg>
  );
  return (
    <svg viewBox="0 0 60 60" width="100%" height="100%">
      <rect x="10" y="14" width="40" height="40" rx="6" {...fill} />
      <rect x="2"  y="14" width="10" height="14" rx="4" {...fill} />
      <rect x="48" y="14" width="10" height="14" rx="4" {...fill} />
    </svg>
  );
}

function GarmentTile({ item, size = 'md', selected = false, favorite = false, onClick, onToggleFav, style: extraStyle }) {
  if (!item) {
    return (
      <div style={{
        aspectRatio: '3/4',
        background: '#F1E9D6',
        border: '1.5px dashed #D6C9AD',
        borderRadius: 18,
        display: 'grid', placeItems: 'center',
        color: '#8C7F66',
        fontFamily: '"Space Grotesk", sans-serif',
        fontSize: 12,
        ...extraStyle,
      }}>+ empty</div>
    );
  }

  const dims = size === 'sm' ? 50 : size === 'lg' ? 110 : 72;
  const isLight = ['white','cream','beige','lime','pink','silver'].includes(item.color);
  const fg = isLight ? 'rgba(46,42,36,.82)' : 'rgba(251,246,234,.92)';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: '3/4',
        background: '#FBF6EA',
        border: `1px solid ${selected ? '#D08A6E' : '#E5DBC6'}`,
        borderRadius: 18,
        boxShadow: selected
          ? '0 0 0 3px rgba(208,138,110,.18)'
          : '0 1px 0 rgba(46,42,36,.04)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .2s ease, box-shadow .2s ease',
        ...extraStyle,
      }}
    >
      <div style={{
        position: 'absolute', inset: 8,
        borderRadius: 14,
        background: item.image ? '#FBF6EA' : patternBg(item.pattern, item.swatch),
        overflow: 'hidden',
      }}>
        {item.image ? (
          <img src={item.image} alt={item.label} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', display: 'block',
          }}/>
        ) : (
          <>
            {/* paper grain */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(46,42,36,.05) 1px, transparent 1.4px)',
              backgroundSize: '6px 6px',
              mixBlendMode: 'multiply',
            }} />
            {/* glyph */}
            <div style={{
              position: 'absolute', inset: '14% 18% 20% 18%',
              display: 'grid', placeItems: 'center',
            }}>
              <div style={{ width: dims, height: dims, opacity: 0.78 }}>
                <CategoryGlyph cat={item.cat} color={fg} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Favorite indicator / toggle. When `onToggleFav` is provided, the heart
         is interactive and always visible (filled when saved, outline when not).
         Otherwise it's just a passive badge shown only when `favorite` is true. */}
      {onToggleFav ? (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(item); }}
          aria-label={favorite ? `Unsave ${item.label}` : `Save ${item.label}`}
          aria-pressed={favorite}
          title={favorite ? 'Saved' : 'Save'}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 26, height: 26, borderRadius: '50%',
            background: favorite ? '#FBF6EA' : 'rgba(251,246,234,.82)',
            color: favorite ? '#D08A6E' : '#8C7F66',
            border: `1px solid ${favorite ? '#D08A6E' : 'rgba(46,42,36,.10)'}`,
            display: 'grid', placeItems: 'center',
            fontSize: 13, fontWeight: 700, padding: 0, cursor: 'pointer',
            boxShadow: favorite ? '0 1px 3px rgba(46,42,36,.14)' : 'none',
            transition: 'transform .12s ease',
            backdropFilter: 'blur(4px)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
        >{favorite ? '♥' : '♡'}</button>
      ) : favorite ? (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          width: 22, height: 22, borderRadius: '50%',
          background: '#FBF6EA',
          color: '#D08A6E',
          display: 'grid', placeItems: 'center',
          fontSize: 12, fontWeight: 700,
          boxShadow: '0 1px 2px rgba(46,42,36,.12)',
        }}>♥</div>
      ) : null}

      <div style={{
        position: 'absolute', left: 10, right: 10, bottom: 10,
        background: 'rgba(251,246,234,.92)',
        backdropFilter: 'blur(6px)',
        borderRadius: 10,
        padding: '6px 9px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8,
      }}>
        <div>
          <div style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: 9, letterSpacing: 1.2, color: '#8C7F66', textTransform: 'uppercase',
          }}>{item.cat}</div>
          <div style={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontSize: size === 'sm' ? 11 : 13, color: '#2E2A24',
            lineHeight: 1, marginTop: 2,
            textTransform: 'lowercase',
          }}>{item.label.toLowerCase()}</div>
        </div>
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          background: item.swatch, border: '1px solid rgba(46,42,36,.12)', flex: 'none',
        }} />
      </div>
    </div>
  );
}

Object.assign(window, { GarmentTile, CategoryGlyph });
