import React, { useEffect, useRef } from 'react';
import { MapContainer as LeafletMap, TileLayer, Marker, Popup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons for different elements
const releaseIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc3545" width="24" height="24">
      <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2"/>
      <text x="12" y="16" font-family="Arial" font-size="12" fill="#fff" text-anchor="middle">!</text>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const receptorIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#007bff" width="20" height="20">
      <rect x="4" y="4" width="16" height="16" stroke="#fff" stroke-width="2"/>
      <text x="12" y="16" font-family="Arial" font-size="10" fill="#fff" text-anchor="middle">R</text>
    </svg>
  `),
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapContainer({ onMapClick, activeRelease, currentPlume, receptors }) {
  const mapRef = useRef();

  // Center map on active release
  useEffect(() => {
    if (activeRelease && mapRef.current) {
      mapRef.current.setView([activeRelease.latitude, activeRelease.longitude], 13);
    }
  }, [activeRelease]);

  const defaultCenter = [39.8283, -98.5795]; // Center of US
  const defaultZoom = 4;

  return (
    <LeafletMap
      ref={mapRef}
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
    >
      {/* Base map layers */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Topographic overlay option */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; Esri'
        opacity={0.6}
      />

      {/* Map click handler */}
      <MapClickHandler onMapClick={onMapClick} />

      {/* Active release marker */}
      {activeRelease && (
        <Marker
          position={[activeRelease.latitude, activeRelease.longitude]}
          icon={releaseIcon}
        >
          <Popup>
            <div>
              <h4>{activeRelease.event_name || 'Chemical Release'}</h4>
              <p><strong>Chemical:</strong> {activeRelease.chemical_name}</p>
              <p><strong>State:</strong> {activeRelease.release_state}</p>
              <p><strong>Rate:</strong> {activeRelease.release_rate} kg/s</p>
              <p><strong>Start:</strong> {new Date(activeRelease.release_start).toLocaleString()}</p>
              {activeRelease.is_active ? (
                <span style={{ color: 'green', fontWeight: 'bold' }}>ACTIVE</span>
              ) : (
                <span style={{ color: 'red', fontWeight: 'bold' }}>STOPPED</span>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Dispersion plume */}
      {currentPlume && currentPlume.plume_geometry && (
        <Polygon
          positions={currentPlume.plume_geometry.coordinates[0].map(coord => [coord[1], coord[0]])}
          pathOptions={{
            color: '#dc3545',
            fillColor: '#dc3545',
            fillOpacity: 0.3,
            weight: 2
          }}
        >
          <Popup>
            <div>
              <h4>Dispersion Plume</h4>
              <p><strong>Max Concentration:</strong> {currentPlume.max_concentration?.toFixed(3)} mg/m³</p>
              <p><strong>Downwind Distance:</strong> {(currentPlume.downwind_distance / 1000).toFixed(1)} km</p>
              <p><strong>Wind:</strong> {currentPlume.wind_speed} m/s @ {currentPlume.wind_direction}°</p>
              <p><strong>Calculated:</strong> {new Date(currentPlume.calculation_time).toLocaleString()}</p>
            </div>
          </Popup>
        </Polygon>
      )}

      {/* Receptor markers */}
      {receptors.map(receptor => (
        <Marker
          key={receptor.id}
          position={[receptor.latitude, receptor.longitude]}
          icon={receptorIcon}
        >
          <Popup>
            <div>
              <h4>{receptor.name}</h4>
              <p><strong>Type:</strong> {receptor.receptor_type}</p>
              {receptor.population && (
                <p><strong>Population:</strong> {receptor.population}</p>
              )}
              <p><strong>Coordinates:</strong> {receptor.latitude.toFixed(4)}, {receptor.longitude.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </LeafletMap>
  );
}

export default MapContainer;