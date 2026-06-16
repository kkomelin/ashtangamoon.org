// Entry: renders the moon card and the next new/full moon. Pure-client, no network.
// Recomputed on every page load, so it's always current.

import { registerSW } from 'virtual:pwa-register'
import {
  currentPhase,
  moonPath,
  MOON_RING,
  nextEvents,
  type Phase,
} from './moon'

const $ = (id: string) => document.getElementById(id) as HTMLElement

const R = 52
const C = 60 // center of the 120x120 viewBox
const SIZE = 200 // rendered size on the page (the vector scales from the viewBox)

// Build the vector moon: a shadowed disk, the sunlit region (shared moonPath geometry),
// and a thin ring. Gradients give the disk a soft spherical look.
function moonSvg(phase: Phase): string {
  const lit = moonPath(phase.illum, phase.waxing, C, C, R)
  return `
    <svg viewBox="0 0 120 120" width="${SIZE}" height="${SIZE}" role="img"
         aria-label="${phase.name}, ${Math.round(phase.illum * 100)}% illuminated">
      <defs>
        <radialGradient id="litFace" cx="42%" cy="36%" r="72%">
          <stop offset="0%" stop-color="#fffdf5"/>
          <stop offset="100%" stop-color="#e7e1c9"/>
        </radialGradient>
        <radialGradient id="darkFace" cx="50%" cy="46%" r="62%">
          <stop offset="0%" stop-color="#4c5468"/>
          <stop offset="100%" stop-color="#383f4f"/>
        </radialGradient>
      </defs>
      <circle cx="${C}" cy="${C}" r="${R}" fill="url(#darkFace)"/>
      ${lit ? `<path d="${lit}" fill="url(#litFace)"/>` : ''}
      <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="${MOON_RING}" stroke-width="1"/>
    </svg>`
}

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

// "today" / "tomorrow" / "in N days", measured from local midnight.
function relative(date: Date): string {
  const days = Math.round(
    (startOfDay(date).getTime() - startOfDay(new Date()).getTime()) / 86400000
  )
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

function render(): void {
  const phase = currentPhase()
  const ev = nextEvents()

  $('moonWrap').innerHTML = moonSvg(phase)
  $('phase').textContent = phase.name
  $('illum').textContent = `${Math.round(phase.illum * 100)}% illuminated`

  $('nextName').textContent = ev.next.name
  $('nextWhen').textContent = dateFmt.format(ev.next.date)
  $('nextRel').textContent = relative(ev.next.date)

  // The other principal event (if next is the full moon, show the upcoming new moon, etc.).
  const other =
    ev.next.type === 'full'
      ? { name: 'New Moon', date: ev.newMoon }
      : { name: 'Full Moon', date: ev.fullMoon }
  $('otherName').textContent = other.name
  $('otherWhen').textContent = `${dateFmt.format(other.date)} (${relative(other.date)})`
  ;($('other') as HTMLElement & { hidden: boolean }).hidden = false
}

render()

// PWA: keep existing installed users updated. autoUpdate installs the new SW in the
// background and applies it on the next reload, with no user prompt.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true)
  },
})
