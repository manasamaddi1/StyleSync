// Remix / Style This — pick a piece, see three ways to wear it

const { useState: uSR, useMemo: uMR } = React;

function StyleThisScreen({ state, dispatch, compact, tweaks }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FS = window.SS_FONT_SERIF, FN = window.SS_FONT_SANS;
  const t = { ...(window.UPLOAD_TWEAKS || {}), ...(tweaks || {}) };
  const accentDark = { terra: '#B45A3D', sage: '#5C7458', butter: '#9C7E2E', rose: '#A56F76' }[t.accent] || '#B45A3D';

  const focusId = state.selectedItemId || state.wardrobe[0]?.id;
  const focus = state.wardrobe.find(x => x.id === focusId) || state.wardrobe[0];
  const [seedR, setSeedR] = uSR(0);

  const outfits = uMR(() => {
    if (!focus) return [];
    const w = state.wardrobe.filter(x => x.id !== focus.id);
    const slots = ['top', 'bottom', 'shoes', 'outerwear'].filter(s => s !== focus.cat);
    const moods = [
      { name: 'Quiet morning',   vibe: 'minimal' },
      { name: 'Long lunch',      vibe: 'business_casual' },
      { name: 'Bookshop & wine', vibe: 'cottage' },
    ];
    return moods.map((m, i) => {
      const pieces = { [focus.cat]: focus };
      slots.forEach((s, k) => {
        const matches = w.filter(x => x.cat === s && x.tags.includes(m.vibe));
        const fall = w.filter(x => x.cat === s);
        const pool = matches.length ? matches : fall;
        pieces[s] = pool.length ? pool[(i + k + seedR) % pool.length] : null;
      });
      return { ...m, id: `${focus.id}-${i}-${seedR}`, pieces };
    });
  }, [focus, state.wardrobe, seedR]);

  if (!focus) return null;

  return (
    <div style={{ padding: compact ? '20px 16px 32px' : '36px 44px 56px', background: C.cream, minHeight: '100%', display: 'grid', gap: compact ? 18 : 26 }}>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <window.Eyebrow style={{ marginBottom: 10 }}>Remix</window.Eyebrow>
          <window.ScreenH1 compact={compact}>
            Three ways to wear your {focus.label.toLowerCase()}.
          </window.ScreenH1>
        </div>
        <button
          onClick={() => setSeedR(s => s + 1)}
          aria-label="Reshuffle"
          style={{
            background: 'transparent', border: `1px solid ${C.line}`,
            color: C.ink, borderRadius: R.r3,
            padding: '8px 14px', cursor: 'pointer',
            fontFamily: FN, fontSize: 13, fontWeight: 500,
          }}>↻ Shuffle</button>
      </div>

      {/* Focus piece + closet rail */}
      <div style={{
        display: 'grid', gap: compact ? 14 : 18,
        gridTemplateColumns: compact ? '1fr' : '260px 1fr', alignItems: 'start',
      }}>
        {/* Focus card */}
        <div style={{
          background: C.paper, border: `1px solid ${C.line}`,
          borderRadius: R.r2, padding: compact ? 16 : 20,
        }}>
          <window.Eyebrow style={{ marginBottom: 12 }}>The piece</window.Eyebrow>
          <window.GarmentTile item={focus} size="lg"/>
          <div style={{ marginTop: 12 }}>
            <div style={{
              fontFamily: FS, fontWeight: 400,
              fontSize: 20, color: C.ink, lineHeight: 1.2,
              letterSpacing: -0.2,
            }}>{focus.label}</div>
          </div>
        </div>

        {/* Closet rail */}
        <div style={{
          background: C.paper, border: `1px solid ${C.line}`,
          borderRadius: R.r2, padding: compact ? 14 : 18,
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: compact ? 'repeat(4, 1fr)' : 'repeat(8, 1fr)',
            gap: 8,
          }}>
            {state.wardrobe.slice(0, compact ? 8 : 16).map(it => {
              const active = it.id === focus.id;
              return (
                <button key={it.id}
                  onClick={() => dispatch({ type: 'select', id: it.id })}
                  style={{
                    padding: 0, background: 'transparent', border: 'none',
                    cursor: 'pointer', position: 'relative',
                    outline: active ? `2px solid ${accentDark}` : 'none',
                    outlineOffset: 2, borderRadius: R.r1,
                  }}>
                  <window.GarmentTile item={it} size="sm"/>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3 outfit cards */}
      <div style={{
        display: 'grid', gap: compact ? 14 : 18,
        gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)',
      }}>
        {outfits.map((o) => {
          const order = ['outerwear', 'top', 'bottom', 'shoes'];
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
              }}>{o.name}</div>

              {/* Stack */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
              }}>
                {order.map(slot => {
                  const item = o.pieces[slot];
                  const isFocus = item && item.id === focus.id;
                  if (!item) {
                    return (
                      <div key={slot} style={{
                        aspectRatio: '3/4', borderRadius: R.r1,
                        background: C.cream, border: `1px solid ${C.line}`,
                        display: 'grid', placeItems: 'center',
                        color: C.muted, fontFamily: FN, fontSize: 11,
                      }}>no {slot}</div>
                    );
                  }
                  return (
                    <div key={slot} style={{ position: 'relative' }}>
                      <window.GarmentTile item={item} size="sm"
                        style={isFocus ? { boxShadow: `0 0 0 2px ${accentDark}` } : null}/>
                      {isFocus && (
                        <div style={{
                          position: 'absolute', top: 6, left: 6,
                          background: accentDark, color: C.paper,
                          fontSize: 9, letterSpacing: 0.6, textTransform: 'uppercase',
                          padding: '3px 7px', borderRadius: R.r3,
                          fontFamily: FN, fontWeight: 500,
                        }}>this piece</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Palette + swap */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {Object.values(o.pieces).filter(Boolean).map((it, i) => (
                    <span key={i} style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: it.swatch, border: `1px solid ${C.line}`,
                    }}/>
                  ))}
                </div>
                <button
                  onClick={() => setSeedR(s => s + 1)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: C.muted, cursor: 'pointer',
                    fontFamily: FN, fontSize: 12, padding: 4,
                  }}>↻ swap</button>
              </div>

              <button
                onClick={() => {
                  const look = {
                    id: 'remix-' + Date.now() + '-' + o.id,
                    name: o.name,
                    slots: {
                      outerwear: o.pieces.outerwear?.id || null,
                      top:       o.pieces.top?.id       || null,
                      bottom:    o.pieces.bottom?.id    || null,
                      shoes:     o.pieces.shoes?.id     || null,
                    },
                    tag: o.vibe,
                    createdAt: Date.now(),
                  };
                  dispatch({ type: 'save_outfit', outfit: look });
                  dispatch({ type: 'load_into_build', outfit: look });
                }}
                style={{
                  padding: '11px 14px',
                  background: C.ink, color: C.paper,
                  border: 'none', borderRadius: R.r3, cursor: 'pointer',
                  fontFamily: FN, fontWeight: 500, fontSize: 13,
                }}>Save look →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.StyleThisScreen = StyleThisScreen;
