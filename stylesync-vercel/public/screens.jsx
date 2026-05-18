// Cozy stub screens — Closet with edit modal

const { useState: uSC } = React;

function CozyPlaceholder({ title, sub, dispatch }) {
  const C = window.COZY;
  return (
    <div style={{ padding: 28, display: 'grid', gap: 18, background: C.cream, minHeight: '100%' }}>
      <div>
        <window.Eyebrow style={{ marginBottom: 6 }}>{title}</window.Eyebrow>
        <window.ScreenH1>{sub}</window.ScreenH1>
      </div>
      <div style={{
        background: C.paper, border: `1px solid ${C.line}`,
        borderRadius: 20, padding: 28,
        display: 'grid', gap: 14,
      }}>
        <p style={{ margin: 0, color: C.muted, fontSize: 14, lineHeight: 1.6 }}>Designing this next.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <window.SoftButton variant="primary" onClick={() => dispatch({ type: 'goto', page: 'home' })}>← Back home</window.SoftButton>
        </div>
      </div>
    </div>
  );
}

function WardrobeScreen({ state, dispatch, compact }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FN = window.SS_FONT_SANS;
  const SW = window.SS_SWATCH;
  const [editingId, setEditingId] = uSC(null);
  const [groupBy, setGroupBy] = uSC('all');
  const [sortBy, setSortBy] = uSC('newest');
  const [query, setQuery] = uSC('');
  const editing = editingId ? state.wardrobe.find(x => x.id === editingId) : null;

  // Perceptual color order — lights → warms → cools → darks. Unknowns last.
  const COLOR_ORDER = ['white','cream','beige','tan','yellow','orange','red','pink','purple','blue','green','gray','brown','black'];

  // Search filter — matches name, color, category, fabric, or any vibe tag.
  const q = query.trim().toLowerCase();
  const matchedRaw = q
    ? state.wardrobe.filter(it =>
        (it.label  || '').toLowerCase().includes(q) ||
        (it.color  || '').toLowerCase().includes(q) ||
        (it.cat    || '').toLowerCase().includes(q) ||
        (it.fabric || '').toLowerCase().includes(q) ||
        (it.tags || []).some(t => String(t).toLowerCase().includes(q))
      )
    : state.wardrobe;

  // Sort — applied before grouping so the order is consistent within each section.
  const matchedWardrobe = (() => {
    const arr = [...matchedRaw];
    if (sortBy === 'a-z') {
      arr.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    } else if (sortBy === 'color') {
      arr.sort((a, b) => {
        const ai = COLOR_ORDER.indexOf(a.color); const bi = COLOR_ORDER.indexOf(b.color);
        const ao = ai < 0 ? 999 : ai; const bo = bi < 0 ? 999 : bi;
        return ao - bo || (a.label || '').localeCompare(b.label || '');
      });
    }
    // 'newest' = natural array order (add_item prepends, so newest is already first)
    return arr;
  })();

  const groupOptions = [
    { k: 'all',      label: 'All'      },
    { k: 'category', label: 'Category' },
    { k: 'color',    label: 'Color'    },
    { k: 'fabric',   label: 'Fabric'   },
    { k: 'vibe',     label: 'Vibe'     },
  ];

  // Build groups: ordered Map of label -> items
  const groups = (() => {
    const map = new Map();
    const push = (key, item) => {
      const k = key || 'unspecified';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(item);
    };
    matchedWardrobe.forEach(it => {
      if (groupBy === 'all')           push(q ? 'Matches' : 'Everything', it);
      else if (groupBy === 'category') push(it.cat, it);
      else if (groupBy === 'color')    push(it.color, it);
      else if (groupBy === 'fabric')   push(it.fabric, it);
      else if (groupBy === 'vibe')     (it.tags && it.tags.length ? it.tags : ['unspecified']).forEach(t => push(t, it));
    });
    // Stable order: by group size desc, then alpha
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  })();

  return (
    <div style={{ padding: compact ? '20px 18px 32px' : '36px 44px 56px', background: C.cream, minHeight: '100%', display: 'grid', gap: compact ? 18 : 26 }}>
      <div>
        <window.Eyebrow style={{ marginBottom: 10 }}>Your closet</window.Eyebrow>
        <window.ScreenH1 compact={compact}>
          {state.wardrobe.length} pieces, gently tagged.
        </window.ScreenH1>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: compact ? '100%' : 420 }}>
        <span aria-hidden style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: C.muted, fontSize: 14, lineHeight: 1, pointerEvents: 'none',
        }}>⌕</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, color, vibe…"
          aria-label="Search closet"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.paper, border: `1px solid ${C.line}`,
            borderRadius: R.r3,
            padding: '10px 36px 10px 34px',
            fontFamily: FN, fontSize: 14, color: C.ink,
            outline: 'none',
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            aria-label="Clear search"
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: C.muted, fontSize: 18, lineHeight: 1, padding: 6,
            }}>×</button>
        )}
      </div>

      {/* Group-by + Sort */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', rowGap: 10 }}>
        <span style={{ fontFamily: FN, fontSize: 12, color: C.muted }}>Group by</span>
        {groupOptions.map(g => (
          <button key={g.k}
            onClick={() => setGroupBy(g.k)}
            style={{
              background: groupBy === g.k ? C.ink : C.paper,
              color: groupBy === g.k ? C.paper : C.ink,
              border: `1px solid ${groupBy === g.k ? C.ink : C.line}`,
              borderRadius: R.r3, cursor: 'pointer',
              padding: '7px 13px',
              fontFamily: FN, fontSize: 12.5, fontWeight: 500,
            }}>{g.label}</button>
        ))}
        <span aria-hidden style={{ width: 1, height: 18, background: C.line, margin: '0 4px' }} />
        <span style={{ fontFamily: FN, fontSize: 12, color: C.muted }}>Sort</span>
        {[
          { k: 'newest', label: 'Newest'  },
          { k: 'a-z',    label: 'A–Z'    },
          { k: 'color',  label: 'By color'},
        ].map(s => (
          <button key={s.k}
            onClick={() => setSortBy(s.k)}
            style={{
              background: sortBy === s.k ? C.ink : C.paper,
              color: sortBy === s.k ? C.paper : C.ink,
              border: `1px solid ${sortBy === s.k ? C.ink : C.line}`,
              borderRadius: R.r3, cursor: 'pointer',
              padding: '7px 13px',
              fontFamily: FN, fontSize: 12.5, fontWeight: 500,
            }}>{s.label}</button>
        ))}
      </div>

      {/* Groups */}
      <div style={{ display: 'grid', gap: compact ? 22 : 28 }}>
        {groups.length === 0 && (
          <div style={{
            background: C.paper, border: `1px dashed ${C.line}`,
            borderRadius: R.r2, padding: compact ? 24 : 36,
            textAlign: 'center', display: 'grid', gap: 8,
          }}>
            <div style={{
              fontFamily: window.SS_FONT_SERIF, fontStyle: 'italic',
              fontSize: compact ? 20 : 24, color: C.ink,
            }}>Nothing matches “{query}”.</div>
            <div style={{ fontFamily: FN, fontSize: 13, color: C.muted }}>
              Try a color, a category, or a vibe.
            </div>
            <div style={{ marginTop: 6 }}>
              <window.SoftButton variant="ghost" size="sm" onClick={() => setQuery('')}>Clear search</window.SoftButton>
            </div>
          </div>
        )}
        {groups.map(([groupKey, items]) => (
          <div key={groupKey}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
            }}>
              {groupBy === 'color' && groupKey !== 'unspecified' && SW[groupKey] && (
                <span style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: SW[groupKey], border: `1px solid ${C.line}`,
                }}/>
              )}
              <h2 style={{
                fontFamily: window.SS_FONT_SERIF, fontWeight: 400,
                fontSize: compact ? 19 : 22, margin: 0, color: C.ink,
                textTransform: 'capitalize', letterSpacing: -0.2,
              }}>{groupKey.replace(/_/g, ' ')}</h2>
              <span style={{ fontFamily: FN, fontSize: 12, color: C.muted }}>{items.length}</span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: compact ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
              gap: 12,
            }}>
              {items.map((it) => (
                <window.GarmentTile
                  key={it.id + '-' + groupKey} item={it}
                  favorite={state.favorites.includes(it.id)}
                  onClick={() => setEditingId(it.id)}
                  onToggleFav={(x) => dispatch({ type: 'fav', id: x.id })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditItemModal
          item={editing}
          favorited={state.favorites.includes(editing.id)}
          onFav={() => dispatch({ type: 'fav', id: editing.id })}
          onRemove={() => { dispatch({ type: 'remove', id: editing.id }); setEditingId(null); }}
          onSave={(patch) => { dispatch({ type: 'update_item', item: { ...patch, id: editing.id } }); setEditingId(null); }}
          onClose={() => setEditingId(null)}
          compact={compact}
        />
      )}
    </div>
  );
}

