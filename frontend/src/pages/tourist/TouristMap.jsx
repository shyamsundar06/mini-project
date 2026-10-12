import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle,
  Compass,
  Navigation,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { locationApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();
  const [tourists, setTourists] = useState([]);
  const myLat = 11.4192;
  const myLng = 76.7115;
  const { lastLocationEvent } = useSocket();

  // Map Verification State (Requires dummy ID and password to access)
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('tourist_map_unlocked') === 'true';
  });
  const [touristId, setTouristId] = useState(() => {
    return sessionStorage.getItem('tourist_active_id') || '';
  });
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleUnlock = (e) => {
    e.preventDefault();
    if (!touristId.trim()) {
      setAuthError('Please enter any Tourist ID');
      return;
    }
    if (!password.trim()) {
      setAuthError('Please enter any Password');
      return;
    }
    sessionStorage.setItem('tourist_map_unlocked', 'true');
    sessionStorage.setItem('tourist_active_id', touristId.trim());
    setIsUnlocked(true);
    setAuthError('');
  };

  const handleLock = () => {
    sessionStorage.removeItem('tourist_map_unlocked');
    setIsUnlocked(false);
    setPassword('');
  };

  useEffect(() => {
    if (!isUnlocked) return;
    async function load() {
      try {
        const res = await locationApi.getLive('tour_ooty_nilgiris');
        if (res.data?.tourists) setTourists(res.data.tourists);
      } catch (e) {
        console.log('Error loading map:', e);
      }
    }
    load();
  }, [lastLocationEvent, isUnlocked]);

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

  // Render Verification Gate if not unlocked
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto h-[calc(100vh-10rem)] flex flex-col justify-center items-center p-2 text-slate-800">
        <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 text-white">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                🔒 GPS Access Verification
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                {t('mapGateTitle')}
              </h2>
            </div>
            <p className="text-xs text-slate-500 leading-snug">
              {t('mapGateSub')}
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3.5 text-xs">
            {authError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-[11px] font-semibold text-center">
                {authError}
              </div>
            )}

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                {t('touristIdLabel')}
              </label>
              <input
                type="text"
                required
                value={touristId}
                onChange={(e) => setTouristId(e.target.value)}
                placeholder={t('touristIdPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">
                {t('passwordLabel')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>

            <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-start space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{t('mapGateHint')}</span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <Unlock className="w-4 h-4" />
              <span>{t('unlockMapBtn')}</span>
            </button>

            {/* 1-Click Quick Demo Fill */}
            <button
              type="button"
              onClick={() => {
                setTouristId('TRT-101');
                setPassword('1234');
                sessionStorage.setItem('tourist_map_unlocked', 'true');
                sessionStorage.setItem('tourist_active_id', 'TRT-101');
                setIsUnlocked(true);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-[11px] transition-all"
            >
              ⚡ Quick 1-Click Demo Fill (TRT-101 / 1234)
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-md mx-auto h-[calc(100vh-10rem)] flex flex-col text-slate-800 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">{t('liveGroupMap')}</h2>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
              ID: {touristId || 'Verified'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{t('gardenZone')}</p>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
            GPS Live
          </span>
          <button
            onClick={handleLock}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            title="Lock Map"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Straying Alert Warning Pill */}
      {isStraying && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-center space-x-2 animate-pulse shadow-sm shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">{t('groupDistAlert')}</p>
            <p className="text-[11px] text-amber-800">
              {distFromGroup}{t('distanceFromGroup')}. {t('rejoinPrompt')}
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
            attribution="&copy; Google Maps"
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
          />

          {/* User's Marker */}
          <Marker position={[myLat, myLng]} icon={createMarkerIcon('#10B981', touristId || 'You')}>
            <Popup>
              <div className="p-1 text-xs">
                <p className="font-bold text-slate-900">{t('yourPosition')}</p>
                <p className="text-slate-600">{touristId || t('groupLeader')}</p>
                <p className="text-[10px] text-slate-400">
                  {distFromGroup > 0 ? `${distFromGroup}m ${t('distanceFromGroup')}` : 'At group centroid'}
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
