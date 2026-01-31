import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

const patchSimpleHeatContext = () => {
  if (typeof window === 'undefined') return
  const { simpleheat } = window
  if (!simpleheat || simpleheat.__willReadFrequently) return

  const patched = function (input) {
    const canvas = typeof input === 'string' ? document.getElementById(input) : input
    if (canvas && !canvas.__heatmapGetContextPatched && typeof canvas.getContext === 'function') {
      const originalGetContext = canvas.getContext.bind(canvas)
      canvas.getContext = (type, options) => {
        if (type === '2d' && !options) {
          return originalGetContext(type, { willReadFrequently: true })
        }
        return originalGetContext(type, options)
      }
      canvas.__heatmapGetContextPatched = true
    }
    return simpleheat.call(this, input)
  }

  patched.__willReadFrequently = true
  patched.prototype = simpleheat.prototype
  window.simpleheat = patched
}

const HeatmapLayer = ({ points = [], highContrast = false }) => {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    if (!map) return undefined
    patchSimpleHeatContext()
    if (layerRef.current) {
      layerRef.current.remove()
      layerRef.current = null
    }
    if (points.length) {
      const baseOptions = {
        maxZoom: 17,
        max: 1,
      }
      const standardOptions = {
        radius: 62,
        blur: 42,
        minOpacity: 0.32,
        gradient: {
          0.1: '#ffd6a3',
          0.45: '#ff8a2b',
          0.75: '#4fe1c7',
          1.0: '#38bdf8',
        },
      }
      const highContrastOptions = {
        radius: 72,
        blur: 48,
        minOpacity: 0.4,
        gradient: {
          0.05: '#fff2b2',
          0.25: '#ffc857',
          0.5: '#ff7a18',
          0.75: '#ff3b30',
          1.0: '#00f5d4',
        },
      }
      const heatLayer = L.heatLayer(points, {
        ...baseOptions,
        ...(highContrast ? highContrastOptions : standardOptions),
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
  }, [map, points, highContrast])

  return null
}

export default HeatmapLayer
