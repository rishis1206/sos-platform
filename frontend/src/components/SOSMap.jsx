import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'

const victimIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const volunteerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

export default function SOSMap({ victimLocation, volunteerLocation, showRoute = false }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const victimMarkerRef = useRef(null)
  const volunteerMarkerRef = useRef(null)
  const routingRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: victimLocation
        ? [victimLocation.lat, victimLocation.lng]
        : [14.4534, 75.9239],
      zoom: 15,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
      victimMarkerRef.current = null
      volunteerMarkerRef.current = null
      routingRef.current = null
    }
  }, [])

  // Update victim marker
  useEffect(() => {
    if (!mapInstanceRef.current || !victimLocation) return

    if (victimMarkerRef.current) {
      victimMarkerRef.current.setLatLng([victimLocation.lat, victimLocation.lng])
    } else {
      victimMarkerRef.current = L.marker(
        [victimLocation.lat, victimLocation.lng],
        { icon: victimIcon }
      ).addTo(mapInstanceRef.current)
        .bindPopup('<b style="color:#cc0000">Victim Location</b>')
        .openPopup()
    }

    if (!volunteerLocation) {
      mapInstanceRef.current.setView([victimLocation.lat, victimLocation.lng], 15)
    }
  }, [victimLocation])

  // Update volunteer marker + route
  useEffect(() => {
    if (!mapInstanceRef.current || !volunteerLocation) return

    if (volunteerMarkerRef.current) {
      volunteerMarkerRef.current.setLatLng([volunteerLocation.lat, volunteerLocation.lng])
    } else {
      volunteerMarkerRef.current = L.marker(
        [volunteerLocation.lat, volunteerLocation.lng],
        { icon: volunteerIcon }
      ).addTo(mapInstanceRef.current)
        .bindPopup('<b style="color:#00cc44">You (Volunteer)</b>')
    }

    // Show route if both locations available and showRoute is true
    if (victimLocation && showRoute) {
      // Remove existing route
      if (routingRef.current) {
        mapInstanceRef.current.removeControl(routingRef.current)
        routingRef.current = null
      }

      // Add new route
      routingRef.current = L.Routing.control({
        waypoints: [
          L.latLng(volunteerLocation.lat, volunteerLocation.lng),
          L.latLng(victimLocation.lat, victimLocation.lng)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: '#cc0000', weight: 4, opacity: 0.8 }]
        },
        createMarker: () => null, // Don't create default markers
        collapsible: true,
      }).addTo(mapInstanceRef.current)
    } else if (victimLocation && volunteerLocation) {
      // Just fit bounds without route
      const bounds = L.latLngBounds(
        [victimLocation.lat, victimLocation.lng],
        [volunteerLocation.lat, volunteerLocation.lng]
      )
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [volunteerLocation, victimLocation, showRoute])

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height: '320px', width: '100%', borderRadius: '4px', border: '1px solid #1c1c1c' }}
      />
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', background: '#cc0000', borderRadius: '50%' }} />
          <span style={{ fontSize: '11px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase' }}>Victim</span>
        </div>
        {volunteerLocation && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', background: '#00cc44', borderRadius: '50%' }} />
            <span style={{ fontSize: '11px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase' }}>
              {showRoute ? 'You (Navigating)' : 'Volunteer'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}