// Add / Upload screen — cozy, with tweakable controls
// API-aware: if window.SS_API exists, uses the real ResNet classifier +
// Vercel Blob upload. Otherwise falls back to the fake scan with seed data
// so the same file works in the design preview AND in the deployed app.

const { useState: uS, useEffect: uE, useMemo: uM } = React;

const UPLOAD_TWEAKS = /*EDITMODE-BEGIN*/{
  "scanSpeed": 1,
  "showConfidence": true,
  "stylistTone": "warm",
  "accent": "terra",
  "showSimilar": true
}/*EDITMODE-END*/;

function UploadScreen({ state, dispatch, compact, tweaks }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FS = window.SS_FONT_SERIF, FN = window.SS_FONT_SANS;
  const t = { ...UPLOAD_TWEAKS, ...(tweaks || {}) };
  const incoming = window.SS_INCOMING;
  const hasAPI = typeof window !== 'undefined' && !!window.SS_API;

  const [phase, setPhase] = uS('idle');   // idle | scanning | done
  const [saving, setSaving] = uS(false);   // uploading on save
  const [reveal, setReveal] = uS({});
  const [errorMsg, setErrorMsg] = uS(null);
  const [userImage, setUserImage] = uS(null);
  const [originalImage, setOriginalImage] = uS(null);
  const [userFile, setUserFile] = uS(null);   // raw File for API upload + predict
  const [bgRemoved, setBgRemoved] = uS(false);
  const [editing, setEditing] = uS(false);
  const [name, setName] = uS(hasAPI ? '' : incoming.label);
  const fileRef = React.useRef(null);

  function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setUserFile(f);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUserImage(ev.target.result);
      setOriginalImage(ev.target.result);
      setBgRemoved(false);
      start(f);
    };
    reader.readAsDataURL(f);
  }

  // Corner-sample background removal. Works best on plain backdrops.
  function removeBackground() {
    if (!originalImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      const w = canvas.width, h = canvas.height;
      const samplePts = [
        [0, 0], [w-1, 0], [0, h-1], [w-1, h-1],
        [Math.floor(w/2), 0], [Math.floor(w/2), h-1],
        [0, Math.floor(h/2)], [w-1, Math.floor(h/2)],
      ];
      let br=0, bg=0, bb=0;
      samplePts.forEach(([x,y]) => {
        const i = (y * w + x) * 4;
        br += px[i]; bg += px[i+1]; bb += px[i+2];
      });
      br /= samplePts.length; bg /= samplePts.length; bb /= samplePts.length;
      const T_HARD = 38;
      const T_SOFT = 70;
      for (let i = 0; i < px.length; i += 4) {
        const d = Math.sqrt(
          (px[i]   - br) ** 2 +
          (px[i+1] - bg) ** 2 +
          (px[i+2] - bb) ** 2
        );
        if (d < T_HARD) {
          px[i+3] = 0;
        } else if (d < T_SOFT) {
          px[i+3] = Math.round(((d - T_HARD) / (T_SOFT - T_HARD)) * 255);
        }
      }
      ctx.putImageData(data, 0, 0);
      setUserImage(canvas.toDataURL('image/png'));
      setBgRemoved(true);
    };
    img.src = originalImage;
  }

  function restoreBackground() {
    if (originalImage) {
      setUserImage(originalImage);
      setBgRemoved(false);
    }
  }
  const accentColor = { terra: C.terra, sage: C.sage, butter: C.butter, rose: '#D89AA0' }[t.accent] || C.terra;
  const accentDark = { terra: '#B45A3D', sage: '#5C7458', butter: '#9C7E2E', rose: '#A56F76' }[t.accent] || '#B45A3D';

  // Fake-scan path — used in design preview and "Try with sample" mode
  function fakeScan() {
    const k = t.scanSpeed || 1;
    setTimeout(() => setReveal(r => ({ ...r, category: incoming.cat })), 500/k);
    setTimeout(() => setReveal(r => ({ ...r, color: incoming.color })), 1000/k);
    setTimeout(() => setReveal(r => ({ ...r, vibe: incoming.tags.join(' · ') })), 1500/k);
    setTimeout(() => setReveal(r => ({ ...r, fabric: 'cotton · pointelle knit' })), 2000/k);
    setTimeout(() => { setReveal(r => ({ ...r, conf: 0.94 })); setPhase('done'); }, 2500/k);
  }

  async function start(fileOverride) {
    setPhase('scanning');
    setReveal({});
    setErrorMsg(null);

    const file = fileOverride || userFile;

    // No real file (sample mode) or no API → fake scan
    if (!file || !hasAPI) {
      fakeScan();
      return;
    }

    // Real photo → call HF Space via /api/predict
    try {
      const prediction = await window.SS_API.predict(file);
      const k = t.scanSpeed || 1;
      // Reveal fields cinematically after the response lands
      setTimeout(() => setReveal(r => ({ ...r, category: prediction.category })),  300/k);
      setTimeout(() => setReveal(r => ({ ...r, color:    prediction.color })),     700/k);
      setTimeout(() => setReveal(r => ({ ...r, vibe:     '' })),                  1100/k);
      setTimeout(() => setReveal(r => ({ ...r, fabric:   '' })),                  1400/k);
      setTimeout(() => {
        setReveal(r => ({
          ...r,
          conf: prediction.confidence,
          _swatch: prediction.swatch,
          _subcategory: prediction.subcategory,
        }));
        setPhase('done');
        // Vibe wasn't predicted — gently nudge user into edit mode
        if (!name) {
          setName(`New ${prediction.subcategory.toLowerCase()}`);
        }
      }, 1700/k);
    } catch (e) {
      console.error('[StyleSync] predict failed:', e);
      setPhase('done');
      setErrorMsg(
        'Could not read this photo — the model may be warming up. ' +
        'Try again in 30 seconds, or use a different photo.'
      );
    }
  }

  function reset() {
    setPhase('idle');
    setReveal({});
    setErrorMsg(null);
    setUserImage(null);
    setOriginalImage(null);
    setUserFile(null);
    setBgRemoved(false);
    setName(hasAPI ? '' : incoming.label);
    setEditing(false);
    setSaving(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function save() {
    if (saving) return;
    const finalColor = reveal.color || incoming.color;
    const finalCat   = reveal.category || incoming.cat;
    const finalVibe  = reveal.vibe
      ? reveal.vibe.split(/[·,/]\s*/).map(s => s.trim().replace(/\s+/g, '_')).filter(Boolean)
      : [];
    const finalSwatch = reveal._swatch
      || (window.SS_SWATCH && window.SS_SWATCH[finalColor])
      || incoming.swatch;

    // Determine the image to attach. If we have a real file + API, upload to Blob
    // storage and use the public URL. Otherwise use the in-memory data URL.
    let imageRef = userImage;
    if (hasAPI && userFile) {
      setSaving(true);
      try {
        imageRef = await window.SS_API.uploadImage(userFile);
      } catch (e) {
        console.error('[StyleSync] upload failed:', e);
        setErrorMsg('Image upload failed. Saving locally only.');
      }
      setSaving(false);
    }

    dispatch({ type: 'add_item', item: {
      id: 'new_' + Date.now(),
      label: name || `New ${finalCat}`,
      cat: finalCat,
      color: finalColor,
      swatch: finalSwatch,
      fabric: reveal.fabric || '',
      tags: finalVibe,
      image: imageRef,
      confidence: reveal.conf,
      createdAt: Date.now(),
    } });
    reset();
    dispatch({ type: 'goto', page: 'wardrobe' });
  }

  const tones = {
    warm:    "A weekday softener — pairs sweetly with the cords.",
    minimal: "Versatile · neutral · pairs with most bottoms.",
    poetic:  "A whisper of a tee. Wear it on the porch, in soft light.",
  };

  const similar = state.wardrobe.filter(x => x.cat === (reveal.category || incoming.cat)).slice(0, 3);

  const headline = errorMsg ? 'Hmm, something went wrong.'
    : saving ? 'Saving to your closet…'
    : phase === 'done' ? 'Tagged & ready.'
    : phase === 'scanning' ? (hasAPI && userFile ? 'Reading the photo…' : 'Reading the photo…')
    : 'Show us one piece.';

  return (
    <div style={{ padding: compact ? '20px 18px 32px' : '36px 44px 56px', background: C.cream, minHeight: '100%', display: 'grid', gap: compact ? 18 : 26 }}>

      <div>
        <window.Eyebrow style={{ marginBottom: 10 }}>Add a piece</window.Eyebrow>
        <window.ScreenH1 compact={compact}>{headline}</window.ScreenH1>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1fr' : '1fr 1.1fr',
        gap: compact ? 18 : 24, alignItems: 'start',
      }}>
        {/* LEFT: photo / drop zone */}
        <div style={{
          background: C.paper,
          border: `1px solid ${C.line}`, borderRadius: R.r2,
          padding: compact ? 18 : 22, overflow: 'hidden',
        }}>
          <window.Eyebrow style={{ marginBottom: 14 }}>Photo</window.Eyebrow>

          {phase === 'idle' ? (
            <div style={{
              aspectRatio: '4/5', borderRadius: R.r1,
              border: `1px solid ${C.line}`,
              background: C.cream,
              display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center',
            }}>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                />
                <button
                  onClick={() => fileRef.current && fileRef.current.click()}
                  aria-label="Upload a photo"
                  title="Upload a photo"
                  style={{
                    width: 56, height: 56, margin: '0 auto 16px', borderRadius: '50%',
                    background: C.butter, color: C.ink,
                    display: 'grid', placeItems: 'center',
                    fontFamily: FN, fontSize: 24, fontWeight: 400,
                    border: 'none', cursor: 'pointer',
                    transition: 'transform .15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
                >+</button>
                <div style={{
                  fontFamily: FS, fontSize: compact ? 19 : 22, color: C.ink, marginBottom: 8,
                  letterSpacing: -0.2,
                }}>Drop a photo here</div>
                <div style={{ fontFamily: FN, fontSize: 12, color: C.muted, marginBottom: 18 }}>
                  PNG or JPG · single piece works best
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <window.SoftButton variant="primary" size="sm" onClick={() => fileRef.current && fileRef.current.click()}>Choose photo</window.SoftButton>
                  <window.SoftButton variant="ghost" size="sm" onClick={() => start()}>Try with sample</window.SoftButton>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: R.r1, overflow: 'hidden', background: bgRemoved ? `repeating-conic-gradient(${C.cream} 0% 25%, ${C.paper} 25% 50%) 0 0/16px 16px` : C.cream }}>
              {userImage ? (
                <img src={userImage} alt="Uploaded piece" style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  display: 'block', borderRadius: R.r1,
                }}/>
              ) : (
                <window.GarmentTile item={incoming} size="lg" style={{ aspectRatio: 'auto', height: '100%', borderRadius: R.r1 }}/>
              )}
              {phase === 'scanning' && (
                <>
                  <div style={{
                    position: 'absolute', left: 14, right: 14,
                    height: 2, background: `linear-gradient(90deg, transparent, ${accentDark}, transparent)`,
                    boxShadow: `0 0 14px ${accentColor}`,
                    animation: `ssScan ${1.6/(t.scanSpeed||1)}s ease-in-out infinite`,
                  }}/>
                  <div style={{
                    position: 'absolute', left: 12, top: 12,
                    background: C.ink, color: C.paper, fontSize: 10,
                    fontFamily: FN, letterSpacing: 1.2, textTransform: 'uppercase',
                    padding: '4px 9px', borderRadius: R.r3,
                  }}>reading</div>
                  <style>{`@keyframes ssScan { 0%{top:14px} 50%{top:calc(100% - 16px)} 100%{top:14px} }`}</style>
                </>
              )}
              {phase === 'done' && !errorMsg && (
                <div style={{
                  position: 'absolute', left: 12, top: 12,
                  background: '#5C7458', color: C.cream, fontSize: 10,
                  fontFamily: FN, letterSpacing: 1.2, textTransform: 'uppercase',
                  padding: '4px 9px', borderRadius: R.r3,
                }}>tagged</div>
              )}
              {errorMsg && (
                <div style={{
                  position: 'absolute', left: 12, top: 12,
                  background: '#B85547', color: C.paper, fontSize: 10,
                  fontFamily: FN, letterSpacing: 1.2, textTransform: 'uppercase',
                  padding: '4px 9px', borderRadius: R.r3,
                }}>error</div>
              )}
            </div>
          )}

          {phase !== 'idle' && (
            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {userImage && (
                bgRemoved
                  ? <window.SoftButton variant="ghost" size="sm" onClick={restoreBackground}>Restore background</window.SoftButton>
                  : <window.SoftButton variant="cream" size="sm" onClick={removeBackground}>✂ Remove background</window.SoftButton>
              )}
              <window.SoftButton variant="ghost" size="sm" onClick={reset}>Try a different photo</window.SoftButton>
            </div>
          )}
        </div>

        {/* RIGHT: tag readout + actions */}
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{
            background: C.paper, border: `1px solid ${C.line}`,
            borderRadius: R.r2, padding: compact ? 18 : 22,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <window.Eyebrow>{editing ? 'Edit tags' : 'What we see'}</window.Eyebrow>
              {editing && <window.Eyebrow style={{ color: accentDark }}>tap to change</window.Eyebrow>}
            </div>

            {errorMsg && (
              <div style={{
                background: `color-mix(in oklab, #B85547, ${C.paper} 90%)`,
                border: `1px solid color-mix(in oklab, #B85547, ${C.paper} 70%)`,
                borderRadius: R.r1, padding: 12, marginBottom: 12,
                fontFamily: FN, fontSize: 13, color: '#7a3a30', lineHeight: 1.5,
              }}>{errorMsg}</div>
            )}

            {/* Name field — always editable */}
            <div style={{
              display: 'grid', gridTemplateColumns: '90px 1fr',
              alignItems: 'center', gap: 10, padding: '11px 0',
              borderBottom: `1px solid ${C.lineSoft}`,
            }}>
              <span style={{ fontFamily: FN, fontSize: 11, color: C.muted }}>Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Give it a name…"
                disabled={phase === 'idle'}
                style={{
                  fontFamily: FN, fontSize: 14, fontWeight: 500, color: C.ink,
                  background: phase === 'idle' ? 'transparent' : C.cream,
                  border: `1px solid ${phase === 'idle' ? 'transparent' : C.line}`,
                  borderRadius: R.r1, padding: '6px 10px', outline: 'none',
                  width: '100%', boxSizing: 'border-box',
                }}
              />
            </div>

            {[
              ['Category', 'category', reveal.category, ['top','bottom','shoes','outerwear','dress']],
              ['Color',    'color',    reveal.color,    Object.keys(window.SS_SWATCH || {})],
              ['Fabric',   'fabric',   reveal.fabric,   ['cotton','linen','wool','silk','denim','knit','synthetic']],
              ['Vibe',     'vibe',     reveal.vibe,     (window.SS_GENRES || []).map(g => g.key.replace('_',' '))],
              ...(t.showConfidence && !editing ? [['Confidence', 'conf', reveal.conf ? Math.round(reveal.conf*100) + '%' : null, null]] : []),
            ].map(([k, key, v, options], i, arr) => (
              <div key={k} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr auto',
                alignItems: 'center', gap: 10, padding: '11px 0',
                borderBottom: i < arr.length-1 ? `1px solid ${C.lineSoft}` : 'none',
              }}>
                <span style={{
                  fontFamily: FN, fontSize: 11,
                  color: C.muted,
                }}>{k}</span>
                {editing && options ? (
                  <select
                    value={v || ''}
                    onChange={(e) => setReveal(r => ({ ...r, [key]: e.target.value }))}
                    style={{
                      fontFamily: FN, fontSize: 14, fontWeight: 500, color: C.ink,
                      background: C.cream, border: `1px solid ${C.line}`,
                      borderRadius: R.r1, padding: '6px 10px', outline: 'none',
                      width: '100%', cursor: 'pointer',
                    }}>
                    <option value="">—</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <span style={{
                    fontFamily: FN,
                    fontSize: 14, fontWeight: 500,
                    color: v ? C.ink : '#C9BDA0',
                  }}>{v || (k === 'Vibe' && phase === 'done' && hasAPI ? 'pick one →' : '—')}</span>
                )}
                <span>
                  {k === 'Color' && v && (
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: (window.SS_SWATCH && window.SS_SWATCH[v]) || incoming.swatch, border: `1px solid ${C.line}`, display: 'inline-block' }}/>
                  )}
                  {k === 'Confidence' && v && (
                    <span style={{ width: 60, height: 4, borderRadius: 3, background: C.line, position: 'relative', display: 'inline-block' }}>
                      <span style={{ position: 'absolute', inset: 0, width: `${reveal.conf*100}%`, background: '#5C7458', borderRadius: 3 }}/>
                    </span>
                  )}
                </span>
              </div>
            ))}

            {/* Stylist's note */}
            {phase === 'done' && !errorMsg && (
              <div style={{
                marginTop: 14, background: C.cream,
                borderRadius: R.r1, padding: 14,
              }}>
                <window.Eyebrow style={{ marginBottom: 6 }}>Stylist's note</window.Eyebrow>
                <div style={{
                  fontFamily: FS, fontStyle: 'italic',
                  fontSize: 14, color: C.ink, lineHeight: 1.5,
                }}>{tones[t.stylistTone]}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {phase === 'idle'     && <window.SoftButton variant="primary" onClick={() => start()}>Start scan</window.SoftButton>}
              {phase === 'scanning' && <window.SoftButton variant="cream" disabled>Reading…</window.SoftButton>}
              {phase === 'done' && !editing && !errorMsg && <>
                <window.SoftButton variant="primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : 'Save to closet'}
                </window.SoftButton>
                <window.SoftButton variant="ghost" onClick={() => setEditing(true)}>Edit tags</window.SoftButton>
              </>}
              {phase === 'done' && editing && <>
                <window.SoftButton variant="primary" onClick={() => setEditing(false)}>Done editing</window.SoftButton>
                <window.SoftButton variant="ghost" onClick={() => setEditing(false)}>Cancel</window.SoftButton>
              </>}
              {phase === 'done' && errorMsg && (
                <window.SoftButton variant="primary" onClick={reset}>Try another photo</window.SoftButton>
              )}
            </div>
          </div>

          {t.showSimilar && phase === 'done' && !errorMsg && similar.length > 0 && (
            <div style={{
              background: C.paper, border: `1px solid ${C.line}`,
              borderRadius: R.r2, padding: 18,
            }}>
              <window.Eyebrow style={{ marginBottom: 10 }}>Already in your closet</window.Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {similar.map(it => <window.GarmentTile key={it.id} item={it} size="sm"/>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.UploadScreen = UploadScreen;
window.UPLOAD_TWEAKS = UPLOAD_TWEAKS;
