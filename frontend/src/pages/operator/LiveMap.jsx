import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  Tooltip,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Users,
  AlertTriangle,
  Radio,
  Search,
  Play,
  Pause,
  Compass,
  Layers,
  Crosshair,
  RefreshCw,
  Navigation,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Eye
} from 'lucide-react';
import { locationApi, simulationApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Tourist Marker with Initials & Pulse Ring
const createTouristIcon = (colorHex = '#3B82F6', isEmergency = false, initial = 'T') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        ${
          isEmergency
            ? `<div style="position: absolute; width: 48px; height: 48px; border-radius: 9999px; background: rgba(239, 68, 68, 0.45); animation: pulse-ring 1.3s infinite;"></div>`
            : ''
        }
        <div style="
          width: 30px; 
          height: 30px; 
          border-radius: 9999px; 
          background-color: ${isEmergency ? '#DC2626' : colorHex}; 
          border: 2.5px solid #FFFFFF; 
          box-shadow: 0 4px 14px rgba(0,0,0,0.35); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #FFFFFF; 
          font-weight: 800; 
          font-size: 11px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: transform 0.2s;
        ">
          ${initial}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });
};

// Custom Operator Marker (for physical browser geolocation)
const createOperatorIcon = () => {
  return L.divIcon({
    className: 'operator-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: rgba(59, 130, 246, 0.35); animation: pulse-ring 2s infinite;"></div>
        <div style="
          width: 32px; 
          height: 32px; 
          border-radius: 9999px; 
          background: linear-gradient(135deg, #1d4ed8, #2563eb); 
          border: 3px solid #FFFFFF; 
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #FFFFFF; 
          font-weight: 900; 
          font-size: 13px;
        ">
          HQ
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
};

// Landmark Point Icon
const createLandmarkIcon = (type = 'Hub') => {
  const bg = type === 'Mountain Peak' ? '#dc2626' : type === 'Indoor Factory' ? '#d97706' : '#2563eb';
  return L.divIcon({
    className: 'landmark-marker',
    html: `
      <div style="
        background: ${bg};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.25);
        font-size: 10px;
        font-weight: 800;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        📍 ${type}
      </div>
    `,
    iconSize: [90, 24],
    iconAnchor: [45, 12],
    popupAnchor: [0, -14]
  });
};

function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 15, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map Tile Providers (High Availability, Free & Global CDN)
const MAP_TILES = {
  streets: {
    name: 'Google Streets',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  },
  satellite: {
    name: 'Satellite View',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  },
  terrain: {
    name: 'Terrain View',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: ['a', 'b', 'c'],
    attribution: '&copy; OpenStreetMap contributors'
  }
};

// Planned Nilgiri Botanical Tour Waypoints & Path
const TOUR_LANDMARKS = [
  { name: 'Ooty Botanical Gardens Hub', lat: 11.4190, lng: 76.7112, type: 'Garden Hub', desc: 'Main assembly point, check-in zone & lower lawn.' },
  { name: 'Italian Terraced Gardens', lat: 11.4196, lng: 76.7118, type: 'Scenic View', desc: 'Historic 1884 octagonal floral terraces.' },
  { name: 'Fern House & Toda Arboretum', lat: 11.4215, lng: 76.7132, type: 'Heritage', desc: 'Ancient 20-million-year-old fossil tree & Toda hut.' },
  { name: 'Tea Plantation Trailhead', lat: 11.4225, lng: 76.7200, type: 'Trail', desc: 'Pine forest & tea estate mountain approach.' },
  { name: 'Nilgiri Tea Museum & Factory', lat: 11.4230, lng: 76.7320, type: 'Indoor Factory', desc: 'Covered factory tour, tea tasting & chocolate masterclass.' },
  { name: 'Doddabetta Summit Observatory', lat: 11.4010, lng: 76.7350, type: 'Mountain Peak', desc: 'Highest peak in Nilgiris (2,637m) with telescope house.' },
  { name: 'Ooty Lake Boathouse', lat: 11.4050, lng: 76.6900, type: 'Waterfront', desc: 'Scenic eucalyptus grove & pedal boat jetty.' }
];

const TOUR_PATH_COORDINATES = [
  [11.4190, 76.7112],
  [11.4196, 76.7118],
  [11.4205, 76.7125],
  [11.4215, 76.7132],
  [11.4225, 76.7200],
  [11.4230, 76.7320],
  [11.4120, 76.7335],
  [11.4010, 76.7350],
  [11.4050, 76.6900]
];

export default function LiveMap() {
  const [tourists, setTourists] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [mapCenter, setMapCenter] = useState([11.4190, 76.7112]);
  const [mapZoom, setMapZoom] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [tileTheme, setTileTheme] = useState('streets');
  const [showBreadcrumbs, setShowBreadcrumbs] = useState(true);
  const [showTourRoute, setShowTourRoute] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [showRainRadar, setShowRainRadar] = useState(false);

  // Real-time tracking history (breadcrumbs)
  const [trails, setTrails] = useState({});

  // Browser Geolocation
  const [userLocation, setUserLocation] = useState(null);
  const [isTrackingUser, setIsTrackingUser] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Live Auto-Walking Simulation
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [streamSpeedMs, setStreamSpeedMs] = useState(4000);
  const [streamCount, setStreamCount] = useState(0);
  const [lastTelemetryTime, setLastTelemetryTime] = useState(new Date());

  const autoStreamTimerRef = useRef(null);
  const { lastLocationEvent, activeEmergency, connected } = useSocket();

  // Fetch live coordinates from backend
  const fetchLiveLocations = async () => {
    try {
      const res = await locationApi.getLive('tour_ooty_nilgiris');
      if (res.data?.tourists) {
        setTourists(res.data.tourists);
        setLastTelemetryTime(new Date());

        // Update breadcrumb trails for each tourist
        setTrails((prevTrails) => {
          const updated = { ...prevTrails };
          res.data.tourists.forEach((t) => {
            const lat = Number(t.current_latitude);
            const lng = Number(t.current_longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              const currentHistory = updated[t.id] || [];
              const lastPoint = currentHistory[currentHistory.length - 1];
              // Avoid duplicate adjacent coordinates
              if (!lastPoint || lastPoint[0] !== lat || lastPoint[1] !== lng) {
                updated[t.id] = [...currentHistory.slice(-14), [lat, lng]];
              }
            }
          });
          return updated;
        });
      }
      if (res.data?.emergencies) {
        setEmergencies(res.data.emergencies);
      }
    } catch (err) {
      console.error('Error fetching live map coordinates:', err);
    }
  };

  useEffect(() => {
    fetchLiveLocations();
  }, [lastLocationEvent, activeEmergency]);

  // Center on emergency if one is triggered
  useEffect(() => {
    if (activeEmergency && activeEmergency.latitude) {
      setMapCenter([activeEmergency.latitude, activeEmergency.longitude]);
      setMapZoom(17);
    }
  }, [activeEmergency]);

  // Auto-streaming GPS loop
  useEffect(() => {
    if (isLiveStreaming) {
      autoStreamTimerRef.current = setInterval(async () => {
        try {
          await simulationApi.gpsStep();
          setStreamCount((prev) => prev + 1);
          await fetchLiveLocations();
        } catch (e) {
          console.error('[LiveMap] GPS stream tick error:', e.message);
        }
      }, streamSpeedMs);
    } else {
      if (autoStreamTimerRef.current) clearInterval(autoStreamTimerRef.current);
    }

    return () => {
      if (autoStreamTimerRef.current) clearInterval(autoStreamTimerRef.current);
    };
  }, [isLiveStreaming, streamSpeedMs]);

  // Browser device geolocation watcher
  const toggleUserGeolocation = () => {
    if (isTrackingUser) {
      setIsTrackingUser(false);
      setUserLocation(null);
      return;
    }

    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoError(null);
    setIsTrackingUser(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation({
          coords,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading
        });
        setMapCenter(coords);
        setMapZoom(16);
      },
      (err) => {
        console.warn('Geolocation warning:', err.message);
        setGeoError(err.message || 'Unable to access your physical GPS.');
        setIsTrackingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleStepOnce = async () => {
    try {
      await simulationApi.gpsStep();
      setStreamCount((prev) => prev + 1);
      await fetchLiveLocations();
    } catch (e) {
      console.error('GPS step error:', e);
    }
  };

  // Haversine distance in meters
  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Calculate cluster center for active group
  const getGroupCentroid = (groupId) => {
    const groupMembers = tourists.filter((t) => t.group_id === groupId);
    if (!groupMembers.length) return null;
    const avgLat = groupMembers.reduce((sum, t) => sum + (Number(t.current_latitude) || 0), 0) / groupMembers.length;
    const avgLng = groupMembers.reduce((sum, t) => sum + (Number(t.current_longitude) || 0), 0) / groupMembers.length;
    return [avgLat, avgLng];
  };

  const alphaCentroid = getGroupCentroid('grp_alpha');
  const betaCentroid = getGroupCentroid('grp_beta');
  const gammaCentroid = getGroupCentroid('grp_gamma');

  // Annotate tourists with stray status (> 250m from group center)
  const annotatedTourists = tourists.map((t) => {
    const centroid =
      t.group_id === 'grp_alpha'
        ? alphaCentroid
        : t.group_id === 'grp_beta'
        ? betaCentroid
        : gammaCentroid;

    const lat = Number(t.current_latitude) || 11.4190;
    const lng = Number(t.current_longitude) || 76.7112;
    const distFromCentroid = centroid ? calculateDistanceMeters(lat, lng, centroid[0], centroid[1]) : 0;
    const isStraying = distFromCentroid > 250;

    return {
      ...t,
      distFromCentroid,
      isStraying,
      groupCentroid: centroid
    };
  });

  const strayingTourists = annotatedTourists.filter((t) => t.isStraying);

  const filteredTourists = annotatedTourists.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup =
      selectedGroup === 'ALL'
        ? true
        : selectedGroup === 'SOS'
        ? t.status === 'EMERGENCY' || (activeEmergency && activeEmergency.tourist_id === t.id)
        : selectedGroup === 'STRAY'
        ? t.isStraying
        : t.group_id === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto text-slate-800">
      {/* Main Map Container */}
      <div className="flex-1 rounded-3xl overflow-hidden glass-panel border border-slate-200 relative z-10 shadow-lg flex flex-col">
        {/* Real-Time Live Map Top Control Bar */}
        <div className="bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 z-20">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xs font-extrabold text-slate-900 tracking-tight">
                {connected ? 'LIVE TELEMETRY ACTIVE' : 'RECONNECTING'}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Last Ping: {lastTelemetryTime.toLocaleTimeString()}
            </span>
            {streamCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                Step #{streamCount}
              </span>
            )}
          </div>

          {/* Interactive Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Live Walking Simulation Stream Toggle */}
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm ${
                isLiveStreaming
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title="Automatically stream simulated GPS coordinates in real-time"
            >
              {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLiveStreaming ? 'Pause GPS Stream' : 'Start Live GPS Walk'}</span>
            </button>

            {/* Single Step GPS */}
            <button
              onClick={handleStepOnce}
              disabled={isLiveStreaming}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 flex items-center space-x-1 border border-slate-200 transition-all"
              title="Advance tourist GPS position by one step"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Step</span>
            </button>

            {/* Device Real GPS */}
            <button
              onClick={toggleUserGeolocation}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border transition-all ${
                isTrackingUser
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Track your actual physical device location on the map"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden md:inline">{isTrackingUser ? 'My GPS On' : 'My Device GPS'}</span>
            </button>

            {/* Recenter Tour Hub */}
            <button
              onClick={() => {
                setMapCenter([11.4190, 76.7112]);
                setMapZoom(15);
                setSelectedTourist(null);
              }}
              className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all shadow-xs"
              title="Center on Ooty Botanical Hub"
            >
              <Crosshair className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="flex-1 relative w-full h-full">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <MapRecenter center={mapCenter} zoom={mapZoom} />

            {/* Dynamic Tile Layer */}
            <TileLayer
              key={tileTheme}
              attribution={MAP_TILES[tileTheme]?.attribution || '&copy; Google Maps'}
              url={MAP_TILES[tileTheme]?.url || MAP_TILES.streets.url}
              subdomains={MAP_TILES[tileTheme]?.subdomains || ['mt0', 'mt1', 'mt2', 'mt3']}
              maxZoom={20}
            />

            {/* Live Weather Rain Radar Overlay */}
            {showRainRadar && (
              <TileLayer
                attribution='&copy; RainViewer'
                url="https://tilecache.rainviewer.com/v2/radar/nowcast_0/256/{z}/{x}/{y}/2/1_1.png"
                opacity={0.65}
                zIndex={100}
              />
            )}

            {/* Planned Tour Route Polyline */}
            {showTourRoute && (
              <Polyline
                positions={TOUR_PATH_COORDINATES}
                pathOptions={{
                  color: '#2563EB',
                  weight: 4,
                  opacity: 0.75,
                  dashArray: '8, 8',
                  lineJoin: 'round'
                }}
              />
            )}

            {/* Planned Tour Landmarks */}
            {TOUR_LANDMARKS.map((lm, idx) => (
              <React.Fragment key={`lm_${idx}`}>
                <Marker position={[lm.lat, lm.lng]} icon={createLandmarkIcon(lm.type)}>
                  <Popup>
                    <div className="p-2 space-y-1 text-xs min-w-[200px]">
                      <h4 className="font-bold text-slate-900 text-sm">{lm.name}</h4>
                      <p className="text-slate-600 leading-snug">{lm.desc}</p>
                      <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                        <span>Waypoint #{idx + 1}</span>
                        <span>{lm.lat.toFixed(4)}, {lm.lng.toFixed(4)}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[lm.lat, lm.lng]}
                  radius={180}
                  pathOptions={{
                    color: lm.type === 'Mountain Peak' ? '#ef4444' : '#3b82f6',
                    fillColor: lm.type === 'Mountain Peak' ? '#f87171' : '#60a5fa',
                    fillOpacity: 0.1,
                    dashArray: '4, 6'
                  }}
                />
              </React.Fragment>
            ))}

            {/* Group Geofence Centroid Envelopes */}
            {showGeofences && (
              <>
                {alphaCentroid && (
                  <Circle
                    center={alphaCentroid}
                    radius={280}
                    pathOptions={{
                      color: '#10B981',
                      fillColor: '#10B981',
                      fillOpacity: 0.08,
                      dashArray: '6, 6'
                    }}
                  >
                    <Tooltip permanent direction="top" opacity={0.85}>
                      <span className="font-bold text-[10px] text-emerald-800">Alpha Trekkers Zone</span>
                    </Tooltip>
                  </Circle>
                )}
                {betaCentroid && (
                  <Circle
                    center={betaCentroid}
                    radius={300}
                    pathOptions={{
                      color: '#3B82F6',
                      fillColor: '#3B82F6',
                      fillOpacity: 0.08,
                      dashArray: '6, 6'
                    }}
                  >
                    <Tooltip permanent direction="top" opacity={0.85}>
                      <span className="font-bold text-[10px] text-blue-800">Beta Heritage Zone</span>
                    </Tooltip>
                  </Circle>
                )}
                {gammaCentroid && (
                  <Circle
                    center={gammaCentroid}
                    radius={260}
                    pathOptions={{
                      color: '#F59E0B',
                      fillColor: '#F59E0B',
                      fillOpacity: 0.08,
                      dashArray: '6, 6'
                    }}
                  >
                    <Tooltip permanent direction="top" opacity={0.85}>
                      <span className="font-bold text-[10px] text-amber-800">Gamma Leisure Zone</span>
                    </Tooltip>
                  </Circle>
                )}
              </>
            )}

            {/* Straying Tourists Return Vectors to Centroid */}
            {annotatedTourists
              .filter((t) => t.isStraying)
              .map((t) => {
                const lat = Number(t.current_latitude) || 11.4190;
                const lng = Number(t.current_longitude) || 76.7112;
                if (!t.groupCentroid) return null;
                return (
                  <Polyline
                    key={`stray_vector_${t.id}`}
                    positions={[[lat, lng], t.groupCentroid]}
                    pathOptions={{
                      color: '#f59e0b',
                      weight: 2,
                      dashArray: '6, 6',
                      opacity: 0.85
                    }}
                  />
                );
              })}

            {/* Movement Breadcrumb Trails */}
            {showBreadcrumbs &&
              filteredTourists.map((t) => {
                const touristTrail = trails[t.id];
                if (!touristTrail || touristTrail.length < 2) return null;
                const isFocused = selectedTourist?.id === t.id;
                return (
                  <Polyline
                    key={`trail_${t.id}`}
                    positions={touristTrail}
                    pathOptions={{
                      color: t.group_color || '#3B82F6',
                      weight: isFocused ? 4 : 2,
                      opacity: isFocused ? 0.9 : 0.45,
                      dashArray: isFocused ? '0' : '4, 4'
                    }}
                  />
                );
              })}

            {/* Physical Device Operator Marker */}
            {userLocation && (
              <>
                <Marker position={userLocation.coords} icon={createOperatorIcon()}>
                  <Popup>
                    <div className="p-2 space-y-1 text-xs">
                      <h4 className="font-bold text-blue-700">Your Current Device Location</h4>
                      <p className="text-slate-600">Operator Command Beacon</p>
                      <p className="text-[10px] text-slate-400">
                        GPS Accuracy: ±{Math.round(userLocation.accuracy || 10)}m
                      </p>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={userLocation.coords}
                  radius={userLocation.accuracy || 40}
                  pathOptions={{
                    color: '#3B82F6',
                    fillColor: '#3B82F6',
                    fillOpacity: 0.15
                  }}
                />
              </>
            )}

            {/* Live Tourist Markers */}
            {filteredTourists.map((t) => {
              const isEmg =
                t.status === 'EMERGENCY' || (activeEmergency && activeEmergency.tourist_id === t.id);
              const lat = Number(t.current_latitude) || 11.4190;
              const lng = Number(t.current_longitude) || 76.7112;

              return (
                <Marker
                  key={t.id}
                  position={[lat, lng]}
                  icon={createTouristIcon(t.group_color || '#3B82F6', isEmg, t.name.charAt(0))}
                  eventHandlers={{
                    click: () => setSelectedTourist(t)
                  }}
                >
                  <Popup>
                    <div className="p-2.5 space-y-2 text-xs min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                          <span className="text-[10px] text-slate-400">{t.age} yrs • {t.preferred_language}</span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `${t.group_color || '#3B82F6'}15`,
                            color: t.group_color || '#2563EB'
                          }}
                        >
                          {t.group_name || 'Group'}
                        </span>
                      </div>

                      <div className="space-y-1 text-slate-600 text-[11px]">
                        <p><strong>Pace:</strong> {t.walking_preference}</p>
                        <p><strong>Style:</strong> {t.activity_preference}</p>
                        <p><strong>GPS:</strong> {lat.toFixed(5)}, {lng.toFixed(5)}</p>
                        <p className="text-[10px] text-slate-400">
                          Telemetry: {new Date(t.last_location_time || Date.now()).toLocaleTimeString()}
                        </p>
                      </div>

                      {isEmg && (
                        <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 text-rose-700 font-bold text-[11px] animate-pulse text-center">
                          🚨 ACTIVE SOS ALERT TRIGGERED
                        </div>
                      )}

                      <div className="pt-1 flex gap-2">
                        <button
                          onClick={() => {
                            setMapCenter([lat, lng]);
                            setMapZoom(17);
                            setSelectedTourist(t);
                          }}
                          className="flex-1 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[10px] transition-all"
                        >
                          Lock & Focus
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Map HUD Layer Selector & Layers Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end space-y-2">
            {/* Tile Layer Selector */}
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-xl flex items-center space-x-1 text-xs">
              {Object.keys(MAP_TILES).map((key) => (
                <button
                  key={key}
                  onClick={() => setTileTheme(key)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    tileTheme === key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {MAP_TILES[key].name}
                </button>
              ))}
            </div>

            {/* Overlays Toggle Pill */}
            <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xl flex items-center space-x-3 text-[11px] text-slate-700">
              <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={showTourRoute}
                  onChange={(e) => setShowTourRoute(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Tour Route</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={showBreadcrumbs}
                  onChange={(e) => setShowBreadcrumbs(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Live Trails</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={showGeofences}
                  onChange={(e) => setShowGeofences(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Zones</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-sky-700">
                <input
                  type="checkbox"
                  checked={showRainRadar}
                  onChange={(e) => setShowRainRadar(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-0"
                />
                <span>Rain Radar</span>
              </label>
            </div>
          </div>

          {/* Floating Active Emergency Banner */}
          {activeEmergency && (
            <div className="absolute top-4 left-4 z-20 bg-rose-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 animate-bounce">
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              <div>
                <p className="text-xs font-black uppercase tracking-wider">High Priority SOS Active</p>
                <p className="text-[11px] opacity-90">{activeEmergency.tourist_name || 'Tourist'} reported incident</p>
              </div>
              <button
                onClick={() => {
                  if (activeEmergency.latitude) {
                    setMapCenter([activeEmergency.latitude, activeEmergency.longitude]);
                    setMapZoom(17);
                  }
                }}
                className="px-2.5 py-1 bg-white text-rose-700 font-extrabold text-[10px] rounded-lg shadow-sm"
              >
                Track Now
              </button>
            </div>
          )}

          {/* Floating Map Legend */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 text-xs shadow-xl space-y-2">
            <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Live Groups & Waypoints</h4>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
                <span className="text-slate-700 font-semibold">Alpha Trekkers</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs" />
                <span className="text-slate-700 font-semibold">Beta Heritage</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
                <span className="text-slate-700 font-semibold">Gamma Leisure</span>
              </span>
              <span className="flex items-center space-x-1.5 border-l border-slate-200 pl-2">
                <span className="w-3 h-1 bg-blue-600" />
                <span className="text-slate-600 font-medium">Planned Trail</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Live Tourist Telemetry Feed */}
      <div className="w-full lg:w-80 glass-panel rounded-3xl p-4 border border-slate-200 flex flex-col justify-between overflow-hidden shrink-0 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900">Live Tourist Telemetry</h3>
            </div>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
              {filteredTourists.length} tracked
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Group Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto text-[10px] pb-1">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                selectedGroup === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedGroup('grp_alpha')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                selectedGroup === 'grp_alpha' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Alpha
            </button>
            <button
              onClick={() => setSelectedGroup('grp_beta')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                selectedGroup === 'grp_beta' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Beta
            </button>
            <button
              onClick={() => setSelectedGroup('grp_gamma')}
              className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                selectedGroup === 'grp_gamma' ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Gamma
            </button>
            {emergencies.length > 0 && (
              <button
                onClick={() => setSelectedGroup('SOS')}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                  selectedGroup === 'SOS' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                SOS ({emergencies.length})
              </button>
            )}
            {strayingTourists.length > 0 && (
              <button
                onClick={() => setSelectedGroup('STRAY')}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all ${
                  selectedGroup === 'STRAY'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Straying ({strayingTourists.length})
              </button>
            )}
          </div>

          {/* Tourist List */}
          <div className="space-y-1.5 max-h-[calc(100vh-25rem)] overflow-y-auto pr-1">
            {filteredTourists.map((t) => {
              const isEmg =
                t.status === 'EMERGENCY' || (activeEmergency && activeEmergency.tourist_id === t.id);
              const isSelected = selectedTourist?.id === t.id;
              const lat = Number(t.current_latitude) || 11.4190;
              const lng = Number(t.current_longitude) || 76.7112;

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setMapCenter([lat, lng]);
                    setMapZoom(17);
                    setSelectedTourist(t);
                  }}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    isEmg
                      ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse font-bold'
                      : t.isStraying
                      ? 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-xs'
                      : isSelected
                      ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: t.group_color || '#3B82F6' }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {t.group_name || 'Group'} • {t.walking_preference}
                      </p>
                      {t.isStraying && (
                        <span className="inline-block mt-0.5 text-[9px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          ⚠️ {t.distFromCentroid}m stray
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono font-medium block">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {new Date(t.last_location_time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Tourist Inspector Card */}
        {selectedTourist ? (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5 mt-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-blue-900">{selectedTourist.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                {selectedTourist.group_name}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-0.5">
              <p>Language: {selectedTourist.preferred_language}</p>
              <p>Activity: {selectedTourist.activity_preference}</p>
              <p>Trail Points: {trails[selectedTourist.id]?.length || 1} logged</p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-500 mt-2">
            Click any tourist card or marker to track their breadcrumb movement in real-time.
          </div>
        )}
      </div>
    </div>
  );
}
