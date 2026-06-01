// App: cozy navbar + canvas + tweakable upload screen

const { useReducer, useState: uSApp } = React;

const NAV = [
  { key: 'home',     label: 'Home' },
  { key: 'upload',   label: 'Add' },
  { key: 'wardrobe', label: 'Closet' },
  { key: 'build',    label: 'Build' },
  { key: 'outfits',  label: 'Looks' },
  { key: 'style',    label: 'Remix' },
];

function reducer(state, action) {
  switch (action.type) {
    case 'goto':     return { ...state, page: action.page };
    case 'add_item': return { ...state, wardrobe: [action.item, ...state.wardrobe] };
    case 'remove':   return { ...state, wardrobe: state.wardrobe.filter((x) => x.id !== action.id) };
    case 'fav':      return { ...state, favorites: state.favorites.includes(action.id) ? state.favorites.filter((x) => x !== action.id) : [...state.favorites, action.id] };
    case 'select':   return { ...state, selectedItemId: action.id };
    case 'update_item': return { ...state, wardrobe: state.wardrobe.map(x => x.id === action.item.id ? { ...x, ...action.item } : x) };
    case 'save_outfit':   return { ...state, outfits: [action.outfit, ...state.outfits].slice(0, 24) };
    case 'remove_outfit': return { ...state, outfits: state.outfits.filter((x) => x.id !== action.id) };
    case 'load_into_build': return { ...state, page: 'build', loadInto: action.outfit, loadNonce: (state.loadNonce || 0) + 1 };
    case 'consumed_load':   return { ...state, loadInto: null };
    default: return state;
  }
}

function NavBar({ page, onGoto, compact }) {
  const C = window.COZY;
  return (
    <div style={{
      display: 'flex', gap: 4,
      padding: compact ? '10px 14px' : '14px 24px',
      background: C.paper,
      borderBottom: `1px solid ${C.line}`,
      overflowX: 'auto',
      alignItems: 'center',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: compact ? 8 : 10,
        marginRight: compact ? 14 : 28,
      }}>
        <svg width={compact ? 26 : 32} height={compact ? 22 : 26} viewBox="0 0 80 64" aria-label="StyleSync hanger mark">
          <path d="M40 14 a8 8 0 1 0 -8 -8" fill="none" stroke={C.ink} strokeWidth="3" strokeLinecap="round"/>
          <path d="M40 14 L8 50 Q4 56 12 56 L68 56 Q76 56 72 50 Z" fill="none" stroke={C.ink} strokeWidth="3" strokeLinejoin="round"/>
          <circle cx="40" cy="14" r="2.6" fill={C.terra || '#C97B5C'}/>
        </svg>
        <div style={{
          fontFamily: '"Fraunces", Georgia, serif', fontStyle: 'italic',
          fontWeight: 500, fontSize: compact ? 18 : 22,
          color: C.ink, letterSpacing: -0.3, lineHeight: 1,
        }}>StyleSync</div>
      </div>
      {NAV.map((n) => (
        <button key={n.key} onClick={() => onGoto(n.key)}
          style={{
            background: page === n.key ? C.ink : 'transparent',
            color: page === n.key ? C.paper : C.muted,
            border: 'none', borderRadius: 999,
            padding: compact ? '6px 12px' : '8px 16px',
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 500, fontSize: compact ? 13 : 14,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{n.label}</button>
      ))}
    </div>
  );
}

function Frame({ state, dispatch, compact, tweaks }) {
  const Page = {
    home: window.HomeScreen,
    upload: window.UploadScreen,
    wardrobe: window.WardrobeScreen,
    build: window.BuildScreen,
    outfits: window.OutfitsScreen,
    style: window.StyleThisScreen,
  }[state.page] || window.HomeScreen;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: window.COZY.cream, overflow: 'hidden' }}>
      <NavBar page={state.page} onGoto={(p) => dispatch({ type: 'goto', page: p })} compact={compact} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Page state={state} dispatch={dispatch} compact={compact} tweaks={tweaks} />
      </div>
    </div>
  );
}

function App() {
  const seed = {
    page: 'home',
    wardrobe: window.SS_SEED_WARDROBE,
    favorites: ['t3','b3','s2'],
    selectedItemId: null,
    outfits: window.SS_SEED_OUTFITS || [],
    loadInto: null,
    loadNonce: 0,
  };
  const [stateD, dispatchD] = useReducer(reducer, seed);
  const [stateM, dispatchM] = useReducer(reducer, seed);
  const [tweaks, setTweak] = window.useTweaks(window.UPLOAD_TWEAKS);

  return (
    <>
      <DesignCanvas>
        <DCSection id="full" title="StyleSync" subtitle="Cozy/casual · desktop + mobile">
          <DCArtboard id="desktop-home" label="Desktop · Home" width={1280} height={820}>
            <ChromeWindow url="stylesync.app" tabs={[{ title: 'StyleSync' }]} width={1280} height={820}>
              <Frame state={stateD} dispatch={dispatchD} compact={false} tweaks={tweaks} />
            </ChromeWindow>
          </DCArtboard>
          <DCArtboard id="mobile-home" label="Mobile · Home" width={402} height={874}>
            <IOSDevice width={402} height={874} title="StyleSync">
              <Frame state={stateM} dispatch={dispatchM} compact={true} tweaks={tweaks} />
            </IOSDevice>
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <window.TweaksPanel title="Tweaks · Upload">
        <window.TweakSection label="Scan behavior" />
        <window.TweakSlider label="Scan speed" value={tweaks.scanSpeed} min={0.5} max={3} step={0.25} unit="×"
          onChange={(v) => setTweak('scanSpeed', v)} />
        <window.TweakToggle label="Show confidence" value={tweaks.showConfidence}
          onChange={(v) => setTweak('showConfidence', v)} />
        <window.TweakToggle label="Suggest similar pieces" value={tweaks.showSimilar}
          onChange={(v) => setTweak('showSimilar', v)} />

        <window.TweakSection label="Stylist" />
        <window.TweakRadio label="Stylist tone" value={tweaks.stylistTone}
          options={['warm','minimal','poetic']}
          onChange={(v) => setTweak('stylistTone', v)} />
        <window.TweakRadio label="Accent color" value={tweaks.accent}
          options={['terra','sage','butter','rose']}
          onChange={(v) => setTweak('accent', v)} />
      </window.TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
