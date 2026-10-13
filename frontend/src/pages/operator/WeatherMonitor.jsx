import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  CloudRain,
  CloudFog,
  Zap,
  Sun,
  Wind,
  Droplets,
  Gauge,
  Eye,
  AlertTriangle,
  ShieldAlert,
  Megaphone,
  RotateCcw,
  RefreshCw,
  Search,
  MapPin,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Volume2,
  VolumeX,
  Clock,
  Layers
} from 'lucide-react';
import { weatherApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function WeatherMonitor() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [tourDestinations, setTourDestinations] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState({
    name: 'Ooty Botanical Gardens',
    lat: 11.4190,
    lng: 76.7112
  });
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [broadcastStatus, setBroadcastStatus] = useState(null);
  const [soundAlert, setSoundAlert] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const { connected } = useSocket();

  // Load weather for currently selected place
  const fetchWeather = async (scenario = activeSimulation) => {
    setRefreshing(true);
    try {
      const [liveRes, destsRes] = await Promise.all([
        weatherApi.getLive({
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          place: selectedPlace.name,
          simulate: scenario || undefined
        }),
        weatherApi.getTourDestinations({
          tour_id: 'tour_ooty_nilgiris',
          simulate: scenario || undefined
        })
      ]);

      if (liveRes.data?.telemetry) {
        setTelemetry(liveRes.data.telemetry);
      }
      if (destsRes.data?.destinations) {
        setTourDestinations(destsRes.data.destinations);
      }
    } catch (err) {
      console.error('Error fetching live weather telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather(activeSimulation);
    // Auto refresh every 60 seconds
    const interval = setInterval(() => {
      fetchWeather(activeSimulation);
    }, 60000);
    return () => clearInterval(interval);
  }, [selectedPlace, activeSimulation]);

  // Handle location search with Open-Meteo Geocoding
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await weatherApi.searchPlaces(searchQuery);
      if (res.data?.results) {
        setSearchResults(res.data.results);
      }
    } catch (err) {
      console.error('Search places error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setSelectedPlace({
      name: result.displayName,
      lat: result.latitude,
      lng: result.longitude
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  // Broadcast Weather Alert to Tourists
  const handleBroadcastAlert = async (alert) => {
    setBroadcastStatus('sending');
    try {
      await weatherApi.broadcastAlert({
        tour_id: 'tour_ooty_nilgiris',
        title: alert.title,
        message: `${alert.description} ${alert.suggestedAnnouncement}`,
        priority: alert.level === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        location: alert.location
      });
      setBroadcastStatus('success');
      setTimeout(() => setBroadcastStatus(null), 4000);
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
      setBroadcastStatus('error');
      setTimeout(() => setBroadcastStatus(null), 3000);
    }
  };

  const weatherIcons = {
    Sun: <Sun className="w-8 h-8 text-amber-500 animate-spin-slow" />,
    SunMedium: <Sun className="w-8 h-8 text-amber-500" />,
    CloudSun: <CloudSun className="w-8 h-8 text-blue-500" />,
    Cloud: <CloudSun className="w-8 h-8 text-slate-500" />,
    CloudRain: <CloudRain className="w-8 h-8 text-blue-600 animate-bounce" />,
    CloudDrizzle: <CloudRain className="w-8 h-8 text-cyan-500" />,
    CloudFog: <CloudFog className="w-8 h-8 text-slate-400" />,
    Zap: <Zap className="w-8 h-8 text-amber-500 animate-pulse" />,
    CloudLightning: <Zap className="w-8 h-8 text-amber-500 animate-pulse" />
  };

  const activeAlert = telemetry?.alerts?.find(
    (a) => a.level === 'CRITICAL' || a.level === 'WARNING'
  ) || telemetry?.alerts?.[0];

  const isSevere = activeAlert?.level === 'CRITICAL';
  const isWarning = activeAlert?.level === 'WARNING';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Banner / Tour Context Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold flex items-center gap-1.5 text-blue-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Open-Meteo Free API</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-xs font-semibold text-indigo-100">
                Active Tour: Nilgiris Grand Heritage & Botanical Discovery
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <CloudSun className="w-8 h-8 text-amber-400" />
              <span>Real-Time Weather Monitoring & Safety System</span>
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl">
              Microclimate telemetry for tour destinations with automated hazard alerts,
              rainfall thresholds, high-altitude wind warnings, and instant tourist broadcasts.
            </p>
          </div>

          {/* Action Tools: Refresh & Sound Alert */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSoundAlert(!soundAlert)}
              className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                soundAlert
                  ? 'bg-white/15 border-white/25 text-white hover:bg-white/25'
                  : 'bg-black/20 border-white/10 text-white/60'
              }`}
              title={soundAlert ? 'Alert Chime Active' : 'Alert Chime Muted'}
            >
              {soundAlert ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundAlert ? 'Siren Active' : 'Muted'}</span>
            </button>

            <button
              onClick={() => fetchWeather(activeSimulation)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-900 font-bold text-xs shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{refreshing ? 'Updating Telemetry...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Destination Quick Selector Strip */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-blue-200 mr-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Tour Stops:</span>
          </span>
          {[
            { name: 'Ooty Botanical Gardens', lat: 11.4190, lng: 76.7112 },
            { name: 'Nilgiri Tea Estate & Museum', lat: 11.4230, lng: 76.7320 },
            { name: 'Doddabetta Peak Summit', lat: 11.4010, lng: 76.7350 },
            { name: 'Ooty Boathouse & Lake', lat: 11.4050, lng: 76.6900 }
          ].map((d) => {
            const isSelected = selectedPlace.name.includes(d.name) || selectedPlace.name === d.name;
            return (
              <button
                key={d.name}
                onClick={() => {
                  setSelectedPlace(d);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-white text-blue-900 shadow-md ring-2 ring-blue-300'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                {d.name}
              </button>
            );
          })}

          {/* Search any place input */}
          <div className="relative ml-auto w-full sm:w-auto mt-2 sm:mt-0">
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                placeholder="Search any place / city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 px-3.5 py-1.5 rounded-xl bg-white/10 text-white placeholder-blue-200 text-xs border border-white/20 focus:outline-none focus:bg-white/20"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="ml-1.5 p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute right-0 top-10 w-64 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">Locations Found</div>
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                  >
                    <p className="font-bold text-slate-900">{r.name}</p>
                    <p className="text-[10px] text-slate-500">{r.admin1}, {r.country}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Real-Time Weather Alert Control Center */}
      {activeAlert && (
        <div
          className={`rounded-3xl p-6 border shadow-xl transition-all relative overflow-hidden ${
            isSevere
              ? 'bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white border-rose-500 shadow-rose-500/20 animate-pulse'
              : isWarning
              ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 text-white border-amber-400 shadow-amber-500/20'
              : 'bg-emerald-50 border-emerald-200 text-slate-800'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${
                    isSevere
                      ? 'bg-white text-rose-700'
                      : isWarning
                      ? 'bg-white text-amber-800'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isSevere && <ShieldAlert className="w-4 h-4 animate-bounce" />}
                  {isWarning && <AlertTriangle className="w-4 h-4" />}
                  {!isSevere && !isWarning && <CheckCircle2 className="w-4 h-4" />}
                  <span>{activeAlert.level} ALERT</span>
                </span>
                <span className="text-xs font-semibold opacity-90">
                  Location: <strong>{selectedPlace.name}</strong>
                </span>
              </div>

              <div>
                <h3 className={`text-xl font-black leading-tight ${isSevere || isWarning ? 'text-white' : 'text-slate-900'}`}>
                  {activeAlert.title}
                </h3>
                <p className={`text-xs mt-1 leading-relaxed ${isSevere || isWarning ? 'text-white/90' : 'text-slate-600'}`}>
                  {activeAlert.description}
                </p>
              </div>

              {/* Trigger Details & Actionable AI Advisory */}
              <div className={`p-4 rounded-2xl space-y-2 text-xs border ${
                isSevere || isWarning
                  ? 'bg-black/20 border-white/20 text-white'
                  : 'bg-white border-emerald-200 text-slate-700'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="font-extrabold shrink-0">Meteorological Trigger:</span>
                  <span className="opacity-95">{activeAlert.trigger}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-extrabold shrink-0">Operator Safety Action:</span>
                  <span className="opacity-95">{activeAlert.operatorAction}</span>
                </div>
                {activeAlert.affectedActivities?.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <span className="font-extrabold text-[11px] shrink-0">Affected Itinerary Activities:</span>
                    <div className="flex flex-wrap gap-1">
                      {activeAlert.affectedActivities.map((act) => (
                        <span key={act} className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
                          {act}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Broadcast to Tourist Action */}
            <div className="lg:w-72 shrink-0 flex flex-col justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4" />
                  <span>Tourist Broadcast Center</span>
                </p>
                <p className="text-[11px] text-white/80 mt-1">
                  Deliver instantaneous safety advisories to tourists on their smartphones.
                </p>
              </div>

              <button
                onClick={() => handleBroadcastAlert(activeAlert)}
                disabled={broadcastStatus === 'sending'}
                className={`w-full py-3 px-4 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  broadcastStatus === 'success'
                    ? 'bg-emerald-500 text-white'
                    : isSevere
                    ? 'bg-white text-rose-700 hover:bg-rose-50'
                    : 'bg-white text-amber-900 hover:bg-amber-50'
                }`}
              >
                {broadcastStatus === 'sending' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Broadcasting to Tourists...</span>
                  </>
                ) : broadcastStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Broadcast Sent Live!</span>
                  </>
                ) : (
                  <>
                    <Megaphone className="w-4 h-4" />
                    <span>Broadcast Alert to Tourists</span>
                  </>
                )}
              </button>

              <div className="text-[10px] text-center text-white/70">
                Connected tourists via WebSocket & Push notifications
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Meteorological Dashboard */}
      {telemetry && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Primary Weather Card (Left Column) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider border border-blue-200">
                  Current Telemetry
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">{selectedPlace.name}</h2>
                <p className="text-xs text-slate-500">
                  Coordinates: {telemetry.latitude.toFixed(4)}° N, {telemetry.longitude.toFixed(4)}° E
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 shadow-xs">
                {weatherIcons[telemetry.current.icon] || <CloudSun className="w-8 h-8 text-blue-600" />}
              </div>
            </div>

            {/* Giant Temperature & Condition */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                  {telemetry.current.temperature.toFixed(1)}°
                </span>
                <span className="text-xl font-bold text-slate-400">C</span>
              </div>
              <p className="text-base font-extrabold text-blue-700">{telemetry.current.condition}</p>
              <p className="text-xs text-slate-500">
                Feels like <strong>{telemetry.current.apparentTemperature.toFixed(1)}°C</strong> with{' '}
                <strong>{telemetry.current.cloudCover}%</strong> cloud cover
              </p>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rain Probability</span>
                </div>
                <p className="text-lg font-black text-slate-900">{telemetry.current.rainProbability}%</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      telemetry.current.rainProbability >= 60 ? 'bg-rose-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${telemetry.current.rainProbability}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                  <Wind className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Wind & Gusts</span>
                </div>
                <p className="text-lg font-black text-slate-900">
                  {telemetry.current.windSpeed} <span className="text-xs font-normal text-slate-500">km/h</span>
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  Gusts up to {telemetry.current.windGusts} km/h
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                  <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Relative Humidity</span>
                </div>
                <p className="text-lg font-black text-slate-900">{telemetry.current.humidity}%</p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {telemetry.current.humidity > 85 ? 'High Mist / Damp' : 'Normal Moisture'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-bold">
                  <Gauge className="w-3.5 h-3.5 text-amber-600" />
                  <span>Air Pressure</span>
                </div>
                <p className="text-lg font-black text-slate-900">
                  {telemetry.current.pressure} <span className="text-xs font-normal text-slate-500">hPa</span>
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">High Mountain Elevation</p>
              </div>
            </div>

            {/* Test Simulation Controls */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Scenario Simulation Lab</span>
                </span>
                {activeSimulation && (
                  <button
                    onClick={() => {
                      setActiveSimulation(null);
                      fetchWeather(null);
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Reset to Real API
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'CLEAR', label: '☀️ Clear Skies', desc: 'Optimal sightseeing' },
                  { id: 'HEAVY_RAIN', label: '🌧️ Downpour', desc: 'Triggers rain alert' },
                  { id: 'THUNDERSTORM', label: '⚡ Thunderstorm', desc: 'Critical SOS alert' },
                  { id: 'FOG', label: '🌫️ Dense Fog', desc: 'Low visibility alert' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSimulation(s.id);
                      fetchWeather(s.id);
                    }}
                    className={`p-2 rounded-xl text-left border text-[11px] font-bold transition-all ${
                      activeSimulation === s.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div>{s.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Destination Weather Comparison Radar (Center & Right Column) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tour Route Radar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Tour Route Microclimate Radar</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live weather status across every scheduled destination in the Nilgiris tour
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {tourDestinations.length} Monitored Stops
                </span>
              </div>

              {/* Destination Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tourDestinations.map((d) => {
                  const isSelected = selectedPlace.name === d.name;
                  const dAlert = d.highestAlert;
                  const isBad = dAlert?.level === 'CRITICAL' || dAlert?.level === 'WARNING';
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedPlace({ name: d.name, lat: d.latitude, lng: d.longitude })}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <h4 className="font-extrabold text-sm text-slate-900">{d.name}</h4>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{d.current?.condition || 'Clear'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-slate-900">
                            {d.current?.temperature?.toFixed(1) || 18}°C
                          </span>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            {d.current?.rainProbability || 15}% Rain
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span
                          className={`font-extrabold px-2 py-0.5 rounded-full ${
                            isBad
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isBad ? `⚠️ ${dAlert.level} ALERT` : '✅ Safe Conditions'}
                        </span>
                        <span className="text-blue-600 font-bold flex items-center gap-0.5">
                          <span>Inspect</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 24-Hour Hourly Weather Trend */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>24-Hour Hourly Progression</span>
                  </h3>
                  <p className="text-xs text-slate-500">Upcoming weather shifts for {selectedPlace.name}</p>
                </div>
              </div>

              {/* Scrollable Hourly Strip */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {telemetry.hourly.slice(0, 14).map((h, i) => (
                  <div
                    key={h.time || i}
                    className="flex flex-col items-center justify-between min-w-[72px] p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1.5 shrink-0"
                  >
                    <span className="text-[11px] font-bold text-slate-500">{h.hour}</span>
                    <div className="p-1.5 rounded-xl bg-white shadow-xs">
                      {weatherIcons[h.icon] || <CloudSun className="w-5 h-5 text-blue-500" />}
                    </div>
                    <span className="text-sm font-black text-slate-900">{Math.round(h.temperature)}°</span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        h.rainProb >= 50
                          ? 'bg-rose-100 text-rose-700'
                          : h.rainProb >= 25
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {h.rainProb}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Weather Outlook */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    <span>7-Day Environmental Forecast</span>
                  </h3>
                  <p className="text-xs text-slate-500">Extended tour planning outlook</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {telemetry.daily.map((d, i) => (
                  <div
                    key={d.date || i}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-between text-center space-y-1.5"
                  >
                    <span className="text-xs font-black text-slate-700">{d.dayName}</span>
                    <div className="p-1 rounded-lg">
                      {weatherIcons[d.icon] || <CloudSun className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900">{Math.round(d.maxTemp)}°</span>
                      <span className="text-[10px] text-slate-400 ml-1">{Math.round(d.minTemp)}°</span>
                    </div>
                    <span className="text-[10px] text-blue-600 font-bold">{d.rainProb}% Rain</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
