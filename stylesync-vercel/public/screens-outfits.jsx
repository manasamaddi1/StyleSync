// Looks / Outfits — pick an occasion, get a head-to-toe outfit

const { useState: uSL, useMemo: uML } = React;

function OutfitsScreen({ state, dispatch, compact, tweaks }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FS = window.SS_FONT_SERIF, FN = window.SS_FONT_SANS;
  const t = { ...(window.UPLOAD_TWEAKS || {}), ...(tweaks || {}) };
  const accent = { terra: C.terra, sage: C.sage, butter: C.butter, rose: '#D89AA0' }[t.accent] || C.terra;

  // Single axis: OCCASION drives the engine's scoring.
  const OCCASIONS_O = [
    { key: 'casual', label: 'Casual' },
    { key: 'formal', label: 'Formal' },
    { key: 'sports', label: 'Sports' },
  ];

  const [occasion, setOccasion] = uSL('casual');
  const [seedN, setSeedN] = uSL(0);

  // Run the real V1 engine over the whole closet for the chosen occasion.
  const reco = uML(() => {
    const w = state.wardrobe || [];
    return window.SS_RECO ? window.SS_RECO.recommend(w, occasion, { limit: 9 }) : { outfits: [] };
  }, [state.wardrobe, occasion]);

  const allOutfits = reco.outfits || [];
  // Shuffle rotates a window of three through the ranked list.
  const windowStart = allOutfits.length ? (seedN * 3) % allOutfits.length : 0;
  const outfits = allOutfits.length
    ? Array.from({ length: Math.min(3, allOutfits.length) }, (_, i) => allOutfits[(windowStart + i) % allOutfits.length])
    : [];
  const notEnough = reco.reason === 'need_top_and_bottom';

  const occLabel = (OCCASIONS_O.find(o => o.key === occasion)?.label || 'casual').toLowerCase();

  function wearReco(o) {
    dispatch({ type: 'load_into_build', outfit: {
      id: 'reco-' + Date.now(),
      name: occLabel,
      slots: {
        outerwear: o.slots.outerwear?.id || null,
        top:       o.slots.top?.id       || null,
        bottom:    o.slots.bottom?.id    || null,
        shoes:     o.slots.shoes?.id     || null,
      },
      tag: occasion,
    }});
  }

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
                        {String(look.tag).replace('_', ' ')}
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

      {/* ── Styled for you (real V1 engine) ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ paddingBottom: 12 }}>
          <window.Eyebrow style={{ marginBottom: 10 }}>Styled for you · rule-based</window.Eyebrow>
          <window.ScreenH1 compact={compact} style={{ lineHeight: 1.05, whiteSpace: compact ? 'normal' : 'nowrap' }}>
            {`${occLabel.charAt(0).toUpperCase()}${occLabel.slice(1)} looks.`}
          </window.ScreenH1>
        </div>
        {outfits.length > 0 && (
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
        )}
      </div>

      {/* Occasion — the engine's formality axis */}
      <div style={{ display: 'grid', gap: 8 }}>
        <window.Eyebrow>Occasion</window.Eyebrow>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {OCCASIONS_O.map(o => (
            <button key={o.key}
              onClick={() => { setOccasion(o.key); setSeedN(0); }}
              style={{
                background: occasion === o.key ? C.ink : C.paper,
                color: occasion === o.key ? C.paper : C.ink,
                border: `1px solid ${occasion === o.key ? C.ink : C.line}`,
                borderRadius: R.r3, cursor: 'pointer',
                padding: compact ? '8px 16px' : '9px 18px',
                fontFamily: FN, fontSize: compact ? 12 : 13, fontWeight: 500,
              }}>{o.label}</button>
          ))}
        </div>
      </div>

      {/* Not-enough state */}
      {notEnough && (
        <div style={{
          background: C.paper, border: `1px solid ${C.line}`, borderRadius: R.r1,
          padding: 16, fontFamily: FN, fontSize: 13, color: C.muted, lineHeight: 1.5,
        }}>
          You'll need at least one <b style={{ color: C.ink }}>top</b> and one{' '}
          <b style={{ color: C.ink }}>bottom</b> in your closet for {occLabel} looks.{' '}
          <button
            onClick={() => dispatch({ type: 'goto', page: 'upload' })}
            style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: C.ink, fontFamily: FN, fontSize: 13, fontWeight: 600, textDecoration: 'underline',
            }}>Add pieces →</button>
        </div>
      )}

      {/* Engine results — same explainable card as Build */}
      {outfits.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(3, 1fr)',
          gap: compact ? 14 : 18,
          alignItems: 'start',
        }}>
          {outfits.map((o, idx) => (
            <window.RecoCard
              key={`${occasion}-${windowStart + idx}`}
              outfit={o}
              rank={windowStart + idx}
              onApply={wearReco}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

window.OutfitsScreen = OutfitsScreen;
