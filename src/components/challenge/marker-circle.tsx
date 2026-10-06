"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

function hash(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return h >>> 0
}

function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A loop drawn at the box's real size (never stretched): a superellipse that
 * clears the corners of the text it surrounds, with a little hand wobble and
 * an overshoot where the pencil comes back past its start.
 */
function loopPath(w: number, h: number, pad: number, seed: string) {
  const r = rng(hash(seed))
  const cx = w / 2
  const cy = h / 2
  // With the svg inset by pad×1.6 and pad, these axes clear the text box corners.
  const a = w / 2 - pad * 0.3
  const b = h / 2
  const n = 4
  const start = -Math.PI * (0.62 + r() * 0.12)
  const sweep = Math.PI * 2 * (1.07 + r() * 0.05)
  const phase = r() * Math.PI * 2
  const steps = 72
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = start + (sweep * i) / steps
    const c = Math.cos(t)
    const s = Math.sin(t)
    // Superellipse radius, slight low-frequency wobble, and a drift outward
    // on the overshoot so the end doesn't land on the start.
    const wobble = 1 + 0.015 * Math.sin(3 * t + phase) + 0.008 * Math.sin(7 * t + phase * 2)
    const drift = 1 + 0.05 * Math.max(0, i / steps - 0.9) * 10
    const x = cx + a * wobble * drift * Math.sign(c) * Math.abs(c) ** (2 / n)
    const y = cy + b * wobble * drift * Math.sign(s) * Math.abs(s) ** (2 / n)
    pts.push([x, y])
  }
  return "M " + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ")
}

/**
 * Red china-marker loop around its positioned parent. It marks what is in
 * progress — the only job red has. Each idea gets its own stable loop.
 */
export function MarkerCircle({ seed = "", pad = 12, className }: { seed?: string; pad?: number; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      setSize((s) => (s && Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1 ? s : { w: width, h: height }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const d = size ? loopPath(size.w, size.h, pad, seed) : null
  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={size ? `0 0 ${size.w} ${size.h}` : undefined}
      // An absolutely positioned svg is a replaced element: insets alone fall
      // back to 300×150, so the size is set explicitly.
      style={{
        top: -pad,
        left: -pad * 1.6,
        width: `calc(100% + ${pad * 3.2}px)`,
        height: `calc(100% + ${pad * 2}px)`,
      }}
      className={cn("marker-circle pointer-events-none absolute overflow-visible", className)}
    >
      {d && (
        <>
          <path d={d} pathLength={1} fill="none" stroke="var(--marker)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={d}
            pathLength={1}
            transform="translate(1.2 1)"
            fill="none"
            stroke="var(--marker)"
            strokeOpacity={0.45}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}
