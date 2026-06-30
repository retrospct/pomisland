// PROTOTYPE — notch-native progress treatments · MO-23
// Question (UI branch): What should timerStyle look like drawn AROUND the pill/notch?
// Sub-shape B: throwaway page at /prototype.html — delete when question is answered.
//
// Variants:
//   A — Perimeter Trace    SVG stroke traces pill outline clockwise
//   B — Bilateral Arms     Two symmetric glowing arcs fill simultaneously down each flank
//   C — Ambient Halo       Pure CSS glow — no stroke, progress modulates intensity
//   D — Skyline Arc        A glowing arc sits below the pill, fills left-to-right
//   S — Settings Picker    Three picker UI patterns for 5+ timerStyle options
//
// Run: pnpm dev → http://localhost:5173/prototype.html?variant=A

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

// ─── Pill geometry ────────────────────────────────────────────────────────────

const PILL_W = 210
const PILL_H = 44
const PILL_BR = 20 // bottom corner radius; top = 0 (flush with macOS notch)

// SVG path that traces the pill outline, used for stroke-dasharray progress.
// Coordinates in pill space (0,0 = top-left). Clockwise: top → right → bottom → left.
//   top edge    : 210 px
//   right side  : 24 px  (44 − 20)
//   BR arc      : (π/2)·20 ≈ 31.42 px
//   bottom edge : 170 px  (210 − 2·20)
//   BL arc      : 31.42 px
//   left side   : 24 px
//   total       ≈ 490.84 px
const PILL_PATH =
  'M 0 0 L 210 0 L 210 24 A 20 20 0 0 1 190 44 L 20 44 A 20 20 0 0 1 0 24 Z'
const PERIMETER = 210 + 24 + (Math.PI / 2) * 20 + 170 + (Math.PI / 2) * 20 + 24

// Half-path for Variant B: from one top corner down to bottom-centre.
// Right half (top-right → bottom-centre):
const RIGHT_HALF = 'M 210 0 L 210 24 A 20 20 0 0 1 190 44 L 105 44'
// Left half (top-left → bottom-centre, bottom-left arc sweeps CCW = flag 0):
const LEFT_HALF = 'M 0 0 L 0 24 A 20 20 0 0 0 20 44 L 105 44'
const HALF_PERIM = 24 + (Math.PI / 2) * 20 + 85 // side + arc + half-bottom ≈ 140.4

// ─── Colors ───────────────────────────────────────────────────────────────────

const ACCENT = '#2dd4bf'
const ACCENT_BRIGHT = '#5eead4'
const ACCENT_DIM = 'rgba(45,212,191,0.18)'
const PILL_BG = '#17191D'
const TEXT = '#F2F1EC'
const TEXT_MUTED = 'rgba(242,241,236,0.4)'
const TRACK = 'rgba(242,241,236,0.12)'
const MONO = "'IBM Plex Mono', monospace"

// ─── Fake countdown ───────────────────────────────────────────────────────────

const DEMO_SECS = 90 // full cycle in seconds (loop)

function useFakeClock() {
  const [frac, setFrac] = useState(0)
  const [running, setRunning] = useState(true)
  const rafRef = useRef<number>(0)
  const lastRef = useRef<number>(Date.now())
  const fracRef = useRef(0)

  useEffect(() => {
    function tick() {
      const now = Date.now()
      if (running) {
        fracRef.current = (fracRef.current + (now - lastRef.current) / 1000 / DEMO_SECS) % 1
        setFrac(fracRef.current)
      }
      lastRef.current = now
      rafRef.current = requestAnimationFrame(tick)
    }
    lastRef.current = Date.now()
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [running])

  const remaining = Math.round((1 - frac) * 25 * 60) // shows as 25-min session
  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const seek = (f: number) => {
    fracRef.current = Math.max(0, Math.min(1, f))
    setFrac(fracRef.current)
  }

  return {
    frac,
    timeStr,
    running,
    toggle: () => setRunning((r) => !r),
    seek,
  }
}

// ─── Shared pill shell ────────────────────────────────────────────────────────

function CameraFacet() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '42%',
        transform: 'translate(-50%, -50%)',
        width: 11,
        height: 11,
        borderRadius: '50%',
        background: '#000',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    />
  )
}

