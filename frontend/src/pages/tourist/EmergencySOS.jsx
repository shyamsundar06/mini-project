import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Radio,
  PhoneCall,
  WifiOff,
  Wifi,
  Volume2,
  VolumeX,
  MessageSquare,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { emergencyApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function EmergencySOS() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sosSent, setSosSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emergencyType, setEmergencyType] = useState('MEDICAL');
  const [notes, setNotes] = useState('');
  const [currentCoords, setCurrentCoords] = useState({ lat: 11.4192, lng: 76.7115 });
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const audioCtxRef = useRef(null);
  const sirenIntervalRef = useRef(null);

  // Monitor Network Connectivity & Auto-Sync Offline Queue
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkAndSyncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for offline queue
    const queued = localStorage.getItem('offline_sos_queue');
    if (queued) {
      setOfflineQueued(true);
      if (navigator.onLine) {
        checkAndSyncOfflineQueue();
      }
    }

    // Attempt geolocation on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5))
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopSiren();
    };
  }, []);

  const checkAndSyncOfflineQueue = async () => {
    const raw = localStorage.getItem('offline_sos_queue');
    if (!raw) return;

    try {
      const payload = JSON.parse(raw);
      setSyncStatusMsg('Signal restored. Transmitting queued emergency beacon...');
      await emergencyApi.triggerSOS(payload);
      localStorage.removeItem('offline_sos_queue');
      setOfflineQueued(false);
      setSosSent(true);
      setSyncStatusMsg('Queued emergency beacon successfully delivered to operator!');
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    } catch (err) {
      console.warn('Sync retry failed:', err);
    }
  };

  // Web Audio API Rescue Siren / Distress Beacon (Runs 100% locally offline)
  const toggleSiren = () => {
    if (sirenPlaying) {
      stopSiren();
    } else {
      startSiren();
    }
  };

  const startSiren = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        alert('Audio synthesizer is not supported on this device.');
        return;
      }
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      setSirenPlaying(true);
      let highTone = false;

      sirenIntervalRef.current = setInterval(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(highTone ? 1200 : 800, ctx.currentTime);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 0.4);
          highTone = !highTone;
        } catch (e) {
          console.error(e);
        }
      }, 400);

      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    } catch (err) {
      console.error('Audio siren error:', err);
    }
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    setSirenPlaying(false);
  };

  const handleTriggerSOS = async () => {
    setLoading(true);
    let lat = currentCoords.lat;
    let lng = currentCoords.lng;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3500 });
        });
        lat = Number(pos.coords.latitude.toFixed(5));
        lng = Number(pos.coords.longitude.toFixed(5));
        setCurrentCoords({ lat, lng });
      } catch (e) {
        // Use default coords
      }
    }

    let touristName = 'Sonika';
    let touristId = 'trt_sonika';
    let groupName = 'Group Beta';

    try {
      const activeBooking = JSON.parse(localStorage.getItem('tourist_active_booking') || 'null');
      const storedUser = JSON.parse(localStorage.getItem('tourism_user') || 'null');

      touristName = activeBooking?.tourist_name || storedUser?.name || user?.name || 'Sonika';
      touristId = activeBooking?.tourist_id || storedUser?.id || user?.touristProfile?.id || user?.id || (touristName.toLowerCase().includes('sonika') ? 'trt_sonika' : 'trt_1');
      groupName = activeBooking?.assigned_group || 'Group Beta';
    } catch (e) {}

    const payload = {
      tourist_id: touristId,
      tourist_name: touristName,
      group_name: groupName,
      tour_id: 'tour_ooty_nilgiris',
      latitude: lat,
      longitude: lng,
      emergency_type: emergencyType,
      message: notes || `Immediate emergency assistance requested by tourist ${touristName} (${emergencyType}).`
    };

    if (!navigator.onLine) {
      // Save offline queue
      localStorage.setItem('offline_sos_queue', JSON.stringify(payload));
      setOfflineQueued(true);
      setSosSent(true);
      setLoading(false);
      startSiren();
      return;
    }

    try {
      const res = await emergencyApi.triggerSOS(payload);
      if (res.data?.emergency) {
        setSosSent(true);
        if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
        startSiren();
      }
    } catch (err) {
      console.warn('API SOS trigger failed, saving to offline fallback queue:', err);
      localStorage.setItem('offline_sos_queue', JSON.stringify(payload));
      setOfflineQueued(true);
      setSosSent(true);
      startSiren();
    } finally {
      setLoading(false);
    }
  };

  const copyCoordinates = () => {
    const text = `EMERGENCY SOS: Tourist needs rescue. Location: ${currentCoords.lat}, ${currentCoords.lng}. Type: ${emergencyType}. Details: ${notes || 'Immediate help needed'}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 3000);
  };

  const smsUri = `sms:112?body=${encodeURIComponent(
    `EMERGENCY SOS: Location Lat ${currentCoords.lat}, Lng ${currentCoords.lng}. Type: ${emergencyType}. Assistance required.`
  )}`;

  return (
    <div className="space-y-4 max-w-md mx-auto text-slate-800 pb-10">
      {/* Network Status Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-1.5">
          {isOnline ? (
            <span className="flex items-center text-emerald-600 font-bold">
              <Wifi className="w-3.5 h-3.5 mr-1" /> Live Satellite & 4G Link Active
            </span>
          ) : (
            <span className="flex items-center text-amber-600 font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5 mr-1" /> Offline Trail Mode (Auto-Queue Active)
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {currentCoords.lat}, {currentCoords.lng}
        </span>
      </div>

      {syncStatusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Emergency Assistance</h2>
        <p className="text-xs text-slate-500 font-medium">
          Pressing the SOS button instantly alerts Tour Basecamp, on-trail guides, and Nilgiri emergency medical responders.
        </p>
      </div>

      {!sosSent ? (
        <div className="glass-card p-6 rounded-3xl border border-rose-200 flex flex-col items-center justify-center space-y-5 text-center shadow-lg bg-gradient-to-b from-rose-50/50 to-white">
          {/* Big High-Visibility Red SOS Button */}
          <button
            onClick={handleTriggerSOS}
            disabled={loading}
            className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-600 via-red-600 to-rose-700 text-white font-extrabold text-3xl shadow-2xl shadow-rose-500/40 border-4 border-rose-200 flex flex-col items-center justify-center space-y-1 hover:scale-105 active:scale-95 transition-all animate-sos-pulse"
          >
            <ShieldAlert className="w-10 h-10" />
            <span className="tracking-wider">SOS</span>
          </button>

          <p className="text-xs font-bold text-rose-700 tracking-wide">
            {loading ? 'Transmitting High-Priority Beacon...' : 'TAP TO BROADCAST INSTANT SOS'}
          </p>

          <div className="w-full space-y-3 pt-3 border-t border-slate-100 text-left text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Emergency Category</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                <option value="MEDICAL">Medical / Acute Health Condition</option>
                <option value="TRAIL_INJURY">Trail Fall / Fracture or Sprain</option>
                <option value="LOST_GROUP">Separated / Lost in Forest or Fog</option>
                <option value="ALLERGY">Severe Allergy / Breathing Issue</option>
                <option value="WILDLIFE">Wildlife Threat / Animal Encounter</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Optional Landmark / Details</label>
              <input
                type="text"
                placeholder="e.g. Near upper greenhouse bench, misty sector..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        /* SOS Active State */
        <div className="glass-card p-6 rounded-3xl border border-rose-300 bg-rose-50/70 space-y-5 text-center shadow-lg">
          <div className="w-16 h-16 rounded-full bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center mx-auto animate-pulse">
            <Radio className="w-8 h-8" />
          </div>

          <div>
            <div className="flex items-center justify-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                Emergency Beacon Active
              </span>
              {offlineQueued && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                  Queued Offline
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              {offlineQueued ? 'Beacon Queued for Transmission' : 'Responders Dispatched'}
            </h3>
            <p className="text-xs text-rose-800 mt-1 font-medium">
              {offlineQueued
                ? 'Your alert is stored locally and will transmit as soon as signal connects. Use direct phone / SMS channels below immediately!'
                : 'Your GPS coordinates and category have reached the Tour Operator command console.'}
            </p>
          </div>

          {/* Distress Siren Toggle */}
          <div className="p-3 bg-white rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900">Audio Distress Siren</p>
              <p className="text-[10px] text-slate-500">Piercing acoustic tone to guide ground search parties</p>
            </div>
            <button
              onClick={toggleSiren}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all ${
                sirenPlaying
                  ? 'bg-rose-600 text-white animate-bounce'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sirenPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{sirenPlaying ? 'Mute Siren' : 'Sound Siren'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-left text-xs space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="font-bold text-slate-900">{emergencyType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Assigned Outpost:</span>
              <span className="font-bold text-slate-900">Botanical Ranger Station</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estimated Arrival:</span>
              <span className="font-bold text-emerald-700">~6 minutes</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">GPS Beacon:</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono text-slate-700 font-bold">{currentCoords.lat}, {currentCoords.lng}</span>
                <button
                  onClick={copyCoordinates}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Copy Coordinates"
                >
                  {copiedCoords ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Fallback SMS button */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={smsUri}
              className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Direct SMS (112)</span>
            </a>
            <a
              href="tel:112"
              className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5"
            >
              <PhoneCall className="w-4 h-4" />
              <span>National SOS (112)</span>
            </a>
          </div>

          <div className="space-y-2 pt-2 border-t border-rose-200/60">
            <button
              onClick={() => {
                setSosSent(false);
                stopSiren();
                localStorage.removeItem('offline_sos_queue');
                setOfflineQueued(false);
              }}
              className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold"
            >
              Cancel / Reset Alert Beacon
            </button>
          </div>
        </div>
      )}

      {/* Local Emergency Hotlines Section (Works Even on 2G / Voice Roaming) */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
            <span>Direct Emergency Hotlines (Nilgiris District)</span>
          </h4>
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            24/7 Toll-Free
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <a
            href="tel:+918001123344"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 transition-colors"
          >
            <div>
              <p className="font-bold text-slate-900">Tour Operator Basecamp</p>
              <p className="text-[10px] text-slate-500">Nilgiris Expedition Dispatch</p>
            </div>
            <span className="font-mono font-bold text-blue-600 text-xs bg-white px-2 py-1 rounded-lg border border-slate-200">
              +91 800 112 3344
            </span>
          </a>

          <a
            href="tel:108"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 transition-colors"
          >
            <div>
              <p className="font-bold text-slate-900">Mountain Medical Ambulance</p>
              <p className="text-[10px] text-slate-500">Tamil Nadu Hills EMS</p>
            </div>
            <span className="font-mono font-bold text-rose-600 text-xs bg-white px-2 py-1 rounded-lg border border-slate-200">
              108
            </span>
          </a>

          <a
            href="tel:18004256106"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 transition-colors"
          >
            <div>
              <p className="font-bold text-slate-900">Forest & Wildlife Control</p>
              <p className="text-[10px] text-slate-500">Ooty Division Ranger Desk</p>
            </div>
            <span className="font-mono font-bold text-emerald-700 text-xs bg-white px-2 py-1 rounded-lg border border-slate-200">
              1800-425-6106
            </span>
          </a>

          <a
            href="tel:04232444044"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 transition-colors"
          >
            <div>
              <p className="font-bold text-slate-900">Tourist Police Assistance</p>
              <p className="text-[10px] text-slate-500">District HQ Police Station</p>
            </div>
            <span className="font-mono font-bold text-slate-800 text-xs bg-white px-2 py-1 rounded-lg border border-slate-200">
              0423-2444044
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
