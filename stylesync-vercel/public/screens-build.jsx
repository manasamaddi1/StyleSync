// screens-build.jsx — manual Outfit Builder canvas

const { useState: uSB, useMemo: uMB, useEffect: uEB } = React;

const SLOT_ORDER = ['outerwear', 'top', 'bottom', 'shoes'];
const SLOT_LABEL = { outerwear: 'Layer', top: 'Top', bottom: 'Bottom', shoes: 'Shoes' };
const SLOT_HINT  = {
  outerwear: 'A jacket, cardigan, or vest',
  top:       'Tee, blouse, knit, anything above',
  bottom:    'Pants, jeans, or a skirt',
  shoes:     'On your feet',
};

function SlotZone({ slotKey, item, compact, onDrop, onClear, isActive, onActivate, dropAllowed }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FN = window.SS_FONT_SANS, FS = window.SS_FONT_SERIF;
  const [hover, setHover] = uSB(false);
  const empty = !item;

  return (
    <div
      onClick={() => onActivate?.(slotKey)}
      onDragOver={(e) => { if (dropAllowed) { e.preventDefault(); setHover(true); } }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault(); setHover(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onDrop?.(slotKey, id);
      }}
      style={{
        position: 'relative',
        borderRadius: R.r2,
        border: hover && dropAllowed
          ? `2px solid ${C.terra}`
          : isActive
          ? `1.5px solid ${C.ink}`
          : empty
          ? `1.5px dashed ${C.line}`
          : `1px solid ${C.line}`,
        background: hover && dropAllowed
          ? `color-mix(in oklab, ${C.terra}, ${C.paper} 82%)`
          : empty
          ? 'transparent'
          : C.paper,
        padding: compact ? 12 : 14,
        minHeight: empty ? (compact ? 96 : 124) : 'auto',
        display: 'flex', alignItems: 'center', gap: compact ? 12 : 16,
        cursor: 'pointer',
        transition: 'border-color .15s, background .15s',
      }}
    >
      {empty ? (
        <>
          <div style={{
            width: compact ? 54 : 72, height: compact ? 64 : 88,
            background: C.paper, border: `1px dashed ${C.line}`,
            borderRadius: R.r1, flex: 'none',
            display: 'grid', placeItems: 'center',
            color: C.muted, fontSize: 22, fontFamily: FS, fontStyle: 'italic',
          }}>+</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FN, fontSize: 11, letterSpacing: 1.4, color: C.muted, textTransform: 'uppercase' }}>{SLOT_LABEL[slotKey]}</div>
            <div style={{
              fontFamily: FS, fontWeight: 400, fontStyle: 'italic',
              fontSize: compact ? 16 : 18, color: C.ink, marginTop: 4, lineHeight: 1.2,
            }}>{SLOT_HINT[slotKey]}</div>
          </div>
          {isActive && !compact && (
            <div style={{
              fontFamily: FN, fontSize: 10, letterSpacing: 1.4, color: C.terraD,
              textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>tap a piece →</div>
          )}
        </>
      ) : (
        <>
          <div style={{ width: compact ? 70 : 92, flex: 'none' }}>
            <window.GarmentTile item={item} size="sm" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FN, fontSize: 11, letterSpacing: 1.4, color: C.muted, textTransform: 'uppercase' }}>{SLOT_LABEL[slotKey]}</div>
            <div style={{
              fontFamily: FS, fontSize: compact ? 18 : 21,
              color: C.ink, marginTop: 3, lineHeight: 1.1,
              textTransform: 'lowercase', letterSpacing: -0.2,
            }}>{item.label.toLowerCase()}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', background: item.swatch, border: `1px solid ${C.line}` }}/>
              <span style={{ fontFamily: FN, fontSize: 11, color: C.muted }}>
                {item.color}{item.fabric ? ` · ${item.fabric}` : item.pattern && item.pattern !== 'solid' ? ` · ${item.pattern}` : ''}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClear?.(slotKey); }}
            aria-label="Remove from look"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.muted, fontSize: 20, lineHeight: 1, padding: 4,
            }}>×</button>
        </>
      )}
    </div>
  );
}

function ClosetItem({ item, favorite, onClick, draggable, onDragStart, onDragEnd, dimmed }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FN = window.SS_FONT_SANS, FS = window.SS_FONT_SERIF;
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        cursor: 'grab', opacity: dimmed ? 0.35 : 1,
        transition: 'opacity .15s',
      }}>
      <div style={{ pointerEvents: 'none' }}>
        <window.GarmentTile item={item} size="sm" favorite={favorite} />
      </div>
    </div>
  );
}

