// MoonTab - shared pure helpers used by the new tab page and the icon generator.
// Pure functions only: no `chrome`, no DOM. Everything here is a function of time,
// so the whole feature needs no geolocation and no network.
//
// Phase times come from Jean Meeus, "Astronomical Algorithms" (2nd ed.), chapter 49.
// Only the new-moon and full-moon phases are implemented (we don't need the quarters
// for the "next event" date). Times are computed in Dynamical Time and treated as UTC;
// the difference (delta-T, ~1 min) is irrelevant for a date shown to the day.

const SYNODIC_MONTH = 29.530588861 // mean length of a lunation, days
const deg = Math.PI / 180
const sin = (d: number) => Math.sin(d * deg)

// ---------- Palette (shared wherever the moon disk is drawn) ----------
// MOON_RING is used by the new tab page SVG; MOON_LIT/MOON_DARK are used by the brand-icon
// generator (scripts/make-icons.mjs) and the dev preview.
export const MOON_LIT = '#f6f4ea' // sunlit face - warm near-white
export const MOON_DARK = '#454c5c' // shadowed face - mid slate, visible on a light background
export const MOON_RING = 'rgba(150,160,180,0.5)' // thin outline so a new moon isn't invisible

// ---------- Julian day <-> Date ----------
// Unix epoch (1970-01-01T00:00:00Z) is Julian Day 2440587.5.
export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}
export function fromJulianDay(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000)
}

// ---------- Meeus ch. 49: true time of a phase ----------
// k is integer for a new moon, integer + 0.5 for a full moon.
function truePhaseJDE(k: number): number {
  const T = k / 1236.85
  const T2 = T * T,
    T3 = T2 * T,
    T4 = T3 * T

  const jde =
    2451550.09766 +
    29.530588861 * k +
    0.00015437 * T2 -
    0.00000015 * T3 +
    0.00000000073 * T4

  const E = 1 - 0.002516 * T - 0.0000074 * T2 // Earth orbit eccentricity factor
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3 // Sun mean anomaly
  const Mp =
    201.5643 +
    385.81693528 * k +
    0.0107582 * T2 +
    0.00001238 * T3 -
    0.000000058 * T4 // Moon mean anomaly
  const F =
    160.7108 +
    390.67050284 * k -
    0.0016118 * T2 -
    0.00000227 * T3 +
    0.000000011 * T4 // Moon arg. of latitude
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3 // ascending node

  // New moon and full moon share the same correction table (Meeus ch. 49).
  const corr =
    -0.4072 * sin(Mp) +
    0.17241 * E * sin(M) +
    0.01608 * sin(2 * Mp) +
    0.01039 * sin(2 * F) +
    0.00739 * E * sin(Mp - M) -
    0.00514 * E * sin(Mp + M) +
    0.00208 * E * E * sin(2 * M) -
    0.00111 * sin(Mp - 2 * F) -
    0.00057 * sin(Mp + 2 * F) +
    0.00056 * E * sin(2 * Mp + M) -
    0.00042 * sin(3 * Mp) +
    0.00042 * E * sin(M + 2 * F) +
    0.00038 * E * sin(M - 2 * F) -
    0.00024 * E * sin(2 * Mp - M) -
    0.00017 * sin(Om) -
    0.00007 * sin(Mp + 2 * M) +
    0.00004 * sin(2 * Mp - 2 * F) +
    0.00004 * sin(3 * M) +
    0.00003 * sin(Mp + M - 2 * F) +
    0.00003 * sin(2 * Mp + 2 * F) -
    0.00003 * sin(Mp + M + 2 * F) +
    0.00003 * sin(Mp - M + 2 * F) -
    0.00002 * sin(Mp - M - 2 * F) -
    0.00002 * sin(3 * Mp + M) +
    0.00002 * sin(4 * Mp)

  // Additional planetary-argument corrections (apply to all phases).
  const A1 = 299.77 + 0.107408 * k - 0.009173 * T2
  const A2 = 251.88 + 0.016321 * k
  const A3 = 251.83 + 26.651886 * k
  const A4 = 349.42 + 36.412478 * k
  const A5 = 84.66 + 18.206239 * k
  const A6 = 141.74 + 53.303771 * k
  const A7 = 207.14 + 2.453732 * k
  const A8 = 154.84 + 7.30686 * k
  const A9 = 34.52 + 27.261239 * k
  const A10 = 207.19 + 0.121824 * k
  const A11 = 291.34 + 1.844379 * k
  const A12 = 161.72 + 24.198154 * k
  const A13 = 239.56 + 25.513099 * k
  const A14 = 331.55 + 3.592518 * k

  const planetary =
    0.000325 * sin(A1) +
    0.000165 * sin(A2) +
    0.000164 * sin(A3) +
    0.000126 * sin(A4) +
    0.00011 * sin(A5) +
    0.000062 * sin(A6) +
    0.00006 * sin(A7) +
    0.000056 * sin(A8) +
    0.000047 * sin(A9) +
    0.000042 * sin(A10) +
    0.00004 * sin(A11) +
    0.000037 * sin(A12) +
    0.000035 * sin(A13) +
    0.000023 * sin(A14)

  return jde + corr + planetary
}

// New / full moon for a given lunation index k (integer). Returns a Date (UTC).
export function newMoon(k: number): Date {
  return fromJulianDay(truePhaseJDE(k))
}
export function fullMoon(k: number): Date {
  return fromJulianDay(truePhaseJDE(k + 0.5))
}

