// Looks / Outfits — pick a feeling, get a head-to-toe outfit

const { useState: uSL, useMemo: uML } = React;

function OutfitsScreen({ state, dispatch, compact, tweaks }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FS = window.SS_FONT_SERIF, FN = window.SS_FONT_SANS;
  const t = { ...(window.UPLOAD_TWEAKS || {}), ...(tweaks || {}) };
  const accent = { terra: C.terra, sage: C.sage, butter: C.butter, rose: '#D89AA0' }[t.accent] || C.terra;

  const [genre, setGenre] = uSL(state.genre || 'casual');
  const [seedN, setSeedN] = uSL(0);
  const [saved, setSaved] = uSL([]);

  const outfits = uML(() => {
    const w = state.wardrobe;
    const tagMatch = (it) => it.tags?.includes(genre);
    function pick(cat, idx) {
      const matches = w.filter(it => it.cat === cat && tagMatch(it));
      const fallback = w.filter(it => it.cat === cat);
      const pool = matches.length ? matches : fallback;
      if (!pool.length) return null;
      return pool[(idx + seedN) % pool.length];
    }
    return [0, 1, 2].map((i) => ({
      id: `${genre}-${seedN}-${i}`,
      mood: ['soft', 'crisp', 'easy'][i],
      top: pick('top', i),
      bottom: pick('bottom', i),
      shoes: pick('shoes', i),
      outer: pick('outerwear', i),
    }));
  }, [state.wardrobe, genre, seedN]);

  const moodLine = { soft: 'Soft layers', crisp: 'Crisp & polished', easy: 'For a long walk' };

  const genreLabel = (window.SS_GENRES.find(g => g.key === genre)?.label || 'easy').toLowerCase();
  const vibeLabelMap = Object.fromEntries((window.SS_GENRES || []).map(g => [g.key, g.label.toLowerCase()]));
  const SLOT_ORDER_O = ['outerwear', 'top', 'bottom', 'shoes'];
  const myLooks = state.outfits || [];

  return (
    <div style={{ padding: compact ? '20px 16px 32px' : '36px 44px 56px', background: C.cream, minHeight: '100%', display: 'grid', gap: compact ? 18 : 26 }}>

      {/* ── Saved by you ── */}
      {myLooks.length > 0 && (
        <div style={{ display: 'grid', gap: compact ? 12 : 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <window.Eyebrow style={{ marginBottom: 8 }}>Yours · saved looks</window.Eyebrow>
              <h2 style={{
                fontFamily: FS, fontWeight: 400,
                fontSize: compact ? 22 : 26, margin: 0, color: C.ink,
                letterSpacing: -0.2,
              }}>{myLooks.length} {myLooks.length === 1 ? 'look you built' : 'looks you built'}</h2>
            </div>
            <button
              onClick={() => dispatch({ type: 'goto', page: 'build' })}
              style={{
                background: 'transparent', border: `1px solid ${C.line}`,
                color: C.ink, borderRadius: R.r3,
                padding: '8px 14px', cursor: 'pointer',
                fontFamily: FN, fontSize: 13, fontWeight: 500,
                whiteSpace: 'nowrap',
              }}>+ Build a look</button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: compact ? 12 : 14,
          }}>
            {myLooks.slice(0, compact ? 4 : 8).map(look => {
              const items = SLOT_ORDER_O
                .map(s => state.wardrobe.find(x => x.id === look.slots[s]))
                .filter(Boolean);
              return (
                <div key={look.id} style={{
                  background: C.paper, border: `1px solid ${C.line}`,
                  borderRadius: R.r2, padding: compact ? 14 : 16,
                  display: 'grid', gap: 10,
                }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
                  }}>
                    {items.slice(0, 4).map((it, i) => (
                      <window.GarmentTile key={i} item={it} size="sm" />
                    ))}
                    {Array.from({ length: Math.max(0, 4 - items.length) }).map((_, i) => (
                      <div key={`e${i}`} style={{
                        aspectRatio: '3/4', borderRadius: R.r1,
                        background: C.cream, border: `1px dashed ${C.line}`,
                      }}/>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      {items.map((it, i) => (
                        <span key={i} style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: it.swatch, border: `1px solid ${C.line}`,
                        }}/>
                      ))}
                    </div>
                    <div style={{
                      fontFamily: FS, fontSize: compact ? 17 : 19,
                      color: C.ink, lineHeight: 1.1, textTransform: 'lowercase',
                      letterSpacing: -0.2,
                    }}>{look.name.toLowerCase()}</div>
                    {look.tag && (
                      <div style={{ fontFamily: FN, fontSize: 11, color: C.muted, marginTop: 4 }}>
                        {(vibeLabelMap[look.tag] || look.tag).replace('_', ' ')}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => dispatch({ type: 'load_into_build', outfit: look })}
                      style={{
                        flex: 1,
                        background: C.ink, color: C.paper,
                        border: 'none', borderRadius: R.r3,
                        padding: '8px 12px', cursor: 'pointer',
                        fontFamily: FN, fontSize: 12, fontWeight: 500,
                      }}>Wear today</button>
                    <button
                      onClick={() => dispatch({ type: 'remove_outfit', id: look.id })}
                      aria-label="Delete"
                      title="Delete look"
                      style={{
                        background: 'transparent', border: `1px solid ${C.line}`,
                        color: C.muted, borderRadius: R.r3,
                        padding: '8px 12px', cursor: 'pointer',
                        fontFamily: FN, fontSize: 12,
                      }}>×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Auto-suggested ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <window.Eyebrow style={{ marginBottom: 10 }}>Looks for today</window.Eyebrow>
          <window.ScreenH1 compact={compact}>Three ways to feel {genreLabel}.</window.ScreenH1>
        </div>
        <button
          onClick={() => setSeedN(n => n + 1)}
          aria-label="Reshuffle"
          style={{
            background: 'transparent', border: `1px solid ${C.line}`,
            color: C.ink, borderRadius: R.r3,
            padding: '8px 14px', cursor: 'pointer',
            fontFamily: FN, fontSize: 13, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>↻ Shuffle</button>
      </div>

      {/* Genre picker */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {window.SS_GENRES.map(g => (
          <button key={g.key}
            onClick={() => { setGenre(g.key); setSeedN(0); dispatch({ type: 'genre', genre: g.key }); }}
            style={{
              background: genre === g.key ? C.ink : C.paper,
              color: genre === g.key ? C.paper : C.ink,
              border: `1px solid ${genre === g.key ? C.ink : C.line}`,
              borderRadius: R.r3, cursor: 'pointer',
              padding: compact ? '8px 14px' : '9px 16px',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: FN, fontSize: compact ? 12 : 13, fontWeight: 500,
            }}>
            <span style={{ fontSize: 14, opacity: 0.85 }}>{g.emoji}</span>
            <span>{g.label}</span>
          </button>
        ))}
      </div>

      {/* Outfits */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)',
        gap: compact ? 14 : 18,
      }}>
        {outfits.map((o, idx) => {
          const isSaved = saved.includes(o.id);
          return (
            <div key={o.id} style={{
              background: C.paper, border: `1px solid ${C.line}`,
              borderRadius: R.r2, padding: compact ? 18 : 22,
              display: 'grid', gap: 14, position: 'relative',
            }}>
              <div style={{
                fontFamily: FS, fontWeight: 400,
                fontSize: compact ? 22 : 24, color: C.ink, lineHeight: 1.15,
                letterSpacing: -0.2,
              }}>{moodLine[o.mood]}</div>

              {/* Stack */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              }}>
                {[
                  ['outer', o.outer],
                  ['top', o.top],
                  ['bottom', o.bottom],
                  ['shoes', o.shoes],
                ].map(([slot, item]) => (
                  <div key={slot}>
                    {item ? (
                      <window.GarmentTile item={item} size="sm"/>
                    ) : (
                      <div style={{
                        aspectRatio: '3/4', borderRadius: R.r1,
                        background: C.cream, border: `1px solid ${C.line}`,
                        display: 'grid', placeItems: 'center',
                        color: C.muted, fontFamily: FN, fontSize: 11,
                      }}>no {slot}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Palette + actions row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {[o.outer, o.top, o.bottom, o.shoes].filter(Boolean).map((it, i) => (
                    <span key={i} title={it.color} style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: it.swatch, border: `1px solid ${C.line}`,
                    }}/>
                  ))}
                </div>
                <button
                  onClick={() => dispatch({ type: 'goto', page: 'style' })}
                  aria-label="Remix"
                  title="Remix this look"
                  style={{
                    background: 'transparent', border: 'none',
                    color: C.muted, cursor: 'pointer',
                    fontFamily: FN, fontSize: 12, padding: 4,
                  }}>↻ remix</button>
              </div>

              <button
                onClick={() => {
                  const look = {
                    id: 'auto-' + o.id,
                    name: moodLine[o.mood],
                    slots: {
                      outerwear: o.outer?.id || null,
                      top:       o.top?.id   || null,
                      bottom:    o.bottom?.id|| null,
                      shoes:     o.shoes?.id || null,
                    },
                    tag: genre,
                  };
                  dispatch({ type: 'load_into_build', outfit: look });
                }}
                style={{
                  padding: '11px 14px',
                  background: C.ink,
                  color: C.paper,
                  border: 'none', borderRadius: R.r3, cursor: 'pointer',
                  fontFamily: FN, fontWeight: 500, fontSize: 13,
                }}>Wear today →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.OutfitsScreen = OutfitsScreen;
