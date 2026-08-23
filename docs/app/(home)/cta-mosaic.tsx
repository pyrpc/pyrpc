/*
 * CTA background mosaic, a wide field of independent rectangular tiles
 * whose brightness forms abstract clusters dissolving into the canvas.
 * Deterministic (seeded) so SSR and client render identically.
 */

import type { CSSProperties } from 'react';

const W = 1600;
const H = 420;
const CELL_W = 26;
const CELL_H = 13;

const TIERS = ['#090909', '#0e0e0e', '#151515', '#1f1f1f', '#232a21', '#2e3a2a'];

/* Light-mode ramp: same geometry, inverted quiet grays with the green accent */
const LIGHT_TIERS = ['#f7f7f7', '#f1f1f1', '#eaeaea', '#e2e2e2', '#e9eee1', '#dde5d2'];

/* Irregular cluster field, weight toward left/right thirds, quiet center */
const CLUSTERS = [
  { x: 150, y: 120, s: 105, a: 1.0 },
  { x: 95, y: 330, s: 85, a: 0.72 },
  { x: 370, y: 250, s: 95, a: 0.58 },
  { x: 545, y: 70, s: 75, a: 0.42 },
  { x: 1065, y: 95, s: 85, a: 0.5 },
  { x: 1290, y: 275, s: 100, a: 0.82 },
  { x: 1490, y: 115, s: 80, a: 0.68 },
  { x: 1535, y: 350, s: 70, a: 0.55 },
];

function hash2(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) % 100000 / 100000;
}

function dampCenter(x: number): number {
  /* Quietest behind the CTA copy/button (center band), smooth edges */
  const d = (x - 810) / 230;
  return 1 - 0.68 * Math.exp(-d * d);
}

type MosaicCell = {
  x: number;
  y: number;
  fill: string;
  lightFill: string;
  drift: boolean;
  dur: number;
  delay: number;
  sparse: boolean;
};

function buildMosaic(): MosaicCell[] {
  const cells: MosaicCell[] = [];
  const stepX = CELL_W + 5;
  const stepY = CELL_H + 5;
  const cols = Math.floor((W - 16) / stepX);
  const rows = Math.floor((H - 16) / stepY);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = 8 + col * stepX;
      const cy = 8 + row * stepY;
      const nHi = hash2(col * 7 + 1, row * 13 + 3);
      const nLo = hash2((col >> 2) * 31 + 5, (row >> 2) * 17 + 11);

      /* Organic holes scattered through the whole field */
      if (nHi > 0.93) continue;

      let v = 0;
      for (const c of CLUSTERS) {
        const dx = cx - c.x;
        const dy = cy - c.y;
        v += c.a * Math.exp(-(dx * dx + dy * dy) / (2 * c.s * c.s));
      }
      v *= dampCenter(cx);
      /* Low-frequency patchiness dissolves cluster edges gradually */
      v *= 0.62 + 0.62 * nLo;

      /* Sparse speckle outside clusters, denser dropout near-invisible */
      if (v < 0.055) {
        if (nHi > 0.86) continue;
        v = 0.05;
      }

      let tier = 0;
      if (v >= 0.72) tier = 5;
      else if (v >= 0.54) tier = 4;
      else if (v >= 0.38) tier = 3;
      else if (v >= 0.24) tier = 2;
      else if (v >= 0.12) tier = 1;

      cells.push({
        x: cx,
        y: cy,
        fill: TIERS[tier],
        lightFill: LIGHT_TIERS[tier],
        /* ~7% of cells breathe very slowly; geometry never moves */
        drift: nHi > 0.29 && nHi < 0.365,
        dur: 9 + Math.round(nLo * 90) / 5,
        delay: -(nHi * 18),
        sparse: col % 2 === 1 || row % 2 === 1,
      });
    }
  }
  return cells;
}

const CELLS = buildMosaic();

export function CtaMosaic() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {CELLS.map((c, i) => (
          <rect
            key={i}
            x={c.x}
            y={c.y}
            width={CELL_W}
            height={CELL_H}
            rx={1}
            fill={c.fill}
            className={`mosaic-tile ${c.sparse ? 'max-md:hidden' : ''} ${c.drift ? 'cta-drift' : ''}`}
            style={
              {
                ...(c.drift
                  ? { animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }
                  : {}),
                '--t': c.lightFill,
              } as CSSProperties
            }
          />
        ))}
      </svg>
    </div>
  );
}
