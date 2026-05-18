// Production app entry — Frame, responsive, with persistence + back-button + undo.

const { useReducer: uRP, useState: uSP, useEffect: uEP, useCallback: uCP, useRef: uRfP } = React;

// ─── persistence ───────────────────────────────────────────────────────────
const STORAGE_KEY = 'stylesync:state:v1';
const VALID_PAGES = ['home', 'upload', 'wardrobe', 'build', 'outfits', 'style'];

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.wardrobe)) return null;
    return parsed;
  } catch (e) {
    console.warn('[StyleSync] Could not read persisted state.', e);
    return null;
  }
}

function persist(state) {
  try {
    const { loadInto, loadNonce, selectedItemId, page, ...rest } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch (e) {
    // Likely quota exceeded (uploaded data-URL images can be big).
    console.warn('[StyleSync] Could not persist state — storage may be full.', e);
  }
}

function pageFromHash() {
  const h = (window.location.hash || '').replace(/^#\/?/, '');
  return VALID_PAGES.includes(h) ? h : null;
}

// ─── reducer ──────────────────────────────────────────────────────────────
function reducerProd(state, action) {
  switch (action.type) {
    case 'goto':     return { ...state, page: action.page };
    case 'add_item': return { ...state, wardrobe: [action.item, ...state.wardrobe] };
    case 'add_item_at': {
      // Undo helper — restore a removed item at its original index.
      const next = [...state.wardrobe];
      const i = Math.max(0, Math.min(next.length, action.index ?? 0));
      next.splice(i, 0, action.item);
      return { ...state, wardrobe: next };
    }
    case 'remove':   return { ...state, wardrobe: state.wardrobe.filter((x) => x.id !== action.id) };
    case 'fav':      return { ...state, favorites: state.favorites.includes(action.id) ? state.favorites.filter((x) => x !== action.id) : [...state.favorites, action.id] };
    case 'genre':    return { ...state, genre: action.genre };
    case 'select':   return { ...state, selectedItemId: action.id };
    case 'update_item': return { ...state, wardrobe: state.wardrobe.map(x => x.id === action.item.id ? { ...x, ...action.item } : x) };
    case 'save_outfit':   return { ...state, outfits: [action.outfit, ...state.outfits].slice(0, 24) };
    case 'save_outfit_at': {
      // Undo helper — restore a removed look at its original index.
      const next = [...state.outfits];
      const i = Math.max(0, Math.min(next.length, action.index ?? 0));
      next.splice(i, 0, action.outfit);
      return { ...state, outfits: next.slice(0, 24) };
    }
    case 'remove_outfit': return { ...state, outfits: state.outfits.filter((x) => x.id !== action.id) };
    case 'load_into_build': return { ...state, page: 'build', loadInto: action.outfit, loadNonce: (state.loadNonce || 0) + 1 };
    case 'consumed_load':   return { ...state, loadInto: null };
    default: return state;
  }
}

const NAV_PROD = [
  { key: 'home',     label: 'Home' },
  { key: 'upload',   label: 'Add' },
  { key: 'wardrobe', label: 'Closet' },
  { key: 'build',    label: 'Build' },
  { key: 'outfits',  label: 'Looks' },
  { key: 'style',    label: 'Remix' },
];

function NavBarProd({ page, onGoto, compact }) {
  const C = window.COZY;
  return (
    <div style={{
      display: 'flex', gap: 4,
      padding: compact ? '10px 14px' : '14px 24px',
      background: C.paper,
      borderBottom: `1px solid ${C.line}`,
      overflowX: 'auto',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <button
        onClick={() => onGoto('home')}
        aria-label="StyleSync home"
        style={{
          display: 'flex', alignItems: 'center', gap: compact ? 8 : 10,
          marginRight: compact ? 14 : 28,
          background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
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
      </button>
      {NAV_PROD.map((n) => (
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

// Floating bottom-center toast with optional Undo action.
function UndoToast({ toast, onDismiss, compact }) {
  const C = window.COZY;
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%', bottom: compact ? 20 : 32,
        transform: 'translateX(-50%)',
        background: C.ink, color: C.paper,
        padding: '10px 14px 10px 18px',
        borderRadius: 999,
        fontFamily: '"Space Grotesk", sans-serif', fontSize: 13, fontWeight: 500,
        boxShadow: '0 8px 24px rgba(46,42,36,.28)',
        zIndex: 60,
        display: 'flex', alignItems: 'center', gap: 14,
        maxWidth: 'calc(100vw - 32px)',
        animation: 'ssToastIn .2s ease',
      }}
    >
      <style>{`@keyframes ssToastIn { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }`}</style>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{toast.msg}</span>
      {toast.undo && (
        <button
          onClick={toast.undo}
          style={{
            background: 'transparent', color: C.butter,
            border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontWeight: 600, fontSize: 13,
            textDecoration: 'underline', textUnderlineOffset: 3,
            padding: 0,
          }}>Undo</button>
      )}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'rgba(251, 246, 234, 0.55)', fontSize: 16, lineHeight: 1,
          padding: 0, marginLeft: 2,
        }}>×</button>
    </div>
  );
}

// Responsive: compact at narrow widths
function useIsCompact(breakpoint = 720) {
  const [compact, setCompact] = uSP(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  uEP(() => {
    const onResize = () => setCompact(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return compact;
}

function ProductionApp() {
  const compact = useIsCompact();

  // Build initial state from localStorage + URL hash + seed fallback.
  const initialState = (() => {
    const p = loadPersisted();
    return {
      page: pageFromHash() || 'home',
      wardrobe: p?.wardrobe || window.SS_SEED_WARDROBE,
      favorites: p?.favorites || ['t3','b3','s2'],
      genre: p?.genre || 'casual',
      selectedItemId: null,
      outfits: p?.outfits || window.SS_SEED_OUTFITS || [],
      loadInto: null,
      loadNonce: 0,
    };
  })();

  const [state, rawDispatch] = uRP(reducerProd, initialState);
  const [toast, setToast] = uSP(null); // { msg, undo?: () => void }
  const toastTimer = uRfP(null);
  const tweaks = window.UPLOAD_TWEAKS || {};

  // Persist relevant slices on change.
  uEP(() => { persist(state); }, [state.wardrobe, state.favorites, state.outfits, state.genre]);

  // page → URL hash (pushState so browser Back works)
  uEP(() => {
    const target = `#/${state.page}`;
    if (window.location.hash !== target) {
      try { window.history.pushState({ page: state.page }, '', target); } catch {}
    }
  }, [state.page]);

  // URL hash → page (browser back/forward)
  uEP(() => {
    function syncFromHash() {
      const p = pageFromHash() || 'home';
      // Update only if it differs, avoiding a redundant pushState round-trip.
      if (p !== state.page) rawDispatch({ type: 'goto', page: p });
    }
    window.addEventListener('popstate', syncFromHash);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('popstate', syncFromHash);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, [state.page]);

  function showToast(msg, undo) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, undo });
    toastTimer.current = setTimeout(() => setToast(null), 6500);
  }

  // Dispatch wrapper — intercept destructive actions to offer Undo.
  const dispatch = uCP((action) => {
    if (action.type === 'remove') {
      const item = state.wardrobe.find(x => x.id === action.id);
      const index = state.wardrobe.findIndex(x => x.id === action.id);
      rawDispatch(action);
      if (item) {
        showToast(`Removed "${item.label}"`, () => {
          rawDispatch({ type: 'add_item_at', item, index });
          if (toastTimer.current) clearTimeout(toastTimer.current);
          setToast(null);
        });
      }
      return;
    }
    if (action.type === 'remove_outfit') {
      const outfit = state.outfits.find(x => x.id === action.id);
      const index = state.outfits.findIndex(x => x.id === action.id);
      rawDispatch(action);
      if (outfit) {
        showToast(`Deleted "${outfit.name}"`, () => {
          rawDispatch({ type: 'save_outfit_at', outfit, index });
          if (toastTimer.current) clearTimeout(toastTimer.current);
          setToast(null);
        });
      }
      return;
    }
    rawDispatch(action);
  }, [state.wardrobe, state.outfits]);

  const Page = {
    home: window.HomeScreen,
    upload: window.UploadScreen,
    wardrobe: window.WardrobeScreen,
    build: window.BuildScreen,
    outfits: window.OutfitsScreen,
    style: window.StyleThisScreen,
  }[state.page] || window.HomeScreen;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: window.COZY.cream,
      overflow: 'hidden',
    }}>
      <NavBarProd page={state.page} onGoto={(p) => dispatch({ type: 'goto', page: p })} compact={compact} />
      <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Page state={state} dispatch={dispatch} compact={compact} tweaks={tweaks} />
      </div>
      <UndoToast toast={toast} onDismiss={() => { if (toastTimer.current) clearTimeout(toastTimer.current); setToast(null); }} compact={compact} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProductionApp />);
