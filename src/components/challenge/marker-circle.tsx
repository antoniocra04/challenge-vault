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

// Ellipse-ish exponent: rounder than a box, a little fuller than a true ellipse.
const N = 2.3
// Room around the loop for the stroke, tilt and overshoot.
const M = 8
// Never let the loop come closer than this to the screen edge.
const EDGE = 8

type Box = { w: number; h: number; spaceLeft: number; spaceRight: number }
type Loop = { a: number; b: number; d: string }

/**
 * A hand-drawn loop around a w×h line box. The vertical radius is fixed by
 * `pad`; the horizontal one is just wide enough for the ink's corners to sit
 * inside, unless the screen edge is closer — then the loop stays on screen.
 */
function drawLoop({ w, h, spaceLeft, spaceRight }: Box, pad: number, seed: string): Loop {
  const r = rng(hash(seed))
  const hx = w / 2
  const hy = (h / 2) * 0.72 // ink is shorter than the line box
  const b0 = h / 2 + pad
  // Corner inside: (hx/a)^N + (hy/b)^N <= 0.8 (slack for wobble and tilt).
  const rest = Math.max(0.12, 0.8 - (hy / b0) ** N)
  const want = hx / rest ** (1 / N)
  const room = Math.min(spaceLeft, spaceRight) - EDGE + hx
  const a = Math.max(hx + 2, Math.min(want, room, hx + pad * 3))
  // Short of width, buy the corner clearance with height instead (within reason).
  const left = 0.8 - (hx / a) ** N
  const b = Math.min(h / 2 + pad * 1.4, Math.max(b0, left > 0.05 ? hy / left ** (1 / N) : Infinity))

  const tilt = ((r() < 0.5 ? -1 : 1) * (1.5 + r() * 1.5) * Math.PI) / 180
  const start = -Math.PI * (0.55 + r() * 0.2)
  const sweep = Math.PI * 2 * (1.08 + r() * 0.06)
  const p1 = r() * Math.PI * 2
  const p2 = r() * Math.PI * 2
  const cx = a + M
  const cy = b + M
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)
  const steps = 96
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const k = i / steps
    const t = start + sweep * k
    const c = Math.cos(t)
    const s = Math.sin(t)
    // Low-frequency swell (never inward), then the pen drifts out past its start.
    const wob = 1 + 0.035 + 0.035 * Math.sin(2 * t + p1) + 0.015 * Math.sin(3 * t + p2)
    const drift = 1 + Math.max(0, k - 0.88) * 0.6
    const x = a * wob * drift * Math.sign(c) * Math.abs(c) ** (2 / N)
    const y = b * wob * drift * Math.sign(s) * Math.abs(s) ** (2 / N)
    pts.push([x * cos - y * sin, x * sin + y * cos])
  }
  // Wobble, tilt and overshoot reach past a; pull x back in so the drawn
  // stroke, not just the nominal radius, keeps off the screen edge.
  const reach = Math.max(...pts.map(([x]) => Math.abs(x))) + 2
  const sx = Math.min(1, Math.max(room, hx + 2) / reach)
  const d = "M " + pts.map(([x, y]) => `${(cx + x * sx).toFixed(1)} ${(cy + y).toFixed(1)}`).join(" L ")
  return { a, b, d }
}

/**
 * Red china-marker loop around its positioned parent. It marks what is in
 * progress — the only job red has. Each idea gets its own stable loop.
 */
export function MarkerCircle({ seed = "", pad = 10, className }: { seed?: string; pad?: number; className?: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const [box, setBox] = useState<Box | null>(null)

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement
    if (!parent) return
    const measure = () => {
      const rect = parent.getBoundingClientRect()
      const vw = document.documentElement.clientWidth
      const next = { w: rect.width, h: rect.height, spaceLeft: rect.left, spaceRight: vw - rect.right }
      setBox((p) =>
        p && Math.abs(p.w - next.w) < 1 && Math.abs(p.h - next.h) < 1 && Math.abs(p.spaceLeft - next.spaceLeft) < 1
          ? p
          : next,
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(parent)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  const loop = box ? drawLoop(box, pad, seed) : null
  return (
    <svg
      ref={ref}
      aria-hidden
      className={cn("marker-circle pointer-events-none absolute overflow-visible", className)}
      // An absolutely positioned svg is a replaced element, so it gets an explicit size.
      style={
        loop && box
          ? {
              left: box.w / 2 - loop.a - M,
              top: box.h / 2 - loop.b - M,
              width: 2 * (loop.a + M),
              height: 2 * (loop.b + M),
            }
          : { left: 0, top: 0, width: 0, height: 0 }
      }
      viewBox={loop ? `0 0 ${2 * (loop.a + M)} ${2 * (loop.b + M)}` : undefined}
    >
      {loop && (
        <>
          <path d={loop.d} pathLength={1} fill="none" stroke="var(--marker)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          <path
            d={loop.d}
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
