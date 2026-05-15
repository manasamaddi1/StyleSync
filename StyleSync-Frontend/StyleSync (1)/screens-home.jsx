// StyleSync — cozy/casual aesthetic
// Italic is reserved for screen H1s only. Radius scale: 12 / 20 / 999.

const { useState, useEffect, useRef } = React;

// ─────────── tokens ───────────
const COZY = {
  cream: '#F6EFE2',
  paper: '#FBF6EA',
  ink:   '#2E2A24',
  muted: '#6F6557',
  sage:  '#A7B79A',
  sageD: '#7C8E6E',
  terra: '#D08A6E',
  terraD:'#B26B53',
  butter:'#EBD9A7',
  rose:  '#E9C5BD',
  line:  '#E5DBC6',
  lineSoft: '#EFE6D0',
};

// Radii: r1 small chips, r2 cards, r3 pills/circles
const R = { r1: 12, r2: 20, r3: 999 };

const FONT_SERIF = '"Fraunces", Georgia, serif';
const FONT_SANS  = '"Space Grotesk", sans-serif';

function SoftButton({ children, onClick, variant = 'primary', size = 'md', style, disabled }) {
  const palette = {
    primary: { bg: COZY.ink,   fg: COZY.cream },
    sage:    { bg: COZY.sage,  fg: COZY.ink   },
    terra:   { bg: COZY.terra, fg: COZY.cream },
    cream:   { bg: COZY.paper, fg: COZY.ink, border: COZY.line },
    ghost:   { bg: 'transparent', fg: COZY.ink, border: COZY.line },
  }[variant];

  const sizing = size === 'sm'
    ? { padding: '8px 14px', fontSize: 13 }
    : size === 'lg'
    ? { padding: '14px 26px', fontSize: 15 }
    : { padding: '11px 20px', fontSize: 14 };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border || palette.bg}`,
        borderRadius: R.r3,
        fontFamily: FONT_SANS,
        fontWeight: 500,
        letterSpacing: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform .15s ease, opacity .15s ease',
        ...sizing,
        ...style,
      }}
    >{children}</button>
  );
}

function Pill({ children, active, onClick, color = COZY.sage }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? color : COZY.paper,
        color: COZY.ink,
        border: `1px solid ${active ? color : COZY.line}`,
        borderRadius: R.r3,
        padding: '8px 14px',
        fontFamily: FONT_SANS,
        fontWeight: 500,
        fontSize: 13,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >{children}</button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: COZY.paper,
      border: `1px solid ${COZY.line}`,
      borderRadius: R.r2,
      padding: 22,
      ...style,
    }}>{children}</div>
  );
}

// Tiny shared bits
function Eyebrow({ children, style }) {
  return (
    <div style={{
      fontFamily: FONT_SANS, fontSize: 11, letterSpacing: 1.4,
      color: COZY.muted, textTransform: 'uppercase', ...style,
    }}>{children}</div>
  );
}

function ScreenH1({ children, compact, style }) {
  return (
    <h1 style={{
      fontFamily: FONT_SERIF,
      fontWeight: 400,
      fontStyle: 'italic',
      fontSize: compact ? 36 : 54,
      lineHeight: 1.0,
      margin: 0,
      color: COZY.ink,
      letterSpacing: -0.6,
      textWrap: 'balance',
      ...style,
    }}>{children}</h1>
  );
}

// ─────────── HOME ───────────
function HomeScreen({ state, dispatch, compact }) {
  const wardrobe = state.wardrobe;
  const counts = ['top', 'bottom', 'shoes', 'outerwear'].map((c) => ({
    cat: c, n: wardrobe.filter((x) => x.cat === c).length,
  }));
  const total = wardrobe.length;

  return (
    <div style={{
      padding: compact ? '20px 18px 28px' : '40px 48px 56px',
      display: 'grid',
      gap: compact ? 22 : 32,
      background: COZY.cream,
      minHeight: '100%',
    }}>
      {/* Hero */}
      <div style={{
        position: 'relative',
        background: COZY.paper,
        border: `1px solid ${COZY.line}`,
        borderRadius: R.r2,
        padding: compact ? '24px 22px 28px' : '52px 48px 44px',
        overflow: 'hidden',
        display: compact ? 'block' : 'grid',
        gridTemplateColumns: compact ? undefined : 'minmax(0, 1.2fr) minmax(280px, 1fr)',
        gap: compact ? 0 : 36,
        alignItems: 'center',
      }}>
        {/* warm sun blob — single moment of decoration */}
        <div style={{
          position: 'absolute',
          top: compact ? -40 : -80,
          right: compact ? -40 : -120,
          width: compact ? 180 : 280,
          height: compact ? 180 : 280,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${COZY.butter}, ${COZY.terra} 70%)`,
          opacity: compact ? 0.5 : 0.32,
          filter: 'blur(2px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <Eyebrow style={{ marginBottom: 14 }}>Your wardrobe, softer</Eyebrow>

          <ScreenH1 compact={compact} style={{ fontSize: compact ? 44 : 68 }}>
            What should I wear today?
          </ScreenH1>

          <p style={{
            marginTop: compact ? 16 : 22,
            fontFamily: FONT_SANS,
            fontSize: compact ? 14 : 16,
            maxWidth: compact ? '100%' : 460,
            color: COZY.muted,
            lineHeight: 1.55,
          }}>
            Add the pieces you already own. We tag them and put together looks for whatever your day calls for.
          </p>

          <div style={{ marginTop: compact ? 20 : 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <SoftButton variant="primary" size={compact ? 'md' : 'lg'} onClick={() => dispatch({ type: 'goto', page: 'upload' })}>
              Add a piece
            </SoftButton>
            <SoftButton variant="cream" size={compact ? 'md' : 'lg'} onClick={() => dispatch({ type: 'goto', page: 'outfits' })}>
              Build a look
            </SoftButton>
          </div>
        </div>

        {/* Right side: today's outfit preview card — desktop only */}
        {!compact && (
          <div style={{
            position: 'relative',
            background: COZY.cream,
            border: `1px solid ${COZY.line}`,
            borderRadius: R.r2,
            padding: 22,
          }}>
            <Eyebrow style={{ marginBottom: 12 }}>Today · 64° · sunny</Eyebrow>

            <div style={{
              fontFamily: FONT_SERIF, fontWeight: 400,
              fontSize: 22, lineHeight: 1.2, color: COZY.ink, marginBottom: 16,
            }}>A soft layered look, easy to walk in.</div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16,
            }}>
              {wardrobe.slice(0, 3).map((it) => (
                <GarmentTile key={it.id} item={it} />
              ))}
            </div>

            <button
              onClick={() => dispatch({ type: 'goto', page: 'outfits' })}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: COZY.terraD, fontFamily: FONT_SANS, fontSize: 13,
                fontWeight: 500, padding: 0,
              }}
            >Try it on →</button>
          </div>
        )}
      </div>

      {/* Closet snapshot */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 16, gap: 12,
        }}>
          <h2 style={{
            fontFamily: FONT_SERIF, fontWeight: 400,
            fontSize: compact ? 22 : 26, margin: 0, color: COZY.ink,
          }}>Your closet</h2>
          <button
            onClick={() => dispatch({ type: 'goto', page: 'wardrobe' })}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: COZY.muted, fontFamily: FONT_SANS, fontSize: 13,
              padding: 0,
            }}
          >See all {total} →</button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {counts.map((c) => (
            <Card key={c.cat} style={{ padding: compact ? 16 : 20 }}>
              <Eyebrow>{c.cat}</Eyebrow>
              <div style={{
                fontFamily: FONT_SERIF,
                fontSize: compact ? 36 : 44,
                color: COZY.ink, lineHeight: 1.1, marginTop: 6,
              }}>{c.n}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Today's pick */}
      <Card style={{ padding: compact ? 20 : 28 }}>
        <Eyebrow>Picked for today · 64° · sunny</Eyebrow>
        <h3 style={{
          fontFamily: FONT_SERIF, fontWeight: 400,
          fontSize: compact ? 22 : 28,
          margin: '8px 0 8px', color: COZY.ink,
          letterSpacing: -0.2,
        }}>
          A soft layered look, easy to walk in
        </h3>
        <p style={{
          fontFamily: FONT_SANS, fontSize: 14, color: COZY.muted,
          margin: '0 0 20px', lineHeight: 1.55,
        }}>Knit polo, wide denim, loafers. Bring the blazer in case the café is cold.</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
          gap: 10,
        }}>
          {wardrobe.slice(0, compact ? 3 : 4).map((it) => (
            <GarmentTile key={it.id} item={it} />
          ))}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <SoftButton variant="primary" size="sm" onClick={() => dispatch({ type: 'goto', page: 'outfits' })}>
            Try it on
          </SoftButton>
          <SoftButton variant="ghost" size="sm">Show me another</SoftButton>
        </div>
      </Card>

      {/* How it works */}
      <div>
        <h2 style={{
          fontFamily: FONT_SERIF, fontWeight: 400,
          fontSize: compact ? 22 : 26, margin: '0 0 16px', color: COZY.ink,
        }}>How it works</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : 'repeat(4, 1fr)',
          gap: 12,
        }}>
          {[
            ['01', 'Snap', 'Drop in a pic of any piece you own.'],
            ['02', 'Tag',  'We guess category, color, and vibe.'],
            ['03', 'Style', 'Pick a feeling — we put together looks.'],
            ['04', 'Remix', 'Style any single piece three ways.'],
          ].map(([n, t, d]) => (
            <Card key={n} style={{ padding: 20 }}>
              <div style={{
                fontFamily: FONT_SERIF, color: COZY.muted,
                fontSize: 13, lineHeight: 1, marginBottom: 12,
                letterSpacing: 1,
              }}>{n}</div>
              <div style={{
                fontFamily: FONT_SANS, fontWeight: 500,
                fontSize: 16, color: COZY.ink, marginBottom: 6,
              }}>{t}</div>
              <div style={{
                fontFamily: FONT_SANS, fontSize: 13,
                color: COZY.muted, lineHeight: 1.5,
              }}>{d}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.SoftButton = SoftButton;
window.Pill = Pill;
window.Card = Card;
window.Eyebrow = Eyebrow;
window.ScreenH1 = ScreenH1;
window.COZY = COZY;
window.SS_R = R;
window.SS_FONT_SERIF = FONT_SERIF;
window.SS_FONT_SANS = FONT_SANS;