// Approximate lunation index for a date (Meeus): integer k -> new moon near that date.
function decimalYear(date: Date): number {
  const y = date.getUTCFullYear()
  const start = Date.UTC(y, 0, 1)
  const next = Date.UTC(y + 1, 0, 1)
  return y + (date.getTime() - start) / (next - start)
}
function baseK(date: Date): number {
  return Math.round((decimalYear(date) - 2000) * 12.3685)
}

// ---------- Next upcoming events ----------
export interface MoonEvent {
  type: 'new' | 'full'
  name: string
  date: Date
}
export interface NextEvents {
  newMoon: Date
  fullMoon: Date
  next: MoonEvent
}

// Returns the next new moon, the next full moon, and whichever comes first.
export function nextEvents(date: Date = new Date()): NextEvents {
  const k = baseK(date)
  let nextNew: Date | null = null
  let nextFull: Date | null = null
  // A +/-2 lunation window around the estimate always brackets the next event.
  for (let i = -2; i <= 2; i++) {
    const nm = newMoon(k + i)
    if (nm > date && (!nextNew || nm < nextNew)) nextNew = nm
    const fm = fullMoon(k + i)
    if (fm > date && (!nextFull || fm < nextFull)) nextFull = fm
  }
  // The +/-2 window always brackets the next event, so both are non-null here.
  const nn = nextNew as Date
  const nf = nextFull as Date
  const next: MoonEvent =
    nn <= nf
      ? { type: 'new', name: 'New Moon', date: nn }
      : { type: 'full', name: 'Full Moon', date: nf }
  return { newMoon: nn, fullMoon: nf, next }
}

// ---------- Current phase ----------
export interface Phase {
  illum: number
  cyclePos: number
  waxing: boolean
  name: string
}

// cyclePos: position in the synodic cycle, 0 (new) .. 0.5 (full) .. 1 (next new).
// illum: illuminated fraction of the disk (0..1), derived from cyclePos. The uniform-cycle
//   approximation is a few percent off the true value but invisible at icon scale.
export function currentPhase(date: Date = new Date()): Phase {
  const k = baseK(date)
  let prevNew: Date | null = null
  let nextNew: Date | null = null
  for (let i = -2; i <= 2; i++) {
    const nm = newMoon(k + i)
    if (nm <= date && (!prevNew || nm > prevNew)) prevNew = nm
    if (nm > date && (!nextNew || nm < nextNew)) nextNew = nm
  }
  const pn = prevNew as Date
  const nn = nextNew as Date
  const cyclePos =
    (date.getTime() - pn.getTime()) / (nn.getTime() - pn.getTime())
  const illum = (1 - Math.cos(2 * Math.PI * cyclePos)) / 2
  const waxing = cyclePos < 0.5
  return { illum, cyclePos, waxing, name: phaseName(cyclePos) }
}

// One of the eight standard names. Principal phases (new / quarters / full) get a ~1-day
// window so the icon and the name land on them on the right day.
const PRINCIPAL_WINDOW = 1 / SYNODIC_MONTH // ~1 day, expressed as a fraction of the cycle
export function phaseName(cyclePos: number): string {
  const p = ((cyclePos % 1) + 1) % 1
  const w = PRINCIPAL_WINDOW
  if (p < w || p > 1 - w) return 'New Moon'
  if (Math.abs(p - 0.25) < w) return 'First Quarter'
  if (Math.abs(p - 0.5) < w) return 'Full Moon'
  if (Math.abs(p - 0.75) < w) return 'Last Quarter'
  if (p < 0.25) return 'Waxing Crescent'
  if (p < 0.5) return 'Waxing Gibbous'
  if (p < 0.75) return 'Waning Gibbous'
  return 'Waning Crescent'
}

// ---------- Drawing geometry ----------
// SVG path `d` for the *lit* region of the disk, given the illuminated fraction and whether
// the moon is waxing. Northern-hemisphere convention: waxing is lit on the right.
// The same string is used by the new tab page (<path>) and the brand-icon generator.
//
// The lit region is a semicircle on the lit limb plus/minus a half-ellipse terminator whose
// horizontal radius is r*|1 - 2*illum|: zero at the quarters (straight terminator -> half
// moon), full r at new/full. A crescent (illum < 0.5) bows the terminator toward the lit
// limb; a gibbous (illum > 0.5) bows it the other way.
export function moonPath(
  illum: number,
  waxing: boolean,
  cx: number,
  cy: number,
  r: number
): string {
  illum = Math.max(0, Math.min(1, illum))
  if (illum <= 0.0001) return '' // new moon: nothing lit
  const top = `${cx},${cy - r}`
  const bottom = `${cx},${cy + r}`
  if (illum >= 0.9999) {
    // full disk, drawn as two semicircle arcs
    return `M ${top} A ${r},${r} 0 0 1 ${bottom} A ${r},${r} 0 0 1 ${top} Z`
  }
  const limbSweep = waxing ? 1 : 0 // lit limb bows right (waxing) or left (waning)
  const rx = r * Math.abs(1 - 2 * illum) // terminator horizontal radius (0 at the quarters)
  // Terminator sweep: crescent vs gibbous flips it; waxing vs waning mirrors it.
  let termSweep: 0 | 1
  if (illum < 0.5) termSweep = waxing ? 0 : 1 // crescent
  else termSweep = waxing ? 1 : 0 // gibbous
  return `M ${top} A ${r},${r} 0 0 ${limbSweep} ${bottom} A ${rx},${r} 0 0 ${termSweep} ${top} Z`
}
