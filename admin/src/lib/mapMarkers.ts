import { Marker } from 'maplibre-gl'
import type { Map as MaplibreMap, PopupOptions } from 'maplibre-gl'

// Teal from the admin palette (tailwind.config.ts `teal`) - the fallback
// circle behind a business's initial when it has no logo.
const FALLBACK_BACKGROUND = '#0F766E'

// Round business marker with a small tail whose tip sits on the coordinate
// (the marker is anchored at its bottom): the logo when there is one,
// otherwise (or if the image fails to load) a circle with the business's
// first letter. No default pin anywhere.
function createBusinessElement(logoUrl: string | null, name: string) {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))'

  const circle = document.createElement('div')
  circle.style.cssText = `position:relative;display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:9999px;overflow:hidden;background:${FALLBACK_BACKGROUND};border:3px solid #fff;color:#fff;font:800 20px/1 Tajawal,system-ui,sans-serif`
  circle.textContent = name.trim()[0]?.toUpperCase() ?? '?'

  if (logoUrl) {
    const img = document.createElement('img')
    img.src = logoUrl
    img.alt = ''
    img.draggable = false
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#fff'
    img.onerror = () => { img.style.display = 'none' }
    circle.appendChild(img)
  }

  const tail = document.createElement('div')
  tail.style.cssText = 'width:0;height:0;margin-top:-2px;border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid #fff'

  wrap.append(circle, tail)
  return wrap
}

export function createBusinessMarker(map: MaplibreMap, lngLat: [number, number], business: { logoUrl: string | null; name: string }, draggable = false) {
  return new Marker({ element: createBusinessElement(business.logoUrl, business.name), anchor: 'bottom', draggable })
    .setLngLat(lngLat)
    .addTo(map)
}

// A custom marker element (unlike the built-in pin) isn't accounted for in a
// popup's default offset, so the popup would sit on top of the marker.
const ABOVE = [0, -60] as [number, number]
export const BUSINESS_POPUP_OPTIONS: PopupOptions = {
  offset: {
    bottom: ABOVE,
    'bottom-left': ABOVE,
    'bottom-right': ABOVE,
    top: [0, 4],
    'top-left': [0, 4],
    'top-right': [0, 4],
    left: [10, -30],
    right: [-10, -30],
    center: [0, 0]
  }
}