function PillContent({ timeStr, frac }: { timeStr: string; frac: number }) {
  return (
    <>
      <CameraFacet />
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.16em',
          color: ACCENT,
          fontWeight: 500,
          position: 'relative',
          zIndex: 3,
        }}
      >
        FOCUS
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 15,
          fontWeight: 500,
          letterSpacing: '0.01em',
          fontVariantNumeric: 'tabular-nums',
          position: 'relative',
          zIndex: 3,
        }}
      >
        {timeStr}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          color: TEXT_MUTED,
          position: 'relative',
          zIndex: 3,
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {Math.round(frac * 100)}%
      </span>
    </>
  )
}

function Pill({ style, children }: { style?: CSSProperties; children?: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width: PILL_W,
        height: PILL_H,
        background: PILL_BG,
        borderRadius: `0 0 ${PILL_BR}px ${PILL_BR}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '13px 14px 9px 14px',
        color: TEXT,
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Variant A — Perimeter Trace ──────────────────────────────────────────────
// SVG stroke clockwise along the pill outline; fills from top-left.

function VariantA({ frac, timeStr }: { frac: number; timeStr: string }) {
  const offset = PERIMETER * (1 - frac)
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Pill>
        {/* SVG overlaid exactly on pill */}
        <svg
          width={PILL_W}
          height={PILL_H}
          viewBox={`0 0 ${PILL_W} ${PILL_H}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 4,
            overflow: 'visible',
          }}
        >
          {/* Dim track */}
          <path d={PILL_PATH} fill="none" stroke={TRACK} strokeWidth={2} />
          {/* Accent progress, fills clockwise from top-left */}
          <path
            d={PILL_PATH}
            fill="none"
            stroke={ACCENT}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={`${PERIMETER}`}
            strokeDashoffset={`${offset}`}
            style={{ transition: 'stroke-dashoffset 0.35s linear' }}
          />
        </svg>
        <PillContent timeStr={timeStr} frac={frac} />
      </Pill>
      <VariantLabel>Perimeter Trace</VariantLabel>
      <VariantNote>Clockwise SVG stroke on pill outline · no inner Ring needed</VariantNote>
    </div>
  )
}

// ─── Variant B — Bilateral Arms ───────────────────────────────────────────────
// Two symmetric glowing strokes descend down each flank simultaneously,
// meeting at the bottom centre on completion.

