import { useEffect, useRef, useState } from 'react'
import { Map as MaplibreMap, Marker, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { colors } from '@/lib/theme'
import { MAP_STYLE_URL } from '@/lib/mapProvider'
import { useMapRequests, useMapBusinesses } from './useMapData'

const CENTER: [number, number] = [35.2137, 31.7683]

export function OperationsMapPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MaplibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [showRequests, setShowRequests] = useState(true)
  const [showBusinesses, setShowBusinesses] = useState(true)

  const requestsQuery = useMapRequests()
  const businessesQuery = useMapBusinesses()

  useEffect(() => {
    if (!containerRef.current) return
    const map = new MaplibreMap({ container: containerRef.current, style: MAP_STYLE_URL, center: CENTER, zoom: 11 })
    mapRef.current = map
    return () => map.remove()
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    function render() {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      if (showRequests) {
        for (const request of requestsQuery.data ?? []) {
          const popup = new Popup({ offset: 12 }).setHTML(`<div style="font-family:inherit">${t(`requests.service.${request.service_type}`)}</div>`)
          const marker = new Marker({ color: colors.info })
            .setLngLat([request.longitude, request.latitude])
            .setPopup(popup)
            .addTo(map!)
          marker.getElement().style.cursor = 'pointer'
          marker.getElement().addEventListener('click', () => navigate(`/requests/${request.id}`))
          markersRef.current.push(marker)
        }
      }

      if (showBusinesses) {
        for (const business of businessesQuery.data ?? []) {
          if (business.latitude == null || business.longitude == null) continue
          const popup = new Popup({ offset: 12 }).setHTML(`<div style="font-family:inherit">${business.name}</div>`)
          const marker = new Marker({ color: colors.sand })
            .setLngLat([business.longitude, business.latitude])
            .setPopup(popup)
            .addTo(map!)
          marker.getElement().style.cursor = 'pointer'
          marker.getElement().addEventListener('click', () => navigate(`/businesses/${business.id}`))
          markersRef.current.push(marker)
        }
      }
    }

    if (map.isStyleLoaded()) render()
    else map.once('load', render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRequests, showBusinesses, requestsQuery.data, businessesQuery.data])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('map.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('map.subtitle')}</p>
      </div>
      <div className="flex gap-2">
        <Button variant={showRequests ? 'default' : 'outline'} size="sm" onClick={() => setShowRequests(v => !v)}>
          <ClipboardList className="size-4" />
          {t('map.layers.requests')} ({requestsQuery.data?.length ?? 0})
        </Button>
        <Button variant={showBusinesses ? 'default' : 'outline'} size="sm" onClick={() => setShowBusinesses(v => !v)}>
          <Store className="size-4" />
          {t('map.layers.businesses')} ({businessesQuery.data?.length ?? 0})
        </Button>
      </div>
      <div ref={containerRef} className="h-[calc(100dvh-14rem)] min-h-96 w-full overflow-hidden rounded-lg border border-border" />
    </div>
  )
}
