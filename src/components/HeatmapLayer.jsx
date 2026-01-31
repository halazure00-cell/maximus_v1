import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

const HeatmapLayer = ({ points = [] }) => {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (!map) return undefined
    if (layerRef.current) {
      layerRef.current.remove()
      layerRef.current = null
    }
    if (points.length) {
      const heatLayer = L.heatLayer(points, {
        radius: 30,
        blur: 22,
        maxZoom: 16,
        gradient: {
          0.2: '#ffd6a3',
          0.5: '#ff8a2b',
          0.8: '#4fe1c7',
        },
      })
      heatLayer.addTo(map)
      layerRef.current = heatLayer
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.remove()
        layerRef.current = null
      }
    }
  }, [map, points])

  return null
}

export default HeatmapLayer