function VariantB({ frac, timeStr }: { frac: number; timeStr: string }) {
  const offset = HALF_PERIM * (1 - frac)
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Pill>
        <svg
          width={PILL_W}
          height={PILL_H}
          viewBox={`0 0 ${PILL_W} ${PILL_H}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 4,
            overflow: 'visible',
          }}
        >
          <defs>
            <filter id="glow-b" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Tracks */}
          <path d={RIGHT_HALF} fill="none" stroke={TRACK} strokeWidth={2} />
          <path d={LEFT_HALF} fill="none" stroke={TRACK} strokeWidth={2} />
          {/* Progress arms — glow filter for cinematic feel */}
          <path
            d={RIGHT_HALF}
            fill="none"
            stroke={ACCENT}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={`${HALF_PERIM}`}
            strokeDashoffset={`${offset}`}
            filter="url(#glow-b)"
            style={{ transition: 'stroke-dashoffset 0.35s linear' }}
          />
          <path
            d={LEFT_HALF}
            fill="none"
            stroke={ACCENT}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={`${HALF_PERIM}`}
            strokeDashoffset={`${offset}`}
            filter="url(#glow-b)"
            style={{ transition: 'stroke-dashoffset 0.35s linear' }}
          />
        </svg>
        <PillContent timeStr={timeStr} frac={frac} />
      </Pill>
      <VariantLabel>Bilateral Arms</VariantLabel>
      <VariantNote>Two flanks fill simultaneously, glowing, meeting at bottom-centre</VariantNote>
    </div>
  )
}

// ─── Variant C — Ambient Halo ─────────────────────────────────────────────────
// Pure CSS. No stroke. box-shadow glow intensifies as progress builds.
// Dim through the first half; crescendos in the final quarter.

function VariantC({ frac, timeStr }: { frac: number; timeStr: string }) {
  const e = Math.pow(frac, 0.65)
  const spread = 2 + e * 14
  const blur = 6 + e * 20
  const alpha = (0.12 + e * 0.7).toFixed(2)
  const innerAlpha = (e * 0.3).toFixed(2)

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Pill
        style={{
          boxShadow: [
            `0 0 ${Math.round(blur)}px ${Math.round(spread)}px rgba(45,212,191,${alpha})`,
            `inset 0 0 0 1px rgba(45,212,191,${innerAlpha})`,
          ].join(', '),
          transition: 'box-shadow 0.5s ease-out',
        }}
      >
        <PillContent timeStr={timeStr} frac={frac} />
      </Pill>
      <VariantLabel>Ambient Halo</VariantLabel>
      <VariantNote>CSS glow only — no paths, no ring, purely atmospheric</VariantNote>
    </div>
  )
}

// ─── Variant D — Skyline Arc ──────────────────────────────────────────────────
// A soft glowing arc sits just below the pill, fills left-to-right like
// a sunrise line. Separate SVG below the pill; no overlap with pill content.

const ARC_H = 20 // SVG height below pill
const ARC_RY = 6 // vertical sag of the arc (quadratic bezier control offset)

function VariantD({ frac, timeStr }: { frac: number; timeStr: string }) {
  const GAP = 4 // gap between pill bottom and arc SVG
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: ARC_H + GAP,
      }}
    >
      <Pill>
        <PillContent timeStr={timeStr} frac={frac} />
      </Pill>
      <svg
        width={PILL_W}
        height={ARC_H}
        viewBox={`0 0 ${PILL_W} ${ARC_H}`}
        style={{
          position: 'absolute',
          top: PILL_H + GAP,
          left: 0,
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          <filter id="glow-d" x="-20%" y="-100%" width="140%" height="400%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track arc */}
        <path
          d={`M 0 0 Q ${PILL_W / 2} ${ARC_RY} ${PILL_W} 0`}
          fill="none"
          stroke={TRACK}
          strokeWidth={2}
        />
        {/* Progress arc — clipped left-to-right via rect clipPath */}
        <defs>
          <clipPath id="arc-d-clip">
            <rect x="0" y="-10" width={`${frac * PILL_W}`} height={ARC_H + 20} />
          </clipPath>
        </defs>
        <path
          d={`M 0 0 Q ${PILL_W / 2} ${ARC_RY} ${PILL_W} 0`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={2.5}
          strokeLinecap="round"
          filter="url(#glow-d)"
          clipPath="url(#arc-d-clip)"
          style={{ transition: 'none' }}
        />
      </svg>
      <VariantLabel>Skyline Arc</VariantLabel>
      <VariantNote>Glowing arc below pill · fills left-to-right · zero pill overlap</VariantNote>
    </div>
  )
}

// ─── Variant S — Settings Picker Sketch ───────────────────────────────────────
// Three alternative picker UIs for selecting timerStyle with 5+ options.
// Current design uses 3 icon cards in a row — these sketch richer alternatives.

const MOCK_OPTIONS = [
  { key: 'trace', label: 'Trace', desc: 'Outline trace' },
  { key: 'bilateral', label: 'Bilateral', desc: 'Twin arms' },
  { key: 'halo', label: 'Halo', desc: 'Ambient glow' },
  { key: 'arc', label: 'Arc', desc: 'Skyline arc' },
  { key: 'bar', label: 'Bar', desc: 'Progress bar' },
] as const
type MockKey = (typeof MOCK_OPTIONS)[number]['key']

function SettingsPickerSketch() {
  const [selected1, setSelected1] = useState<MockKey>('trace')
  const [selected2, setSelected2] = useState<MockKey>('bilateral')
  const [selected3, setSelected3] = useState<MockKey>('halo')

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        maxWidth: 440,
        width: '100%',
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.12em',
          color: ACCENT,
          textTransform: 'uppercase' as const,
        }}
      >
        Settings Picker — 5 options
      </div>

      {/* Pattern 1: Scrollable card row (current pattern, extended) */}
      <div>
        <PickerSectionLabel>S1 — Scrollable icon cards (current × 3 → extend to N)</PickerSectionLabel>
        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto' as const,
            paddingBottom: 4,
            scrollbarWidth: 'none' as const,
          }}
        >
          {MOCK_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSelected1(o.key)}
              style={{
                flexShrink: 0,
                width: 72,
                padding: '10px 6px',
                borderRadius: 10,
                border: `1.5px solid ${selected1 === o.key ? ACCENT : 'rgba(242,241,236,0.12)'}`,
                background:
                  selected1 === o.key ? 'rgba(45,212,191,0.1)' : 'rgba(242,241,236,0.04)',
                color: selected1 === o.key ? ACCENT_BRIGHT : TEXT_MUTED,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <MiniPillIcon which={o.key} active={selected1 === o.key} />
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.06em' }}>
                {o.label}
              </span>
            </button>
          ))}
        </div>
        <PickerNote>Current approach — works, but 5 cards overflow on narrow settings width</PickerNote>
      </div>

      {/* Pattern 2: 2×3 compact mini-grid */}
      <div>
        <PickerSectionLabel>S2 — Compact 2-column grid</PickerSectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {MOCK_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSelected2(o.key)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: `1.5px solid ${selected2 === o.key ? ACCENT : 'rgba(242,241,236,0.1)'}`,
                background:
                  selected2 === o.key ? 'rgba(45,212,191,0.1)' : 'rgba(242,241,236,0.03)',
                color: selected2 === o.key ? ACCENT_BRIGHT : TEXT,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textAlign: 'left' as const,
                transition: 'all 0.15s',
              }}
            >
              <MiniPillIcon which={o.key} active={selected2 === o.key} />
              <div>
                <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 500 }}>{o.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 8, color: TEXT_MUTED, marginTop: 1 }}>
                  {o.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
        <PickerNote>Grid adapts to any N options · label + micro-desc · tighter vertical spend</PickerNote>
      </div>

      {/* Pattern 3: Segmented chip strip */}
      <div>
        <PickerSectionLabel>S3 — Chip strip (segmented control, extended)</PickerSectionLabel>
        <div
          style={{
            display: 'flex',
            background: 'rgba(242,241,236,0.06)',
            borderRadius: 8,
            padding: 3,
            gap: 2,
            overflowX: 'auto' as const,
            scrollbarWidth: 'none' as const,
          }}
        >
          {MOCK_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setSelected3(o.key)}
              style={{
                flexShrink: 0,
                padding: '5px 10px',
                borderRadius: 6,
                border: 'none',
                background: selected3 === o.key ? PILL_BG : 'transparent',
                color: selected3 === o.key ? ACCENT_BRIGHT : TEXT_MUTED,
                cursor: 'pointer',
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.05em',
                fontWeight: selected3 === o.key ? 500 : 400,
                boxShadow: selected3 === o.key ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap' as const,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <PickerNote>
          Matches existing Tick sound / Theme pattern · extends the 3-button segmented control ·
          text-only chips scroll cleanly
        </PickerNote>
      </div>
    </div>
  )
}

// Small pill-icon thumbnails for the settings picker mock
function MiniPillIcon({ which, active }: { which: MockKey; active: boolean }) {
  const c = active ? ACCENT : TEXT_MUTED
  const dim = active ? ACCENT_DIM : 'rgba(242,241,236,0.06)'
  const w = 28
  const h = 12

  if (which === 'trace') {
    return (
      <svg width={w} height={h} viewBox="0 0 28 12" fill="none">
        <rect x="1" y="1" width="26" height="10" rx="4" stroke={dim} strokeWidth="1.5" />
        <path
          d="M 1 1 L 27 1 L 27 7 A 4 4 0 0 1 23 11 L 5 11 A 4 4 0 0 1 1 7 Z"
          stroke={c}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="22"
        />
      </svg>
    )
  }
  if (which === 'bilateral') {
    return (
      <svg width={w} height={h} viewBox="0 0 28 12" fill="none">
        <rect x="1" y="1" width="26" height="10" rx="4" fill={dim} />
        <path d="M 1 1 L 1 8 A 4 4 0 0 0 5 12 L 14 12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 27 1 L 27 8 A 4 4 0 0 1 23 12 L 14 12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  if (which === 'halo') {
    return (
      <svg width={w} height={h} viewBox="0 0 28 12" fill="none">
        <rect
          x="1"
          y="1"
          width="26"
          height="10"
          rx="4"
          fill={dim}
          stroke={c}
          strokeWidth="1.5"
          strokeOpacity={active ? 0.8 : 0.3}
          filter="url(#halo-mini)"
        />
        <defs>
          <filter id="halo-mini">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>
      </svg>
    )
  }
  if (which === 'arc') {
    return (
      <svg width={w} height={h} viewBox="0 0 28 12" fill="none">
        <rect x="1" y="1" width="26" height="9" rx="4" fill={dim} />
        <path d="M 2 10 Q 14 13 26 10" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    )
  }
  // bar
  return (
    <svg width={w} height={h} viewBox="0 0 28 12" fill="none">
      <rect x="1" y="1" width="26" height="10" rx="4" fill={dim} />
      <rect x="1" y="7" width="18" height="4" rx="2" fill={c} />
    </svg>
  )
}

// ─── Labels / notes ───────────────────────────────────────────────────────────

function VariantLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 12,
        fontFamily: MONO,
        fontSize: 11,
        letterSpacing: '0.1em',
        color: ACCENT,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  )
}

function VariantNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 4,
        fontFamily: MONO,
        fontSize: 9,
        color: TEXT_MUTED,
        maxWidth: 260,
        textAlign: 'center',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  )
}

function PickerSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 9.5,
        letterSpacing: '0.1em',
        color: TEXT_MUTED,
        textTransform: 'uppercase' as const,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  )
}

function PickerNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 9,
        color: 'rgba(242,241,236,0.28)',
        marginTop: 6,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  )
}

// ─── Variant switcher (floating bottom bar) ───────────────────────────────────

type Variant = 'A' | 'B' | 'C' | 'D' | 'S'
const VARIANTS: Variant[] = ['A', 'B', 'C', 'D', 'S']
const VARIANT_NAMES: Record<Variant, string> = {
  A: 'Perimeter Trace',
  B: 'Bilateral Arms',
  C: 'Ambient Halo',
  D: 'Skyline Arc',
  S: 'Settings Picker',
}

function FloatBar({
  variant,
  onVariant,
  frac,
  onSeek,
  running,
  onToggle,
}: {
  variant: Variant
  onVariant: (v: Variant) => void
  frac: number
  onSeek: (f: number) => void
  running: boolean
  onToggle: () => void
}) {
  const idx = VARIANTS.indexOf(variant)

  const prev = () => onVariant(VARIANTS[(idx - 1 + VARIANTS.length) % VARIANTS.length])
  const next = () => onVariant(VARIANTS[(idx + 1) % VARIANTS.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)
      )
        return
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === ' ') {
        e.preventDefault()
        onToggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const isSettingsPicker = variant === 'S'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#1a1d20',
        border: '1px solid rgba(242,241,236,0.12)',
        borderRadius: 999,
        padding: '8px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        zIndex: 9999,
        userSelect: 'none',
      }}
    >
      {/* Prev */}
      <button onClick={prev} style={arrowBtn}>
        ←
      </button>

      {/* Variant label */}
      <div
        style={{
          fontFamily: MONO,
          fontSize: 11,
          color: ACCENT,
          letterSpacing: '0.08em',
          minWidth: 160,
          textAlign: 'center',
        }}
      >
        <span style={{ color: TEXT_MUTED }}>{variant} — </span>
        {VARIANT_NAMES[variant]}
      </div>

      {/* Next */}
      <button onClick={next} style={arrowBtn}>
        →
      </button>

      {/* Divider */}
      {!isSettingsPicker && (
        <div style={{ width: 1, height: 20, background: 'rgba(242,241,236,0.1)' }} />
      )}

      {/* Scrubber + play/pause */}
      {!isSettingsPicker && (
        <>
          <button onClick={onToggle} style={arrowBtn} title="Space to toggle">
            {running ? '⏸' : '▶'}
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(frac * 1000)}
            onChange={(e) => onSeek(Number(e.target.value) / 1000)}
            style={{ width: 80, accentColor: ACCENT, cursor: 'pointer' }}
          />
          <span style={{ fontFamily: MONO, fontSize: 9, color: TEXT_MUTED, minWidth: 28 }}>
            {Math.round(frac * 100)}%
          </span>
        </>
      )}
    </div>
  )
}

const arrowBtn: CSSProperties = {
  width: 28,
  height: 28,
  border: 'none',
  background: 'rgba(242,241,236,0.06)',
  color: TEXT,
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'grid',
  placeItems: 'center',
  fontSize: 12,
  flexShrink: 0,
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function NotchProgressPrototype() {
  // Read variant from URL (reload-stable) and keep in state.
  const [variant, setVariant] = useState<Variant>(() => {
    const v = new URLSearchParams(window.location.search).get('variant') as Variant | null
    return v && VARIANTS.includes(v) ? v : 'A'
  })

  const clock = useFakeClock()

  function handleVariant(v: Variant) {
    setVariant(v)
    const url = new URL(window.location.href)
    url.searchParams.set('variant', v)
    window.history.replaceState(null, '', url.toString())
  }

  const { frac, timeStr, running, toggle, seek } = clock

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px 100px',
        gap: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: 20,
          fontFamily: MONO,
          fontSize: 10,
          color: 'rgba(242,241,236,0.25)',
          letterSpacing: '0.1em',
          userSelect: 'none',
        }}
      >
        PROTOTYPE · MO-23 · NOTCH PROGRESS
      </div>

      {/* Simulated notch mount (screen top bar) */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Screen top bar — simulates the macOS menu bar area */}
        <div
          style={{
            width: 440,
            height: 32,
            background: '#0d0d0f',
            borderBottom: '1px solid rgba(242,241,236,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(242,241,236,0.18)' }}>
            ⌘ Pomoisland
          </span>
          <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(242,241,236,0.18)' }}>
            Mon 6:25 PM
          </span>
        </div>

        {/* Notch black rectangle (hardware cutout) — pill sits on top of it */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: PILL_W,
            height: PILL_H,
            background: '#000',
            borderRadius: `0 0 ${PILL_BR}px ${PILL_BR}px`,
            zIndex: 0,
          }}
        />

        {/* The island pill (and its progress treatment), mounted over the notch */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: 0,
          }}
        >
          {variant === 'A' && <VariantA frac={frac} timeStr={timeStr} />}
          {variant === 'B' && <VariantB frac={frac} timeStr={timeStr} />}
          {variant === 'C' && <VariantC frac={frac} timeStr={timeStr} />}
          {variant === 'D' && <VariantD frac={frac} timeStr={timeStr} />}
          {variant === 'S' && (
            <div style={{ marginTop: 60 }}>
              <SettingsPickerSketch />
            </div>
          )}
        </div>

        {/* Screen surface below notch */}
        {variant !== 'S' && (
          <div
            style={{
              width: 440,
              height: 200,
              background: 'linear-gradient(to bottom, #141416, #0d0d0f)',
              borderRadius: '0 0 8px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: variant === 'D' ? 0 : 0,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgba(242,241,236,0.08)' }}>
              screen content
            </span>
          </div>
        )}
      </div>

      {/* Floating variant switcher + scrubber */}
      <FloatBar
        variant={variant}
        onVariant={handleVariant}
        frac={frac}
        onSeek={seek}
        running={running}
        onToggle={toggle}
      />
    </div>
  )
}
