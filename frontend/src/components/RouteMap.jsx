import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default leaflet marker icon issue in Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Known Sri Lankan location coordinates database
const SRI_LANKA_COORDS = {
  colombo: [6.9271, 79.8612],
  kandy: [7.2906, 80.6337],
  galle: [6.0535, 80.2210],
  kuliyapitiya: [7.4689, 80.0401],
  kurunegala: [7.4863, 80.3623],
  'nuwara eliya': [6.9497, 80.7891],
  jaffna: [9.6615, 80.0255],
  negombo: [7.2008, 79.8737],
  anuradhapura: [8.3114, 80.4037],
  matara: [5.9549, 80.5550],
  badulla: [6.9934, 81.0550],
  kegalle: [7.2513, 80.3464],
  kadawatha: [7.0016, 79.9507],
  nittambuwa: [7.1439, 80.0970],
  panadura: [6.7106, 79.9074],
  kalutara: [6.5854, 79.9607],
  bentota: [6.4259, 79.9972],
  gampola: [7.1648, 80.5692],
  ramboda: [7.0494, 80.6975],
  dambulla: [7.8731, 80.6517],
  trincomalee: [8.5874, 81.2152],
  batticaloa: [7.7310, 81.6747]
};

// Custom Bus Icon for Live Simulation
const busIcon = L.divIcon({
  className: 'live-bus-marker',
  html: `<div style="
    background-color: #2563eb;
    color: white;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 15px rgba(37, 99, 235, 0.8);
    border: 2px solid white;
  ">🚌</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17]
});

// Simple deterministic hash for stable coordinate offsets
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const getCoords = (cityName, fallbackLat = 7.8731, fallbackLng = 80.7718) => {
  if (!cityName) return [fallbackLat, fallbackLng];
  const normalized = cityName.trim().toLowerCase();
  if (SRI_LANKA_COORDS[normalized]) return SRI_LANKA_COORDS[normalized];
  // Deterministic offset based on city name hash (stable across re-renders)
  const hash = hashCode(normalized);
  const latOffset = ((hash & 0xFF) / 255) * 0.1 - 0.05;
  const lngOffset = (((hash >> 8) & 0xFF) / 255) * 0.1 - 0.05;
  return [fallbackLat + latOffset, fallbackLng + lngOffset];
};

export default function RouteMap({ route }) {
  const [busPosIndex, setBusPosIndex] = React.useState(0);
  const [progress, setProgress] = React.useState(0);

  // Animated bus position interpolation
  React.useEffect(() => {
    if (!route) return;
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 1) return 0;
        return prevProgress + 0.02;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [route]);

  if (!route) {
    return (
      <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-medium">
        Select a route to view visual map
      </div>
    );
  }

  const startCoords = getCoords(route.startPoint, 6.9271, 79.8612);
  const endCoords = getCoords(route.endPoint, 7.2906, 80.6337);

  // Generate intermediate stop coordinates
  const stopsList = Array.isArray(route.stops) ? route.stops : [];
  const stopWaypoints = stopsList.map(stopName => ({
    name: stopName,
    coords: getCoords(stopName, (startCoords[0] + endCoords[0]) / 2, (startCoords[1] + endCoords[1]) / 2)
  }));

  // Complete polyline path: Start -> Stops -> End
  const polylinePath = [
    startCoords,
    ...stopWaypoints.map(s => s.coords),
    endCoords
  ];

  // Calculate current interpolated position along full polyline path
  const totalSegments = polylinePath.length - 1;
  const segmentProgress = progress * totalSegments;
  const currentSegment = Math.min(Math.floor(segmentProgress), totalSegments - 1);
  const subProgress = segmentProgress - currentSegment;

  const p1 = polylinePath[currentSegment];
  const p2 = polylinePath[currentSegment + 1] || p1;
  const currentBusPos = [
    p1[0] + (p2[0] - p1[0]) * subProgress,
    p1[1] + (p2[1] - p1[1]) * subProgress
  ];

  // Map center
  const centerLat = (startCoords[0] + endCoords[0]) / 2;
  const centerLng = (startCoords[1] + endCoords[1]) / 2;

  return (
    <div className="w-full h-80 rounded-xl overflow-hidden shadow-md border border-slate-200 relative z-0">
      
      {/* Live Badge */}
      <div className="absolute top-3 right-3 z-[1000] bg-blue-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border border-white/20 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>LIVE GPS SIMULATION</span>
      </div>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={8}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Start Point Marker */}
        <Marker position={startCoords}>
          <Popup>
            <div className="font-sans">
              <strong className="text-emerald-700">🚩 Start: {route.startPoint}</strong>
              <p className="text-xs text-slate-600 m-0">Distance: {route.distance} km</p>
            </div>
          </Popup>
        </Marker>

        {/* Intermediate Stop Markers */}
        {stopWaypoints.map((stop, idx) => (
          <Marker key={idx} position={stop.coords}>
            <Popup>
              <div className="font-sans text-xs">
                <strong className="text-blue-600">🛑 Stop #{idx + 1}: {stop.name}</strong>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* End Point Marker */}
        <Marker position={endCoords}>
          <Popup>
            <div className="font-sans">
              <strong className="text-rose-700">🏁 Destination: {route.endPoint}</strong>
            </div>
          </Popup>
        </Marker>

        {/* Animated Moving Bus Marker */}
        <Marker position={currentBusPos} icon={busIcon}>
          <Popup>
            <div className="font-sans text-xs font-bold text-blue-700">
              🚌 Active Bus on Route ({Math.round(progress * 100)}% completed)
            </div>
          </Popup>
        </Marker>

        {/* Connecting Route Line */}
        <Polyline positions={polylinePath} color="#2563eb" weight={4} opacity={0.8} dashArray="5, 10" />
      </MapContainer>
    </div>
  );
}
