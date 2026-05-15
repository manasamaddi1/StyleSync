// Upload screen + Wardrobe screen

const { useState: useStateUW, useEffect: useEffectUW, useRef: useRefUW } = React;

function UploadScreen({ state, dispatch, compact }) {
  const [phase, setPhase] = useStateUW('idle'); // idle, scanning, done
  const [tags, setTags] = useStateUW(null);
  const incoming = window.SS_INCOMING;

  function startScan() {
    setPhase('scanning');
    setTags(null);
    // step through tag reveals
    setTimeout(() => setTags({ category: incoming.cat }), 700);
    setTimeout(() => setTags((t) => ({ ...t, color: incoming.color })), 1300);
    setTimeout(() => setTags((t) => ({ ...t, style_tags: incoming.tags })), 1900);
    setTimeout(() => { setTags((t) => ({ ...t, confidence: 0.94 })); setPhase('done'); }, 2500);
  }

  function reset() { setPhase('idle'); setTags(null); }

  function save() {
    dispatch({ type: 'add', item: { ...incoming, id: 'new1_' + Date.now() } });
    reset();
    dispatch({ type: 'goto', page: 'wardrobe' });
  }

  return (
    <div style={{ padding: compact ? 16 : '32px 36px', display: 'grid', gap: 18 }}>
      <div>
        <Sticker color="#C8F03C" rotate={-3}>STEP 01</Sticker>
        <h2 style={{
          fontFamily: 'Big Shoulders Display, sans-serif',
          fontWeight: 900,
          fontSize: compact ? 40 : 64,
          margin: '8px 0 0',
          letterSpacing: -1.5,
          lineHeight: 0.9,
        }}>SNAP IT.</h2>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: compact ? 13 : 15, marginTop: 6, color: '#3A3A40' }}>
          Drop one piece. We'll tag the rest.
        </div>
      </div>

      {/* Drop zone */}
      <div style={{
        position: 'relative',
        background: phase === 'idle' ? '#F4F1E8' : '#C8F03C',
        border: phase === 'idle' ? '3px dashed #0F0F12' : '3px solid #0F0F12',
        borderRadius: 18,
        padding: compact ? '20px 16px' : '28px 24px',
        boxShadow: '5px 5px 0 0 #0F0F12',
        display: 'grid',
        gridTemplateColumns: compact ? '1fr' : '160px 1fr',
        gap: compact ? 16 : 24,
        alignItems: 'center',
        transition: 'background .3s',
        overflow: 'hidden',
      }}>
        {/* Tile preview */}
        <div style={{ width: compact ? 140 : 160, justifySelf: compact ? 'center' : 'start' }}>
          {phase === 'idle' ? (
            <div style={{
              aspectRatio: '3/4',
              background: '#EDE3CC',
              border: '2px solid #0F0F12',
              borderRadius: 14,
              display: 'grid', placeItems: 'center',
              boxShadow: 'inset 0 0 0 6px #F4F1E8',
              color: '#0F0F12',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              textAlign: 'center',
              padding: 8,
            }}>📷<br/>DRAG IMG<br/>HERE</div>
          ) : (
            <div style={{ position: 'relative' }}>
              <GarmentTile item={incoming} />
              {phase === 'scanning' && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, top: 0,
                  height: 4,
                  background: '#FF4FA3',
                  boxShadow: '0 0 12px #FF4FA3',
                  animation: 'scan 1.6s linear infinite',
                }} />
              )}
            </div>
          )}
        </div>

        {/* Right side: prompt or tags */}
        <div>
          {phase === 'idle' && (
            <>
              <div style={{ fontFamily: 'Big Shoulders Display, sans-serif', fontWeight: 900, fontSize: compact ? 22 : 30, lineHeight: 1, letterSpacing: 1 }}>
                DRAG, DROP, OR TAP
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 13, color: '#3A3A40', marginTop: 6, marginBottom: 14 }}>
                .png .jpg up to 8MB. We'll do the boring part.
              </div>
              <ChunkyButton variant="pink" onClick={startScan}>+ Use Demo Item</ChunkyButton>
            </>
          )}

          {phase !== 'idle' && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1.5 }}>
                {phase === 'scanning' ? 'AI://SCANNING...' : 'AI://DONE ✓'}
              </div>
              {[
                ['CATEGORY', tags?.category],
                ['COLOR',    tags?.color],
                ['VIBE',     tags?.style_tags ? tags.style_tags.join(' / ') : null],
                ['CONFIDENCE', tags?.confidence ? `${Math.round(tags.confidence * 100)}%` : null],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr',
                  alignItems: 'center',
                  gap: 10,
                  background: '#F4F1E8',
                  border: '2px solid #0F0F12',
                  borderRadius: 8,
                  padding: '6px 10px',
                  minHeight: 32,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11,
                }}>
                  <span style={{ letterSpacing: 1.4, opacity: 0.65 }}>{k}</span>
                  <span style={{
                    fontFamily: 'Big Shoulders Display, sans-serif',
                    fontWeight: 800,
                    fontSize: 16,
                    letterSpacing: 0.6,
                    color: v ? '#0F0F12' : '#bbb',
                  }}>{v ?? '— scanning —'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {phase === 'done' && <ChunkyButton variant="lime" size="lg" onClick={save}>✓ Save to Closet</ChunkyButton>}
        {phase !== 'idle' && <ChunkyButton variant="ghost" onClick={reset}>↺ Reset</ChunkyButton>}
      </div>

      <style>{`
        @keyframes scan { 0% { top: 0 } 50% { top: calc(100% - 4px) } 100% { top: 0 } }
      `}</style>
    </div>
  );
}