function EditItemModal({ item, favorited, onFav, onRemove, onSave, onClose, compact }) {
  const C = window.COZY;
  const R = window.SS_R;
  const FS = window.SS_FONT_SERIF, FN = window.SS_FONT_SANS;
  const SW = window.SS_SWATCH;
  const [name, setName] = uSC(item.label);
  const [cat, setCat] = uSC(item.cat);
  const [color, setColor] = uSC(item.color);
  const [fabric, setFabric] = uSC(item.fabric || '');
  const [vibe, setVibe] = uSC((item.tags || []).join(', '));

  function save() {
    onSave({
      label: name,
      cat,
      color,
      swatch: SW[color] || item.swatch,
      fabric,
      tags: vibe.split(',').map(v => v.trim()).filter(Boolean),
    });
  }

  const fields = [
    ['Category', 'category', cat, ['top','bottom','shoes','outerwear','dress'], setCat],
    ['Color',    'color',    color, Object.keys(SW || {}), setColor],
    ['Fabric',   'fabric',   fabric, ['cotton','linen','wool','silk','denim','knit','synthetic'], setFabric],
    ['Vibe',     'vibe',     vibe, (window.SS_GENRES || []).map(g => g.key.replace('_',' ')), setVibe],
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(46, 42, 36, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'grid', placeItems: 'center',
        zIndex: 50, padding: 16,
        animation: 'fadeIn .15s ease',
      }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.paper, borderRadius: R.r2,
          padding: compact ? 20 : 28, width: '100%', maxWidth: 460,
          maxHeight: '85vh', overflow: 'auto',
          boxShadow: '0 20px 60px rgba(46, 42, 36, 0.3)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <window.Eyebrow>Edit piece</window.Eyebrow>
          <button onClick={onClose} aria-label="Close" style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: C.muted, fontSize: 20, lineHeight: 1, padding: 0,
          }}>×</button>
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
          <div style={{ flex: 'none', width: 96 }}>
            <window.GarmentTile item={item} size="sm"/>
          </div>
          <div style={{ flex: 1 }}>
            <window.Eyebrow style={{ marginBottom: 6 }}>Name</window.Eyebrow>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                fontFamily: FN, fontSize: 16, fontWeight: 500, color: C.ink,
                background: C.cream, border: `1px solid ${C.line}`,
                borderRadius: R.r1, padding: '8px 12px', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Fields */}
        {fields.map(([label, key, value, options, setter]) => (
          <div key={key} style={{
            display: 'grid', gridTemplateColumns: '90px 1fr auto',
            alignItems: 'center', gap: 10, padding: '11px 0',
            borderTop: `1px solid ${C.lineSoft}`,
          }}>
            <span style={{ fontFamily: FN, fontSize: 11, color: C.muted }}>{label}</span>
            {key === 'vibe' ? (
              <input
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={options.slice(0, 3).join(', ')}
                style={{
                  fontFamily: FN, fontSize: 14, fontWeight: 500, color: C.ink,
                  background: C.cream, border: `1px solid ${C.line}`,
                  borderRadius: R.r1, padding: '6px 10px', outline: 'none',
                  width: '100%', boxSizing: 'border-box',
                }}
              />
            ) : (
              <select
                value={value || ''}
                onChange={(e) => setter(e.target.value)}
                style={{
                  fontFamily: FN, fontSize: 14, fontWeight: 500, color: C.ink,
                  background: C.cream, border: `1px solid ${C.line}`,
                  borderRadius: R.r1, padding: '6px 10px', outline: 'none',
                  width: '100%', cursor: 'pointer',
                }}>
                <option value="">—</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            <span>
              {key === 'color' && color && (
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: SW[color] || item.swatch, border: `1px solid ${C.line}`, display: 'inline-block' }}/>
              )}
            </span>
          </div>
        ))}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <window.SoftButton variant="primary" onClick={save}>Save changes</window.SoftButton>
            <window.SoftButton variant="cream" onClick={onFav}>{favorited ? '♥ Saved' : '♡ Save'}</window.SoftButton>
          </div>
          <button
            onClick={onRemove}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#B85547', fontFamily: FN, fontSize: 13, fontWeight: 500,
              padding: '8px 4px',
            }}>Remove from closet</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WardrobeScreen, CozyPlaceholder });
