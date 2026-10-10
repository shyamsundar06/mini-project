import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, Compass, Navigation } from 'lucide-react';
import { locationApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

// Custom Marker
const createMarkerIcon = (colorHex = '#3B82F6', label = 'You') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background: ${colorHex}30; animation: pulse-ring 2s infinite;"></div>
        <div style="
          width: 30px; 
          height: 30px; 
          border-radius: 9999px; 
          background-color: ${colorHex}; 
          border: 2.5px solid #FFFFFF; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: #FFFFFF; 
          font-weight: 800; 
          font-size: 11px;
        ">
          ${label.charAt(0)}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });
};

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
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
}

export default function TouristMap() {
  const [tourists, setTourists] = useState([]);
  const myLat = 11.4192;
  const myLng = 76.7115;
  const { lastLocationEvent } = useSocket();

  useEffect(() => {
    async function load() {
      try {
        const res = await locationApi.getLive('tour_ooty_nilgiris');
        if (res.data?.tourists) setTourists(res.data.tourists);
      } catch (e) {
        console.log('Error loading map:', e);
      }
    }
    load();
  }, [lastLocationEvent]);

  // Calculate Group Alpha center
  const alphaMembers = tourists.filter((t) => t.group_id === 'grp_alpha' && t.id !== 'trt_1');
  let alphaCentroid = null;
  let distFromGroup = 0;

  if (alphaMembers.length > 0) {
    const avgLat = alphaMembers.reduce((sum, t) => sum + (Number(t.current_latitude) || 0), 0) / alphaMembers.length;
    const avgLng = alphaMembers.reduce((sum, t) => sum + (Number(t.current_longitude) || 0), 0) / alphaMembers.length;
    alphaCentroid = [avgLat, avgLng];
    distFromGroup = calculateDistanceMeters(myLat, myLng, avgLat, avgLng);
  }

  const isStraying = distFromGroup > 250;

  return (
    <div className="space-y-3 max-w-md mx-auto h-[calc(100vh-10rem)] flex flex-col text-slate-800">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-900">Live Group Map</h2>
          <p className="text-[11px] text-slate-500 font-medium">Ooty Botanical Gardens Zone</p>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
          GPS Live (5m)
        </span>
      </div>

      {/* Straying Alert Warning Pill */}
      {isStraying && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center space-x-2 animate-pulse shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">Group Distance Alert</p>
            <p className="text-[11px] text-amber-800">
              You are {distFromGroup}m away from Group Alpha center. Follow the dashed line to rejoin.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 rounded-3xl overflow-hidden glass-panel border border-slate-200 relative z-10 shadow-md">
        <MapContainer
          center={[myLat, myLng]}
          zoom={16}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User's Marker */}
          <Marker position={[myLat, myLng]} icon={createMarkerIcon('#10B981', 'You')}>
            <Popup>
              <div className="p-1 text-xs">
                <p className="font-bold text-slate-900">Your Current Position</p>
                <p className="text-slate-600">Group Alpha Leader</p>
                <p className="text-[10px] text-slate-400">
                  {distFromGroup > 0 ? `${distFromGroup}m from group center` : 'At group centroid'}
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Group Alpha Zone Circle */}
          {alphaCentroid && (
            <Circle
              center={alphaCentroid}
              radius={220}
              pathOptions={{
                color: '#10B981',
                fillColor: '#10B981',
                fillOpacity: 0.1,
                dashArray: '4, 4'
              }}
            />
          )}

          {/* Return Guidance Line if straying */}
          {alphaCentroid && (
            <Polyline
              positions={[[myLat, myLng], alphaCentroid]}
              pathOptions={{
                color: isStraying ? '#f59e0b' : '#10b981',
                weight: 2,
                dashArray: '6, 6',
                opacity: 0.8
              }}
            />
          )}

          {/* Group Members Markers */}
          {tourists.map((t) => {
            if (t.id === 'trt_1') return null;
            const lat = Number(t.current_latitude) || 11.4190;
            const lng = Number(t.current_longitude) || 76.7112;
            return (
              <Marker
                key={t.id}
                position={[lat, lng]}
                icon={createMarkerIcon(t.group_color || '#3B82F6', t.name)}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-slate-500 text-[10px]">{t.group_name || 'Group'}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