// ─────────────────────────── WARDROBE ───────────────────────────

function WardrobeScreen({ state, dispatch, compact }) {
  const [filter, setFilter] = useStateUW('all');
  const cats = ['all', 'top', 'bottom', 'shoes', 'outerwear'];
  const items = filter === 'all' ? state.wardrobe : state.wardrobe.filter((x) => x.cat === filter);

  return (
    <div style={{ padding: compact ? 16 : '32px 36px', display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Sticker color="#FF4FA3" rotate={-3}>YOUR CLOSET</Sticker>
          <h2 style={{
            fontFamily: 'Big Shoulders Display, sans-serif', fontWeight: 900,
            fontSize: compact ? 40 : 64, margin: '8px 0 0',
            letterSpacing: -1.5, lineHeight: 0.9,
          }}>{String(state.wardrobe.length).padStart(2,'0')} <span style={{ color: '#FF4FA3', WebkitTextStroke: '1.5px #0F0F12' }}>PIECES</span></h2>
        </div>
        <ChunkyButton variant="primary" onClick={() => dispatch({ type: 'goto', page: 'upload' })}>+ Add</ChunkyButton>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {cats.map((c) => (
          <Tab key={c} active={filter === c} onClick={() => setFilter(c)} color={c === filter ? '#C8F03C' : undefined}>
            {c.toUpperCase()} {c !== 'all' && (
              <span style={{ opacity: 0.5, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, marginLeft: 4 }}>
                {state.wardrobe.filter((x) => x.cat === c).length}
              </span>
            )}
          </Tab>
        ))}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div style={{
          background: '#F4F1E8',
          border: '2px dashed #0F0F12',
          borderRadius: 16,
          padding: 32,
          textAlign: 'center',
          fontFamily: 'Big Shoulders Display, sans-serif',
          fontWeight: 800,
          fontSize: 22,
        }}>
          NOTHING HERE YET<br/>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 400, fontSize: 13, color: '#3A3A40' }}>
            Snap a piece to fill the rack.
          </span>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: 14,
        }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'grid', gap: 6 }}>
              <GarmentTile item={item} favorite={state.favorites.has(item.id)} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => dispatch({ type: 'fav', id: item.id })}
                  style={{
                    flex: 1,
                    background: state.favorites.has(item.id) ? '#FF4FA3' : '#F4F1E8',
                    color: '#0F0F12',
                    border: '2px solid #0F0F12',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    letterSpacing: 1.2,
                    padding: '4px 0',
                    cursor: 'pointer',
                  }}>♥ FAV</button>
                <button
                  onClick={() => dispatch({ type: 'del', id: item.id })}
                  style={{
                    flex: 1,
                    background: '#F4F1E8',
                    color: '#0F0F12',
                    border: '2px solid #0F0F12',
                    borderRadius: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    letterSpacing: 1.2,
                    padding: '4px 0',
                    cursor: 'pointer',
                  }}>✕ DEL</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.UploadScreen = UploadScreen;
window.WardrobeScreen = WardrobeScreen;
