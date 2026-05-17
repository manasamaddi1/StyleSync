// Production app entry — API-backed version for Vercel deploy.
// Replaces the prototype's prod.jsx when copied into public/.
//
// On mount, hydrates wardrobe + outfits from the backend.
// Wraps dispatch to persist state-changing actions via window.SS_API.
// Falls back to seed data if the API isn't reachable (so the same file
// also works in the static design preview).

const { useReducer: uRP, useState: uSP, useEffect: uEP, useCallback: uCBP } = React;

function reducerProd(state, action) {
  switch (action.type) {
    case 'hydrate':       return { ...state, ...action.payload, ready: true };
    case 'goto':          return { ...state, page: action.page };
    case 'add_item':      return { ...state, wardrobe: [action.item, ...state.wardrobe] };
    case 'remove':        return { ...state, wardrobe: state.wardrobe.filter((x) => x.id !== action.id) };
    case 'fav':           return { ...state, favorites: state.favorites.includes(action.id) ? state.favorites.filter((x) => x !== action.id) : [...state.favorites, action.id] };
    case 'genre':         return { ...state, genre: action.genre };
    case 'select':        return { ...state, selectedItemId: action.id };
    case 'update_item':   return { ...state, wardrobe: state.wardrobe.map(x => x.id === action.item.id ? { ...x, ...action.item } : x) };
    case 'save_outfit':   return { ...state, outfits: [action.outfit, ...state.outfits].slice(0, 24) };
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

function useIsCompact(breakpoint = 720) {
  const [compact, setCompact] = uSP(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  uEP(() => {
    const onResize = () => setCompact(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return compact;
}

function LoadingSplash() {
  const C = window.COZY || { cream: '#F6EFE2', ink: '#2E2A24', muted: '#6F6557' };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: C.cream,
      display: 'grid', placeItems: 'center',
      fontFamily: '"Fraunces", Georgia, serif',
      fontStyle: 'italic', fontSize: 28, color: C.muted,
      letterSpacing: -0.3,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div>opening your closet…</div>
      </div>
    </div>
  );
}

function ProductionApp() {
  const compact = useIsCompact();
  const apiAvailable = typeof window !== 'undefined' && !!window.SS_API;

  const initialState = {
    page: 'home',
    wardrobe: apiAvailable ? [] : (window.SS_SEED_WARDROBE || []),
    favorites: ['t3', 'b3', 's2'],
    genre: 'casual',
    selectedItemId: null,
    outfits: apiAvailable ? [] : (window.SS_SEED_OUTFITS || []),
    loadInto: null,
    loadNonce: 0,
    ready: !apiAvailable, // if no API, we're ready immediately
  };

  const [state, dispatchRaw] = uRP(reducerProd, initialState);

  // Hydrate from API once on mount
  uEP(() => {
    if (!apiAvailable) return;
    let cancelled = false;
    (async () => {
      try {
        const [wardrobe, outfits] = await Promise.all([
          window.SS_API.getWardrobe(),
          window.SS_API.getOutfits(),
        ]);
        if (cancelled) return;
        dispatchRaw({
          type: 'hydrate',
          payload: {
            // If the user has nothing in their closet yet, fall back to
            // seed data so the demo doesn't look empty. Once they add
            // anything real, only their items will show.
            wardrobe: wardrobe.length > 0 ? wardrobe : (window.SS_SEED_WARDROBE || []),
            outfits:  outfits.length  > 0 ? outfits  : (window.SS_SEED_OUTFITS  || []),
          },
        });
      } catch (e) {
        console.error('[StyleSync] API hydrate failed:', e);
        // Fall back to seed data so the app still works
        dispatchRaw({
          type: 'hydrate',
          payload: {
            wardrobe: window.SS_SEED_WARDROBE || [],
            outfits:  window.SS_SEED_OUTFITS  || [],
          },
        });
      }
    })();
    return () => { cancelled = true; };
  }, [apiAvailable]);

  // Wrap dispatch — persist data-mutating actions to the API.
  // Optimistic: we update local state immediately, then fire-and-forget the API call.
  const dispatch = uCBP((action) => {
    dispatchRaw(action);
    if (!apiAvailable) return;
    try {
      switch (action.type) {
        case 'add_item':
          window.SS_API.addWardrobeItem(action.item).catch((e) =>
            console.error('[StyleSync] addWardrobeItem failed:', e));
          break;
        case 'remove':
          window.SS_API.deleteWardrobeItem(action.id).catch((e) =>
            console.error('[StyleSync] deleteWardrobeItem failed:', e));
          break;
        case 'update_item':
          window.SS_API.updateWardrobeItem(action.item.id, action.item).catch((e) =>
            console.error('[StyleSync] updateWardrobeItem failed:', e));
          break;
        case 'save_outfit':
          window.SS_API.addOutfit(action.outfit).catch((e) =>
            console.error('[StyleSync] addOutfit failed:', e));
          break;
        case 'remove_outfit':
          window.SS_API.deleteOutfit(action.id).catch((e) =>
            console.error('[StyleSync] deleteOutfit failed:', e));
          break;
        // 'goto', 'fav', 'genre', 'select', 'load_into_build', 'consumed_load'
        // are all transient UI state, no persistence needed
      }
    } catch (e) {
      console.error('[StyleSync] persistence error:', e);
    }
  }, [apiAvailable]);

  const tweaks = window.UPLOAD_TWEAKS || {};

  if (!state.ready) return <LoadingSplash />;

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
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProductionApp />);
