/**
 * PROTOTYPE — MO-21 animation tuning (later-stage pass).
 * Question: What durations / easing / choreography make island animations feel right,
 *           and how should prefers-reduced-motion behave?
 * Variants: A (Snappy) · B (Steady — current baseline) · C (Meditative)
 * Switch via ?variant=A|B|C in the URL, or use the floating bar.
 * Throwaway. Delete or fold winner into ripple.ts / animations.css / settings.css.
 */

import { RIPPLE_DEFS } from '@shared/ripple'
import type { Ripple } from '@shared/types'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

// ─── Timing variant definitions ──────────────────────────────────────────────

interface TimingSet {
  key: 'A' | 'B' | 'C'
  name: string
  tagline: string
  ring: { dur: string; scale: number; easing: string }
  glow: { dur: string }
  pill: { hoverDur: string; hoverEasing: string }
  btn: { dur: string; hoverScale: number; activeScale: number }
  iconBtn: { dur: string }
  progress: { dur: string; easing: string }
  ripple: { easing: string; durScale: number }
  fxGlow: { dur: string }
  fxExit: { dur: string }
  urgent: { dur: string }
  confetti: { dur: string }
}

const TIMING: TimingSet[] = [
  {
    key: 'A',
    name: 'Snappy',
    tagline: 'Short + springy. Overshoot then settle. Energetic, responsive.',
    ring: { dur: '2.2s', scale: 1.06, easing: 'ease-in-out' },
    glow: { dur: '1.8s' },
    pill: { hoverDur: '140ms', hoverEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    btn: { dur: '100ms', hoverScale: 1.09, activeScale: 0.92 },
    iconBtn: { dur: '100ms' },
    progress: { dur: '220ms', easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    ripple: { easing: 'cubic-bezier(.22,.6,.36,1)', durScale: 0.68 },
    fxGlow: { dur: '1.8s' },
    fxExit: { dur: '0.35s' },
    urgent: { dur: '0.6s' },
    confetti: { dur: '0.7s' },
  },
  {
    key: 'B',
    name: 'Steady',
    tagline: 'Current placeholder values — moderate, standard ease. Baseline for comparison.',
    ring: { dur: '3.4s', scale: 1.075, easing: 'ease-in-out' },
    glow: { dur: '2.6s' },
    pill: { hoverDur: '280ms', hoverEasing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
    btn: { dur: '160ms', hoverScale: 1.06, activeScale: 0.96 },
    iconBtn: { dur: '160ms' },
    progress: { dur: '350ms', easing: 'linear' },
    ripple: { easing: 'cubic-bezier(.16,.6,.3,1)', durScale: 1.0 },
    fxGlow: { dur: '2.6s' },
    fxExit: { dur: '0.55s' },
    urgent: { dur: '1.5s' },
    confetti: { dur: '1.2s' },
  },
  {
    key: 'C',
    name: 'Meditative',
    tagline: 'Longer + flowing. Expo-out easing. Calm, deliberate, unhurried.',
    ring: { dur: '5.0s', scale: 1.09, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' },
    glow: { dur: '4.2s' },
    pill: { hoverDur: '380ms', hoverEasing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    btn: { dur: '220ms', hoverScale: 1.04, activeScale: 0.97 },
    iconBtn: { dur: '220ms' },
    progress: { dur: '560ms', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    ripple: { easing: 'cubic-bezier(.1,.7,.2,1)', durScale: 1.45 },
    fxGlow: { dur: '4.2s' },
    fxExit: { dur: '0.8s' },
    urgent: { dur: '2.5s' },
    confetti: { dur: '1.8s' },
  },
]

// Static keyframe rules — timing values are supplied via CSS vars on the element
const KEYFRAMES = `
  @keyframes protoBreathe {
    0%, 100% { transform: rotate(-90deg) scale(1); }
    50%       { transform: rotate(-90deg) scale(var(--proto-breathe-scale, 1.075)); }
  }
  @keyframes protoGlow {
    0%, 100% { opacity: 0.22; }
    50%      { opacity: 0.66; }
  }
  @keyframes protoRipple {
    0%   { transform: scale(1); opacity: var(--op, 0.9); }
    65%  { opacity: calc(var(--op, 0.9) * 0.28); }
    100% { transform: scale(var(--sc, 2)); opacity: 0; }
  }
  @keyframes protoFxExit {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes protoConfetti {
    0%   { transform: translate(-50%, -50%) translate(0, 0) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) translate(var(--dx), var(--dy)) scale(0.4); opacity: 0; }
  }
  @keyframes protoUrgentPulse {
    0%, 100% { opacity: 0.6; }
    50%      { opacity: 1; }
  }
`

// ─── Colour tokens (island dark palette) ─────────────────────────────────────

const C = {
  bg: '#17191D',
  page: '#0e0f11',
  text: '#F2F1EC',
  body: 'rgba(242,241,236,0.85)',
  muted: 'rgba(242,241,236,0.55)',
  faint: 'rgba(242,241,236,0.30)',
  track: 'rgba(242,241,236,0.13)',
  hover: 'rgba(242,241,236,0.08)',
  accent: '#8FC8C0',
  accentBright: '#AADDD8',
  amber: '#E2A24A',
  amberBright: '#ECBA6A',
  border: 'rgba(242,241,236,0.10)',
  section: 'rgba(242,241,236,0.04)',
  MONO: "'IBM Plex Mono', monospace",
  SANS: "'Inter', sans-serif",
  SERIF: "'Fraunces', serif",
}

// ─── Root component ───────────────────────────────────────────────────────────

export function AnimPrototype() {
  const getVariant = (): TimingSet => {
    const v = new URLSearchParams(window.location.search).get('variant') ?? 'B'
    return TIMING.find((t) => t.key === v) ?? TIMING[1]
  }

  const [timing, setTiming] = useState<TimingSet>(getVariant)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Inject static keyframes once
  useEffect(() => {
    const el = document.createElement('style')
    el.id = 'proto-anim-keyframes'
    el.textContent = KEYFRAMES
    document.head.appendChild(el)
    return () => el.remove()
  }, [])

  const switchVariant = (key: 'A' | 'B' | 'C') => {
    const next = TIMING.find((t) => t.key === key) ?? TIMING[1]
    setTiming(next)
    const url = new URL(window.location.href)
    url.searchParams.set('variant', key)
    history.replaceState(null, '', url.toString())
  }

  // Keyboard ← / → to cycle variants
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const idx = TIMING.findIndex((t) => t.key === timing.key)
      if (e.key === 'ArrowLeft') switchVariant(TIMING[(idx + 2) % 3].key)
      if (e.key === 'ArrowRight') switchVariant(TIMING[(idx + 1) % 3].key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [timing.key])

  return (
    <div
      style={{
        background: C.page,
        minHeight: '100vh',
        color: C.text,
        fontFamily: C.SANS,
        padding: '32px 24px 140px',
      }}
    >
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* ── Header ── */}
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 10,
            letterSpacing: '0.18em',
            color: C.faint,
            marginBottom: 8,
            textTransform: 'uppercase',
          }}
        >
          Prototype · MO-21 · Throwaway
        </div>
        <h1
          style={{
            margin: '0 0 6px',
            fontSize: 24,
            fontWeight: 500,
            letterSpacing: '-0.018em',
            fontFamily: C.SERIF,
          }}
        >
          Animation Tuning
        </h1>
        <p
          style={{
            margin: '0 0 40px',
            fontSize: 13,
            color: C.muted,
            lineHeight: 1.6,
            maxWidth: 520,
          }}
        >
          Variant{' '}
          <strong style={{ color: C.accent }}>
            {timing.key} — {timing.name}
          </strong>
          : {timing.tagline}
          {reducedMotion && (
            <span style={{ color: C.amber, marginLeft: 10 }}>· reduced-motion ON</span>
          )}
        </p>

        <Section title="Ring Breathing">
          <RingDemo timing={timing} rm={reducedMotion} />
        </Section>

        <Section title="Hover & Press">
          <HoverDemo timing={timing} rm={reducedMotion} />
        </Section>

        <Section title="Progress Bar">
          <ProgressDemo timing={timing} rm={reducedMotion} />
        </Section>

        <Section title="Completion Ripples">
          <RippleDemo timing={timing} rm={reducedMotion} />
        </Section>

        <Section title="Urgent Amber Shift">
          <UrgentDemo timing={timing} rm={reducedMotion} />
        </Section>

        <Section title="Timing Values">
          <TimingTable timing={timing} rm={reducedMotion} />
        </Section>
      </div>

      {/* ── Floating switcher ── */}
      <VariantBar
        current={timing.key}
        onSwitch={switchVariant}
        rm={reducedMotion}
        onToggleRm={() => setReducedMotion((x) => !x)}
      />
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div
        style={{
          fontFamily: C.MONO,
          fontSize: 10,
          letterSpacing: '0.14em',
          color: C.faint,
          textTransform: 'uppercase',
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

// ─── Ring breathing ───────────────────────────────────────────────────────────

function RingDemo({ timing, rm }: { timing: TimingSet; rm: boolean }) {
  const rings = [
    { label: 'Idle', frac: 0.55, running: false },
    { label: 'Running', frac: 0.72, running: true },
    { label: 'Running (low)', frac: 0.12, running: true },
  ]
  return (
    <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
      {rings.map((r) => (
        <div
          key={r.label}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
        >
          <DemoRing
            size={72}
            radius={30}
            strokeWidth={4}
            frac={r.frac}
            running={r.running}
            timing={timing}
            rm={rm}
          />
          <span
            style={{ fontFamily: C.MONO, fontSize: 10, color: C.muted, letterSpacing: '0.1em' }}
          >
            {r.label}
          </span>
          {r.running && (
            <span style={{ fontFamily: C.MONO, fontSize: 9, color: C.faint }}>
              {rm ? 'static (rm)' : `${timing.ring.dur} · scale ${timing.ring.scale}`}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function DemoRing({
  size,
  radius,
  strokeWidth,
  frac,
  running,
  timing,
  rm,
}: {
  size: number
  radius: number
  strokeWidth: number
  frac: number
  running: boolean
  timing: TimingSet
  rm: boolean
}) {
  const circ = 2 * Math.PI * radius
  const offset = circ * (1 - frac)
  const c = size / 2
  const breatheAnim =
    rm || !running ? 'none' : `protoBreathe ${timing.ring.dur} ${timing.ring.easing} infinite`
  return (
    // key forces animation restart when variant changes
    <div
      key={`ring-${timing.key}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        flex: '0 0 auto',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: 'center',
          animation: breatheAnim,
          ['--proto-breathe-scale' as string]: timing.ring.scale,
        }}
      >
        <circle cx={c} cy={c} r={radius} fill="none" stroke={C.track} strokeWidth={strokeWidth} />
        <circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          stroke={C.accent}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: `stroke-dashoffset ${rm ? '0s' : timing.progress.dur} ${timing.progress.easing}`,
          }}
        />
      </svg>
    </div>
  )
}

// ─── Hover & press ────────────────────────────────────────────────────────────

function HoverDemo({ timing, rm }: { timing: TimingSet; rm: boolean }) {
  const pillTrans = rm ? 'none' : `transform ${timing.pill.hoverDur} ${timing.pill.hoverEasing}`
  const btnTrans = rm ? 'none' : `transform ${timing.btn.dur}`
  const iconTrans = rm ? 'none' : `all ${timing.iconBtn.dur}`

  const pill: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    background: C.bg,
    color: C.text,
    borderRadius: '0 0 20px 20px',
    padding: '14px 20px 10px 12px',
    minWidth: 200,
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: pillTrans,
  }

  const primaryBtn: CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    background: C.accent,
    color: C.bg,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    transition: btnTrans,
    fontSize: 18,
  }

  const iconBtnBase: CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: C.muted,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    transition: iconTrans,
    fontSize: 14,
  }

  return (
    <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Island pill hover */}
      <div>
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 9,
            color: C.faint,
            marginBottom: 10,
            letterSpacing: '0.1em',
          }}
        >
          PILL HOVER-LIFT
        </div>
        <HoverPill style={pill} />
      </div>

      {/* Primary button */}
      <div>
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 9,
            color: C.faint,
            marginBottom: 10,
            letterSpacing: '0.1em',
          }}
        >
          PRIMARY BTN (hover + press)
        </div>
        <HoverScaleBtn
          style={primaryBtn}
          hoverScale={timing.btn.hoverScale}
          activeScale={timing.btn.activeScale}
          rm={rm}
          dur={timing.btn.dur}
        >
          ▶
        </HoverScaleBtn>
      </div>

      {/* Icon buttons */}
      <div>
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 9,
            color: C.faint,
            marginBottom: 10,
            letterSpacing: '0.1em',
          }}
        >
          ICON BTNS
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['↺', '⏭', '⋯'].map((icon) => (
            <HoverBgBtn key={icon} style={iconBtnBase} hoverBg={C.hover}>
              {icon}
            </HoverBgBtn>
          ))}
        </div>
      </div>
    </div>
  )
}

function HoverPill({ style }: { style: CSSProperties }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        ...style,
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontFamily: C.MONO, fontSize: 10, color: C.accent, letterSpacing: '0.14em' }}>
        FOCUS
      </span>
      <span style={{ fontFamily: C.MONO, fontSize: 16, fontWeight: 500 }}>24:00</span>
    </div>
  )
}

function HoverScaleBtn({
  style,
  hoverScale,
  activeScale,
  rm,
  dur,
  children,
}: {
  style: CSSProperties
  hoverScale: number
  activeScale: number
  rm: boolean
  dur: string
  children: React.ReactNode
}) {
  const [state, setState] = useState<'idle' | 'hover' | 'active'>('idle')
  const scale = state === 'active' ? activeScale : state === 'hover' ? hoverScale : 1
  return (
    <button
      style={{
        ...style,
        transform: `scale(${scale})`,
        transition: rm ? 'none' : `transform ${dur}`,
      }}
      onMouseEnter={() => setState('hover')}
      onMouseLeave={() => setState('idle')}
      onMouseDown={() => setState('active')}
      onMouseUp={() => setState('hover')}
    >
      {children}
    </button>
  )
}

function HoverBgBtn({
  style,
  hoverBg,
  children,
}: {
  style: CSSProperties
  hoverBg: string
  children: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      style={{ ...style, background: hovered ? hoverBg : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressDemo({ timing, rm }: { timing: TimingSet; rm: boolean }) {
  const [frac, setFrac] = useState(0.62)

  const steps = [0, 0.25, 0.5, 0.75, 1.0]
  const nextStep = () => {
    const i = steps.findIndex((s) => s > frac)
    setFrac(i >= 0 ? steps[i] : 0)
  }

  const trans = rm ? 'none' : `width ${timing.progress.dur} ${timing.progress.easing}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}>
      <div style={{ height: 5, borderRadius: 999, background: C.track, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.round(frac * 100)}%`,
            background: C.accent,
            borderRadius: 999,
            transition: trans,
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={nextStep}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: 'transparent',
            color: C.text,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: C.SANS,
          }}
        >
          Step forward
        </button>
        <span style={{ fontFamily: C.MONO, fontSize: 11, color: C.muted }}>
          {Math.round(frac * 100)}%
          {!rm && (
            <span style={{ color: C.faint }}>
              {' '}
              · {timing.progress.dur} · {timing.progress.easing}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

// ─── Completion ripples ───────────────────────────────────────────────────────

const RIPPLE_TYPES: Ripple[] = ['burst', 'echo', 'heartbeat', 'bloom']

function RippleDemo({ timing, rm }: { timing: TimingSet; rm: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      {RIPPLE_TYPES.map((type) => (
        <RippleSwatch key={type} type={type} timing={timing} rm={rm} />
      ))}
    </div>
  )
}

function RippleSwatch({ type, timing, rm }: { type: Ripple; timing: TimingSet; rm: boolean }) {
  const [key, setKey] = useState(0)
  const [active, setActive] = useState(true)

  const replay = () => {
    setActive(false)
    setTimeout(() => {
      setKey((k) => k + 1)
      setActive(true)
    }, 80)
  }

  const defs = RIPPLE_DEFS[type]
  const size = 100
  const br = '0 0 16px 16px'

  // Scale ripple durations by variant's durScale
  const scaledDefs = defs.map((d) => ({
    ...d,
    dur: d.dur * timing.ripple.durScale,
    delay: d.delay * timing.ripple.durScale,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {/* Ripple stage */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        {/* Pill shape that the rings emanate from */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: size,
            height: 36,
            background: C.bg,
            borderRadius: br,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{ fontFamily: C.MONO, fontSize: 9, color: C.accent, letterSpacing: '0.12em' }}
          >
            DONE
          </span>
        </div>

        {/* Glow */}
        {active && !rm && (
          <div
            key={`glow-${key}-${timing.key}`}
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: size,
              height: 36,
              borderRadius: br,
              boxShadow: `0 0 24px 4px ${C.accentBright}`,
              animation: `protoGlow ${timing.fxGlow.dur} ease-in-out infinite`,
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Rings */}
        {active &&
          scaledDefs.map((d, i) => (
            <span
              key={`${i}-${key}-${timing.key}`}
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: size,
                height: 36,
                borderRadius: br,
                border: `${d.w}px solid ${d.bright ? C.accentBright : C.accent}`,
                pointerEvents: 'none',
                zIndex: 3,
                ['--op' as string]: d.op,
                ['--sc' as string]: d.sc,
                animation: rm
                  ? 'none'
                  : `protoRipple ${d.dur}s ${timing.ripple.easing} ${d.delay}s ${rm ? 1 : 'infinite'}`,
              }}
            />
          ))}
      </div>

      {/* Label + controls */}
      <span
        style={{
          fontFamily: C.MONO,
          fontSize: 10,
          color: C.muted,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {type}
      </span>
      <div
        style={{
          fontFamily: C.MONO,
          fontSize: 9,
          color: C.faint,
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        {rm ? (
          'static (rm)'
        ) : (
          <>
            {scaledDefs.map((d, i) => (
              <div key={i}>
                ring{i + 1}: {d.dur.toFixed(2)}s +{d.delay.toFixed(2)}s
              </div>
            ))}
          </>
        )}
      </div>
      <button
        onClick={replay}
        style={{
          padding: '4px 10px',
          borderRadius: 6,
          border: `1px solid ${C.border}`,
          background: 'transparent',
          color: C.muted,
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: C.SANS,
        }}
      >
        Replay
      </button>
    </div>
  )
}

// ─── Urgent amber shift ───────────────────────────────────────────────────────

function UrgentDemo({ timing, rm }: { timing: TimingSet; rm: boolean }) {
  const [urgent, setUrgent] = useState(false)
  const accent = urgent ? C.amber : C.accent
  const accentBright = urgent ? C.amberBright : C.accentBright

  const accentTrans = rm
    ? 'none'
    : `background ${timing.urgent.dur}, box-shadow ${timing.urgent.dur}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 420 }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        {/* Ring with accent color transition */}
        <div key={`urgent-${timing.key}`} style={{ position: 'relative', width: 64, height: 64 }}>
          <UrgentRing urgent={urgent} timing={timing} rm={rm} />
        </div>
        {/* Time label */}
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 36,
            fontWeight: 500,
            transition: `color ${rm ? '0s' : timing.urgent.dur}`,
            color: urgent ? C.amber : C.text,
          }}
        >
          00:47
        </div>
        {/* Status label */}
        <div
          style={{
            fontFamily: C.MONO,
            fontSize: 11,
            letterSpacing: '0.14em',
            transition: `color ${rm ? '0s' : timing.urgent.dur}`,
            color: accent,
          }}
        >
          {urgent ? 'URGENT' : 'FOCUS'}
        </div>
      </div>

      {/* Primary button showing accent shift */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: 'none',
            background: accent,
            color: C.bg,
            display: 'grid',
            placeItems: 'center',
            cursor: 'default',
            transition: accentTrans,
            boxShadow: `0 6px 18px ${accentBright}40`,
            fontSize: 18,
          }}
        >
          ▶
        </button>
        <span style={{ fontSize: 12, color: C.muted }}>
          Accent shifts{' '}
          <span style={{ fontFamily: C.MONO, color: urgent ? C.amber : C.accent }}>
            {urgent ? '#E2A24A amber' : '#8FC8C0 teal'}
          </span>
        </span>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setUrgent((u) => !u)}
          style={{
            padding: '6px 16px',
            borderRadius: 8,
            border: `1px solid ${urgent ? C.amber : C.border}`,
            background: 'transparent',
            color: urgent ? C.amber : C.text,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: C.SANS,
            transition: `color 0.15s, border-color 0.15s`,
          }}
        >
          {urgent ? 'Exit urgent' : 'Enter urgent (<60 s)'}
        </button>
        {!rm && (
          <span style={{ fontFamily: C.MONO, fontSize: 10, color: C.faint }}>
            transition: {timing.urgent.dur}
          </span>
        )}
      </div>
    </div>
  )
}

function UrgentRing({ urgent, timing, rm }: { urgent: boolean; timing: TimingSet; rm: boolean }) {
  const size = 64
  const radius = 27
  const strokeWidth = 4
  const circ = 2 * Math.PI * radius
  const frac = 0.12 // low — almost expired
  const offset = circ * (1 - frac)
  const c = size / 2
  const accent = urgent ? C.amber : C.accent
  const breatheAnim = rm ? 'none' : `protoBreathe ${timing.ring.dur} ${timing.ring.easing} infinite`

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        transform: 'rotate(-90deg)',
        transformOrigin: 'center',
        animation: breatheAnim,
        ['--proto-breathe-scale' as string]: timing.ring.scale,
      }}
    >
      <circle cx={c} cy={c} r={radius} fill="none" stroke={C.track} strokeWidth={strokeWidth} />
      <circle
        cx={c}
        cy={c}
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{
          transition: rm
            ? 'none'
            : `stroke ${timing.urgent.dur}, stroke-dashoffset ${timing.progress.dur} ${timing.progress.easing}`,
        }}
      />
    </svg>
  )
}

// ─── Timing values table ──────────────────────────────────────────────────────

function TimingTable({ timing, rm }: { timing: TimingSet; rm: boolean }) {
  const rows: [string, string, string][] = [
    ['Ring breathe duration', timing.ring.dur, rm ? 'none' : timing.ring.dur],
    [
      'Ring breathe scale',
      String(timing.ring.scale),
      rm ? '1 (static)' : String(timing.ring.scale),
    ],
    ['Ring breathe easing', timing.ring.easing, '—'],
    ['Glow pulse', timing.glow.dur, rm ? 'none' : timing.glow.dur],
    ['Pill hover dur', timing.pill.hoverDur, rm ? 'none' : timing.pill.hoverDur],
    ['Pill hover easing', timing.pill.hoverEasing, '—'],
    ['Primary btn dur', timing.btn.dur, rm ? 'none' : timing.btn.dur],
    [
      'Primary btn hover scale',
      String(timing.btn.hoverScale),
      rm ? '1' : String(timing.btn.hoverScale),
    ],
    [
      'Primary btn active scale',
      String(timing.btn.activeScale),
      rm ? '1' : String(timing.btn.activeScale),
    ],
    ['Icon btn dur', timing.iconBtn.dur, rm ? 'none' : timing.iconBtn.dur],
    ['Progress bar dur', timing.progress.dur, rm ? 'none' : timing.progress.dur],
    ['Progress bar easing', timing.progress.easing, '—'],
    ['Ripple easing', timing.ripple.easing, rm ? 'none' : timing.ripple.easing],
    ['Ripple dur scale', `×${timing.ripple.durScale}`, rm ? '—' : `×${timing.ripple.durScale}`],
    ['FX glow dur', timing.fxGlow.dur, rm ? 'none' : timing.fxGlow.dur],
    ['FX exit dur', timing.fxExit.dur, rm ? '0.2s' : timing.fxExit.dur],
    ['Urgent transition', timing.urgent.dur, rm ? 'none' : timing.urgent.dur],
  ]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ borderCollapse: 'collapse', fontSize: 12, fontFamily: C.MONO, width: '100%' }}
      >
        <thead>
          <tr>
            {['Property', 'Normal', 'Reduced-motion'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: 'left',
                  padding: '6px 16px 6px 0',
                  color: C.faint,
                  fontWeight: 400,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  borderBottom: `1px solid ${C.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([prop, normal, reduced]) => (
            <tr key={prop}>
              <td
                style={{
                  padding: '5px 16px 5px 0',
                  color: C.muted,
                  whiteSpace: 'nowrap',
                  borderBottom: `1px solid ${C.section}`,
                }}
              >
                {prop}
              </td>
              <td
                style={{
                  padding: '5px 16px 5px 0',
                  color: C.accent,
                  whiteSpace: 'nowrap',
                  borderBottom: `1px solid ${C.section}`,
                }}
              >
                {normal}
              </td>
              <td
                style={{
                  padding: '5px 0',
                  color: reduced === 'none' ? C.amber : C.muted,
                  whiteSpace: 'nowrap',
                  borderBottom: `1px solid ${C.section}`,
                }}
              >
                {reduced}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Floating variant switcher ────────────────────────────────────────────────

function VariantBar({
  current,
  onSwitch,
  rm,
  onToggleRm,
}: {
  current: 'A' | 'B' | 'C'
  onSwitch: (k: 'A' | 'B' | 'C') => void
  rm: boolean
  onToggleRm: () => void
}) {
  const keys: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C']
  const idx = keys.indexOf(current)

  const prev = () => onSwitch(keys[(idx + 2) % 3])
  const next = () => onSwitch(keys[(idx + 1) % 3])

  const pill: CSSProperties = {
    position: 'fixed',
    bottom: 28,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(23,25,29,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(242,241,236,0.12)',
    borderRadius: 999,
    padding: '8px 12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    zIndex: 9999,
    userSelect: 'none',
  }

  const arrowBtn: CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    background: 'transparent',
    color: C.muted,
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
    fontSize: 14,
    padding: 0,
  }

  const variantPill = (k: 'A' | 'B' | 'C'): CSSProperties => ({
    padding: '4px 12px',
    borderRadius: 999,
    border: 'none',
    background: k === current ? C.accent : 'transparent',
    color: k === current ? '#17191D' : C.muted,
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: C.MONO,
    fontWeight: 500,
    letterSpacing: '0.06em',
    transition: 'background 0.15s, color 0.15s',
  })

  const divider: CSSProperties = {
    width: 1,
    height: 18,
    background: C.border,
    margin: '0 4px',
  }

  const currentTiming = TIMING.find((t) => t.key === current)!

  return (
    <div style={pill}>
      <button style={arrowBtn} onClick={prev} aria-label="Previous variant">
        ←
      </button>
      {keys.map((k) => (
        <button key={k} style={variantPill(k)} onClick={() => onSwitch(k)}>
          {k}
        </button>
      ))}
      <button style={arrowBtn} onClick={next} aria-label="Next variant">
        →
      </button>

      <div style={divider} />

      <span style={{ fontFamily: C.MONO, fontSize: 10, color: C.muted, padding: '0 4px' }}>
        {currentTiming.name}
      </span>

      <div style={divider} />

      {/* Reduced-motion toggle */}
      <button
        onClick={onToggleRm}
        aria-label="Toggle reduced motion"
        style={{
          padding: '4px 10px',
          borderRadius: 999,
          border: `1px solid ${rm ? C.amber : C.border}`,
          background: rm ? 'rgba(226,162,74,0.12)' : 'transparent',
          color: rm ? C.amber : C.faint,
          cursor: 'pointer',
          fontSize: 10,
          fontFamily: C.MONO,
          letterSpacing: '0.06em',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
        title="Toggle prefers-reduced-motion simulation"
      >
        {rm ? 'rm: ON' : 'rm: off'}
      </button>

      {/* Keyboard hint */}
      <span
        style={{
          fontFamily: C.MONO,
          fontSize: 9,
          color: C.faint,
          padding: '0 4px',
          whiteSpace: 'nowrap',
        }}
      >
        ← →
      </span>
    </div>
  )
}