function BuildScreen({ state, dispatch, compact, tweaks }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FS = window.SS_FONT_SERIF, FN = window.SS_FONT_SANS;
  const t = { ...(window.UPLOAD_TWEAKS || {}), ...(tweaks || {}) };
  const accentMap = { terra: C.terra, sage: C.sage, butter: C.butter, rose: '#D89AA0' };
  const accent = accentMap[t.accent] || C.terra;

  const [slots, setSlots] = uSB({ outerwear: null, top: null, bottom: null, shoes: null });
  const [filter, setFilter] = uSB('all'); // all | top | bottom | shoes | outerwear | favorites
  const [selectedSlot, setSelectedSlot] = uSB('top');
  const [name, setName] = uSB('Sunday brunch');
  const [draggingCat, setDraggingCat] = uSB(null);
  const [toast, setToast] = uSB(null);

  const saved = state.outfits || [];

  uEB(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  // Consume an incoming "wear today" hand-off from another screen
  uEB(() => {
    const look = state.loadInto;
    if (!look) return;
    const next = { outerwear: null, top: null, bottom: null, shoes: null };
    SLOT_ORDER.forEach(s => {
      const id = look.slots[s];
      if (id) next[s] = state.wardrobe.find(x => x.id === id) || null;
    });
    setSlots(next);
    setName(look.name || 'Untitled');
    setSelectedSlot(SLOT_ORDER.find(s => !next[s]) || 'top');
    setToast(`Loaded "${look.name}". Tweak and save.`);
    dispatch({ type: 'consumed_load' });
  }, [state.loadNonce]);

  // Auto-advance selected slot to first empty after placing
  function advanceSelection(filledSlot) {
    const order = SLOT_ORDER;
    const start = order.indexOf(filledSlot);
    for (let i = 1; i <= order.length; i++) {
      const k = order[(start + i) % order.length];
      if (!slotsForCheck[k]) return setSelectedSlot(k);
    }
  }
  // Track current snapshot (closure-safe) inside callbacks below
  const slotsForCheck = slots;

  const filtered = uMB(() => {
    let pool = state.wardrobe;
    if (filter === 'favorites') pool = pool.filter(it => state.favorites.includes(it.id));
    else if (filter !== 'all') pool = pool.filter(it => it.cat === filter);
    return pool;
  }, [state.wardrobe, state.favorites, filter]);

  const filled = SLOT_ORDER.map(s => slots[s]).filter(Boolean);
  const occCounts = {};
  filled.forEach(it => { if (it.occasion) occCounts[it.occasion] = (occCounts[it.occasion] || 0) + 1; });
  const sortedOcc = Object.entries(occCounts).sort((a, b) => b[1] - a[1]);
  const topOcc = sortedOcc[0];
  const occasionMatch =
    filled.length < 2 ? '—'
    : topOcc && topOcc[1] >= 2
      ? `${topOcc[1]}/${filled.length} ${topOcc[0]}`
      : 'mixed';

  function placeItem(slotKey, item) {
    if (!item || item.cat !== slotKey) {
      setToast(`That's a ${item?.cat}, not a ${slotKey}.`);
      return;
    }
    setSlots(prev => {
      const next = { ...prev, [slotKey]: item };
      // advance selection
      const order = SLOT_ORDER;
      const start = order.indexOf(slotKey);
      for (let i = 1; i <= order.length; i++) {
        const k = order[(start + i) % order.length];
        if (!next[k]) { setSelectedSlot(k); break; }
      }
      return next;
    });
  }
  function onItemClick(it) {
    setSlots(prev => {
      const next = { ...prev, [it.cat]: it };
      const order = SLOT_ORDER;
      const start = order.indexOf(it.cat);
      for (let i = 1; i <= order.length; i++) {
        const k = order[(start + i) % order.length];
        if (!next[k]) { setSelectedSlot(k); break; }
      }
      return next;
    });
  }
  function clearSlot(s) { setSlots(prev => ({ ...prev, [s]: null })); setSelectedSlot(s); }
  function clearAll()   { setSlots({ outerwear: null, top: null, bottom: null, shoes: null }); setSelectedSlot('top'); }

  // Load a recommendation-engine suggestion into the canvas
  function applySuggestion(outfit) {
    const next = { outerwear: null, top: null, bottom: null, shoes: null };
    SLOT_ORDER.forEach(s => {
      const rec = outfit.slots[s];
      if (rec) next[s] = state.wardrobe.find(x => x.id === rec.id) || rec._raw || null;
    });
    setSlots(next);
    setSelectedSlot(SLOT_ORDER.find(s => !next[s]) || 'top');
    setToast(`Styled a ${Math.round(outfit.score * 100)}% match — tweak and save.`);
  }

  function autoPair() {
    const have = new Set(filled.map(it => it.occasion).filter(Boolean));
    const next = { ...slots };
    SLOT_ORDER.forEach(s => {
      if (!next[s]) {
        const pool = state.wardrobe.filter(it => it.cat === s);
        // prefer matching occasion, then favorites, then anything
        const matched = pool.filter(it => it.occasion && have.has(it.occasion));
        const faved = pool.filter(it => state.favorites.includes(it.id));
        next[s] = matched[0] || faved[0] || pool[0] || null;
      }
    });
    setSlots(next);
    setToast('Filled in the rest from your closet.');
  }
  function shuffle() {
    const next = {};
    SLOT_ORDER.forEach(s => {
      const pool = state.wardrobe.filter(it => it.cat === s);
      next[s] = pool[Math.floor(Math.random() * pool.length)] || null;
    });
    setSlots(next);
  }
  function saveLook() {
    if (filled.length < 2) { setToast('Add at least two pieces first.'); return; }
    const look = {
      id: 'look-' + Date.now(),
      name: (name || 'Untitled').trim(),
      // store IDs so looks stay in sync if pieces are edited/removed
      slots: SLOT_ORDER.reduce((acc, s) => { acc[s] = slots[s] ? slots[s].id : null; return acc; }, {}),
      tag: topOcc ? topOcc[0] : null,
      createdAt: Date.now(),
    };
    dispatch({ type: 'save_outfit', outfit: look });
    setToast(`Saved "${look.name}"`);
  }
  function loadLook(look) {
    const next = { outerwear: null, top: null, bottom: null, shoes: null };
    SLOT_ORDER.forEach(s => {
      const id = look.slots[s];
      if (id) next[s] = state.wardrobe.find(x => x.id === id) || null;
    });
    setSlots(next);
    setName(look.name);
  }
  function deleteLook(id) {
    dispatch({ type: 'remove_outfit', id });
    // Production app shows a global undo toast for this; local toast would duplicate.
  }

  // ─────── desktop layout vs mobile ───────
  const ScreenH1 = window.ScreenH1;
  const Eyebrow  = window.Eyebrow;

  // Filter pills
  const filterOptions = [
    { k: 'all', label: 'Everything' },
    { k: 'favorites', label: '♥ Saved' },
    { k: 'outerwear', label: 'Layers' },
    { k: 'top', label: 'Tops' },
    { k: 'bottom', label: 'Bottoms' },
    { k: 'shoes', label: 'Shoes' },
  ];

  // Canvas slots
  const Canvas = (
    <div style={{
      background: C.paper,
      border: `1px solid ${C.line}`,
      borderRadius: R.r2,
      padding: compact ? 16 : 22,
      display: 'grid', gap: compact ? 10 : 12,
      position: 'relative',
    }}>
      {/* faint paper grain */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: R.r2,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(46,42,36,.04) 1px, transparent 1.4px)',
        backgroundSize: '7px 7px',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Eyebrow>The look</Eyebrow>
        <button
          onClick={clearAll}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: C.muted, fontFamily: FN, fontSize: 12, padding: 0,
          }}>clear all</button>
      </div>
      <div style={{ position: 'relative', display: 'grid', gap: compact ? 8 : 10 }}>
        {SLOT_ORDER.map(s => (
          <SlotZone
            key={s}
            slotKey={s}
            item={slots[s]}
            compact={compact}
            onDrop={(slotKey, id) => {
              const item = state.wardrobe.find(x => x.id === id);
              if (item) placeItem(slotKey, item);
            }}
            onClear={clearSlot}
            isActive={selectedSlot === s}
            onActivate={setSelectedSlot}
            dropAllowed={!draggingCat || draggingCat === s}
          />
        ))}
      </div>
    </div>
  );

  // Lightweight seed: drop an engine-styled look onto the canvas to start from.
  // The full "Styled for you" experience now lives on the Looks page.
  function runSeed(occ) {
    if (!window.SS_RECO) return;
    const res = window.SS_RECO.recommend(state.wardrobe, occ, { limit: 1 });
    if (!res.outfits || !res.outfits.length) {
      setToast('Add a top and a bottom to your closet first.');
      return;
    }
    applySuggestion(res.outfits[0]);
  }
  const Reco = (
    <div style={{
      background: C.paper, border: `1px solid ${C.line}`,
      borderRadius: R.r2, padding: compact ? 14 : 18,
      display: 'grid', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <Eyebrow>Need a starting point?</Eyebrow>
        <button
          onClick={() => dispatch({ type: 'goto', page: 'outfits' })}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: C.terraD, fontFamily: FN, fontSize: 12, fontWeight: 500, padding: 0,
          }}>Browse styled looks →</button>
      </div>
      <div style={{
        fontFamily: FS, fontStyle: 'italic', fontSize: compact ? 15 : 16,
        color: C.muted, lineHeight: 1.3, marginTop: -2,
      }}>Drop a styled outfit onto the canvas, then make it yours.</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['casual', 'Casual'], ['formal', 'Formal'], ['sports', 'Sports']].map(([k, label]) => (
          <window.SoftButton key={k} variant="cream" size="sm" onClick={() => runSeed(k)}>✦ {label}</window.SoftButton>
        ))}
      </div>
    </div>
  );

  // Stats / actions bar
  const StatsBar = (
    <div style={{
      background: C.paper, border: `1px solid ${C.line}`,
      borderRadius: R.r2, padding: compact ? 14 : 18,
      display: 'grid', gap: 14,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap: compact ? 12 : 16, alignItems: 'center',
      }}>
        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Palette</Eyebrow>
          <div style={{ display: 'flex', gap: 5, minHeight: 16 }}>
            {filled.length === 0 ? (
              <span style={{ fontFamily: FN, fontSize: 12, color: C.muted }}>—</span>
            ) : filled.map((it, i) => (
              <span key={i} title={it.color} style={{
                width: 16, height: 16, borderRadius: '50%',
                background: it.swatch, border: `1px solid ${C.line}`,
              }}/>
            ))}
          </div>
        </div>
        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Occasion</Eyebrow>
          <div style={{
            fontFamily: FS, fontSize: compact ? 17 : 20, color: C.ink,
            textTransform: 'lowercase', lineHeight: 1.1,
          }}>{occasionMatch}</div>
        </div>
        {!compact && (
          <div>
            <Eyebrow style={{ marginBottom: 6 }}>Filled</Eyebrow>
            <div style={{
              fontFamily: FS, fontSize: 20, color: C.ink, lineHeight: 1.1,
            }}>{filled.length} / 4</div>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this look…"
          style={{
            flex: 1, minWidth: 140,
            fontFamily: FN, fontSize: 14, color: C.ink,
            background: C.cream, border: `1px solid ${C.line}`,
            borderRadius: R.r3, padding: '10px 14px', outline: 'none',
          }}
        />
        <window.SoftButton variant="primary" onClick={saveLook}>Save look</window.SoftButton>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <window.SoftButton variant="cream" size="sm" onClick={autoPair}>✦ Auto-pair</window.SoftButton>
        <window.SoftButton variant="cream" size="sm" onClick={shuffle}>↻ Shuffle</window.SoftButton>
      </div>
    </div>
  );

  // Closet drawer
  const Closet = (
    <div style={{
      background: C.paper, border: `1px solid ${C.line}`,
      borderRadius: R.r2, padding: compact ? 16 : 20,
      display: 'grid', gap: 14,
      alignSelf: 'start',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Eyebrow>Your closet</Eyebrow>
        <span style={{ fontFamily: FN, fontSize: 12, color: C.muted }}>
          {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
      }}>
        {filterOptions.map(f => (
          <button key={f.k}
            onClick={() => setFilter(f.k)}
            style={{
              background: filter === f.k ? C.ink : 'transparent',
              color: filter === f.k ? C.paper : C.ink,
              border: `1px solid ${filter === f.k ? C.ink : C.line}`,
              borderRadius: R.r3, cursor: 'pointer',
              padding: '6px 12px',
              fontFamily: FN, fontSize: 12, fontWeight: 500,
            }}>{f.label}</button>
        ))}
      </div>

      {!compact && (
        <div style={{
          fontFamily: FN, fontSize: 12, color: C.muted, lineHeight: 1.5,
        }}>
          Drag a piece onto the canvas, or tap to slot it into{' '}
          <span style={{ color: C.ink, fontWeight: 500 }}>{SLOT_LABEL[selectedSlot].toLowerCase()}</span>.
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
        gap: 10,
        maxHeight: compact ? 360 : 560,
        overflowY: 'auto',
        paddingRight: 4,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1', padding: '24px 0', textAlign: 'center',
            fontFamily: FN, fontSize: 13, color: C.muted,
          }}>Nothing here yet.</div>
        ) : filtered.map(it => {
          const inUse = SLOT_ORDER.some(s => slots[s] && slots[s].id === it.id);
          return (
            <ClosetItem
              key={it.id}
              item={it}
              favorite={state.favorites.includes(it.id)}
              dimmed={inUse}
              draggable={!compact}
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', it.id);
                e.dataTransfer.effectAllowed = 'move';
                setDraggingCat(it.cat);
              }}
              onDragEnd={() => setDraggingCat(null)}
              onClick={() => onItemClick(it)}
            />
          );
        })}
      </div>
    </div>
  );

  // Saved looks strip
  const SavedStrip = saved.length > 0 && (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 style={{
          fontFamily: FS, fontWeight: 400,
          fontSize: compact ? 20 : 24, margin: 0, color: C.ink,
        }}>Your saved looks</h2>
        <span style={{ fontFamily: FN, fontSize: 12, color: C.muted }}>{saved.length}</span>
      </div>
      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6,
      }}>
        {saved.map(look => {
          const itemsArr = SLOT_ORDER
            .map(s => state.wardrobe.find(x => x.id === look.slots[s]))
            .filter(Boolean);
          return (
            <div key={look.id}
              style={{
                flex: 'none',
                width: compact ? 200 : 240,
                background: C.paper, border: `1px solid ${C.line}`,
                borderRadius: R.r2, padding: 14,
                position: 'relative',
              }}>
              <button
                onClick={() => deleteLook(look.id)}
                aria-label="Delete look"
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: C.muted, fontSize: 16, lineHeight: 1, padding: 6,
                }}>×</button>
              <button
                onClick={() => loadLook(look)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: 'transparent', border: 'none', padding: 0,
                  cursor: 'pointer', fontFamily: FN,
                }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
                  marginBottom: 10,
                }}>
                  {itemsArr.slice(0, 4).map((it, i) => (
                    <window.GarmentTile key={i} item={it} size="sm" />
                  ))}
                  {Array.from({ length: Math.max(0, 4 - itemsArr.length) }).map((_, i) => (
                    <div key={`e${i}`} style={{
                      aspectRatio: '3/4', borderRadius: R.r1,
                      background: C.cream, border: `1px dashed ${C.line}`,
                    }}/>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {itemsArr.map((it, i) => (
                    <span key={i} style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: it.swatch, border: `1px solid ${C.line}`,
                    }}/>
                  ))}
                </div>
                <div style={{ fontFamily: FS, fontSize: 16, color: C.ink, textTransform: 'lowercase' }}>
                  {look.name.toLowerCase()}
                </div>
                {look.tag && (
                  <div style={{ fontFamily: FN, fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {String(look.tag).replace('_', ' ')}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{
      padding: compact ? '20px 16px 32px' : '36px 44px 56px',
      background: C.cream, minHeight: '100%',
      display: 'grid', gap: compact ? 18 : 26,
      position: 'relative',
    }}>
      <div>
        <Eyebrow style={{ marginBottom: 10 }}>Build a look</Eyebrow>
        <ScreenH1 compact={compact}>Dress your day, piece by piece.</ScreenH1>
      </div>

      {compact ? (
        <>
          {Canvas}
          {Reco}
          {Closet}
          {StatsBar}
          {SavedStrip}
        </>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(280px, 1fr)',
            gap: 22, alignItems: 'start',
          }}>
            <div style={{ display: 'grid', gap: 14 }}>
              {Canvas}
              {StatsBar}
              {Reco}
            </div>
            {Closet}
          </div>
          {SavedStrip}
        </>
      )}

      {toast && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 32,
          transform: 'translateX(-50%)',
          background: C.ink, color: C.paper,
          padding: '10px 18px', borderRadius: R.r3,
          fontFamily: FN, fontSize: 13, fontWeight: 500,
          boxShadow: '0 8px 24px rgba(46,42,36,.25)',
          zIndex: 30,
          animation: 'toastIn .2s ease',
        }}>
          {toast}
          <style>{`@keyframes toastIn { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
        </div>
      )}
    </div>
  );
}

window.BuildScreen = BuildScreen;
