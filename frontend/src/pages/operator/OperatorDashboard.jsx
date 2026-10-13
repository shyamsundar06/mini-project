import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Users,
  Layers,
  MapPin,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  CloudSun,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  Radio,
  Play,
  Pause,
  RefreshCw,
  Maximize2,
  X
} from 'lucide-react';
import {
  tourApi,
  touristApi,
  groupApi,
  itineraryApi,
  aiApi,
  emergencyApi,
  analyticsApi,
  locationApi,
  simulationApi
} from '../../services/api';
import { useSocket } from '../../context/SocketContext';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createMiniIcon = (color = '#3B82F6', initial = 'T', isEmg = false) => {
  return L.divIcon({
    className: 'custom-mini-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px;">
        ${
          isEmg
            ? `<div style="position: absolute; width: 40px; height: 40px; border-radius: 9999px; background: rgba(239, 68, 68, 0.45); animation: pulse-ring 1.3s infinite;"></div>`
            : ''
        }
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: ${isEmg ? '#dc2626' : color};
          border: 2px solid #ffffff;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 10px;
        ">
          ${initial}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16]
  });
};

function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 15, { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function OperatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalTourists: 15,
    activeGroups: 3,
    activeTours: 1,
    activeEmergencies: 0,
    aiRecommendations: 1,
    estimatedRevenue: 191000
  });
  const [groups, setGroups] = useState([]);
  const [itineraryItems, setItineraryItems] = useState([]);
  const [latestRecommendation, setLatestRecommendation] = useState(null);
  const [weatherInfo, setWeatherInfo] = useState({
    temp: 19.5,
    condition: 'Partly Cloudy / Mountain Mist',
    rainProb: 15,
    wind: 12
  });

  // Real-Time Mini Map State
  const [liveTourists, setLiveTourists] = useState([]);
  const [isSimulatingGps, setIsSimulatingGps] = useState(false);
  const simTimerRef = useRef(null);

  const [newBookingAlert, setNewBookingAlert] = useState(null);

  const { activeEmergency, lastAIEvent, lastItineraryEvent, lastLocationEvent, lastBookingEvent, connected } = useSocket();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, groupsRes, itinRes, recsRes, locRes] = await Promise.all([
        analyticsApi.get('tour_ooty_nilgiris'),
        groupApi.getAll('tour_ooty_nilgiris'),
        itineraryApi.get('tour_ooty_nilgiris', 1),
        aiApi.getRecommendations('tour_ooty_nilgiris'),
        locationApi.getLive('tour_ooty_nilgiris')
      ]);

      if (analyticsRes.data?.summary) {
        let clientCount = 0;
        try {
          const ct = JSON.parse(localStorage.getItem('tourism_client_added_tourists') || '[]');
          clientCount = ct.length;
        } catch (e) {}
        const serverTotal = analyticsRes.data.summary.totalTourists || 15;
        setSummary((prev) => ({
          ...prev,
          totalTourists: Math.max(serverTotal, 15 + clientCount),
          activeGroups: analyticsRes.data.summary.activeGroups,
          activeEmergencies: analyticsRes.data.summary.activeEmergencies,
          estimatedRevenue: analyticsRes.data.summary.totalTourRevenue
        }));
      }

      if (groupsRes.data?.groups) {
        setGroups(groupsRes.data.groups);
      }

      if (itinRes.data?.itinerary?.items) {
        setItineraryItems(itinRes.data.itinerary.items);
      }

      if (recsRes.data?.recommendations?.length > 0) {
        setLatestRecommendation(recsRes.data.recommendations[0]);
      }

      if (locRes.data?.tourists) {
        setLiveTourists(locRes.data.tourists);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lastBookingEvent) {
      setNewBookingAlert(lastBookingEvent);
      // Auto-refresh data and bump count
      fetchData();
    }
  }, [lastBookingEvent]);

  useEffect(() => {
    fetchData();
  }, [activeEmergency, lastAIEvent, lastItineraryEvent, lastLocationEvent, lastBookingEvent]);

  // GPS Simulation in Dashboard
  useEffect(() => {
    if (isSimulatingGps) {
      simTimerRef.current = setInterval(async () => {
        try {
          await simulationApi.gpsStep();
          const locRes = await locationApi.getLive('tour_ooty_nilgiris');
          if (locRes.data?.tourists) setLiveTourists(locRes.data.tourists);
        } catch (e) {
          console.error('Dashboard GPS step error:', e);
        }
      }, 4000);
    } else {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    }
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [isSimulatingGps]);

  const handleStepOnce = async () => {
    try {
      await simulationApi.gpsStep();
      const locRes = await locationApi.getLive('tour_ooty_nilgiris');
      if (locRes.data?.tourists) setLiveTourists(locRes.data.tourists);
    } catch (e) {
      console.error('Step error:', e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              Live Operations Control
            </span>
            <span className="text-slate-500 text-xs">• Ooty Botanical & Heritage Tour</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 text-slate-900 tracking-tight">
            Intelligent Tour Command Center
          </h2>
          <p className="text-slate-600 text-xs mt-1">
            Real-time multi-agent telemetry, live GPS synchronization, and adaptive group management.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/operator/live-map')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all"
          >
            <MapPin className="w-4 h-4" />
            <span>Open Full Live Map</span>
          </button>
          <button
            onClick={() => navigate('/operator/ai-intelligence')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold flex items-center space-x-2 transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Insights</span>
          </button>
        </div>
      </div>

      {/* Real-Time Tourist Booking Alert Banner */}
      {newBookingAlert && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-xl shadow-emerald-500/10 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg shadow-inner">
              🎉
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Real-Time Booking Confirmed
                </span>
                <span className="text-[11px] text-white/80">
                  Just now ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
              <h4 className="font-bold text-sm mt-0.5">
                <span className="underline decoration-white/40 font-extrabold">
                  {newBookingAlert.tourist_name || newBookingAlert.touristName || 'Tourist'}
                </span> has booked{' '}
                <span className="font-extrabold">
                  "{newBookingAlert.package_title || newBookingAlert.packageTitle || 'Nilgiris Heritage Tour'}"
                </span> ({newBookingAlert.duration || '3 Days / 4 Nights'})
              </h4>
              <p className="text-xs text-white/90">
                Pace: {newBookingAlert.preferences?.walking_preference || newBookingAlert.walkingPreference || 'Standard'} • Language: {newBookingAlert.language || 'English'} • Auto-assigned to <strong className="text-white font-extrabold">{newBookingAlert.assigned_group || newBookingAlert.groupName || 'Active Group'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setNewBookingAlert(null)}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all ml-4"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tourists */}
        <div
          onClick={() => navigate('/operator/tourists')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tourists</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">{summary.totalTourists}</p>
            <span className="text-[11px] text-emerald-600 font-bold">100% Active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">15 checked-in (5 per group across 3 groups)</p>
        </div>

        {/* Active Groups */}
        <div
          onClick={() => navigate('/operator/tourists')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Groups</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">{summary.activeGroups}</p>
            <span className="text-[11px] text-emerald-600 font-bold">92% Avg Fit</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Alpha, Beta, Gamma clusters</p>
        </div>

        {/* Active Emergencies */}
        <div
          onClick={() => navigate('/operator/emergencies')}
          className={`p-5 rounded-2xl cursor-pointer border transition-all ${
            activeEmergency || summary.activeEmergencies > 0
              ? 'bg-rose-50 border-rose-300 shadow-md'
              : 'glass-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Emergencies</span>
            <div
              className={`p-2 rounded-xl ${
                activeEmergency ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">
              {activeEmergency ? '1 ACTIVE' : summary.activeEmergencies}
            </p>
            <span
              className={`text-[11px] font-bold ${
                activeEmergency ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {activeEmergency ? 'Critical' : 'All Clear'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {activeEmergency ? 'Rescue team dispatched' : '0 unresolved incidents'}
          </p>
        </div>

        {/* Tour Revenue & Budget */}
        <div
          onClick={() => navigate('/operator/cost-estimator')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Est. Tour Revenue</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900">₹{summary.estimatedRevenue?.toLocaleString()}</p>
            <span className="text-[11px] text-purple-600 font-bold">₹11.9k / pax</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">₹25,000 emergency reserve intact</p>
        </div>
      </div>

      {/* Real-Time Live Map Radar Section */}
      <div className="glass-card p-6 rounded-3xl space-y-4 border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-extrabold text-slate-900">Real-Time Live GPS Radar</h3>
                <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{connected ? 'Sync Connected' : 'Syncing'}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Tracking 16 tourists across Alpha, Beta, & Gamma clusters along Nilgiri botanical trails
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSimulatingGps(!isSimulatingGps)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs ${
                isSimulatingGps
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isSimulatingGps ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulatingGps ? 'Pause GPS' : 'Live Walk Stream'}</span>
            </button>

            <button
              onClick={handleStepOnce}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1 border border-slate-200 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Step</span>
            </button>

            <button
              onClick={() => navigate('/operator/live-map')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center space-x-1.5 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen Map</span>
            </button>
          </div>
        </div>

        {/* Embedded Live Leaflet Map */}
        <div className="h-72 w-full rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner isolate z-0">
          <MapContainer
            center={[11.4190, 76.7112]}
            zoom={15}
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <MapRecenter center={[11.4190, 76.7112]} zoom={15} />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Hub landmark circles */}
            <Circle
              center={[11.4190, 76.7112]}
              radius={220}
              pathOptions={{
                color: '#2563eb',
                fillColor: '#3b82f6',
                fillOpacity: 0.12,
                dashArray: '4, 8'
              }}
            />

            {/* Tourist markers */}
            {liveTourists.map((t) => {
              const isEmg =
                t.status === 'EMERGENCY' || (activeEmergency && activeEmergency.tourist_id === t.id);
              const lat = Number(t.current_latitude) || 11.4190;
              const lng = Number(t.current_longitude) || 76.7112;

              return (
                <Marker
                  key={t.id}
                  position={[lat, lng]}
                  icon={createMiniIcon(t.group_color || '#3B82F6', t.name.charAt(0), isEmg)}
                >
                  <Popup>
                    <div className="p-1.5 space-y-1 text-xs">
                      <p className="font-bold text-slate-900">{t.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {t.group_name || 'Group'} • {t.walking_preference} pace
                      </p>
                      <p className="text-[10px] text-slate-400">
                        GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Quick HUD badge */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] font-bold text-slate-700 shadow-md flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>16 Tourists Synced on Live Map</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Weather Telemetry & AI Recommendation Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Weather & Route Telemetry Card */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <CloudSun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Environmental Telemetry</h3>
                <p className="text-[11px] text-slate-500">Open-Meteo & Geoapify Feed</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Live Feed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500">Temperature</span>
              <p className="text-lg font-bold text-slate-900 mt-0.5">{weatherInfo.temp}°C</p>
              <p className="text-[10px] text-slate-400">Nilgiri Highlands</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500">Rain Probability</span>
              <p className="text-lg font-bold text-sky-600 mt-0.5">{weatherInfo.rainProb}%</p>
              <p className="text-[10px] text-slate-400">Spike predicted 14:00</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Ghat Road Status:</span>
              <span className="text-emerald-700 font-bold">Clear / Dry</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Weather Condition:</span>
              <span className="text-slate-800 font-medium">{weatherInfo.condition}</span>
            </div>
          </div>
        </div>

        {/* AI Intelligence Spotlight */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4 border-indigo-200 relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">AI Multi-Agent Coordinator</h3>
                <p className="text-[11px] text-indigo-700 font-medium">Weather + Route + Group + Itinerary Synthesis</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold">
              95% Confidence
            </span>
          </div>

          {latestRecommendation ? (
            <div className="space-y-3 pt-1">
              <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-white p-3.5 rounded-2xl border border-indigo-100 shadow-xs">
                "{latestRecommendation.recommendation_text}"
              </p>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong className="text-indigo-700">Rationale:</strong> {latestRecommendation.reason}
                </p>
                {latestRecommendation.suggested_alternative && (
                  <p>
                    <strong className="text-emerald-700">Suggested Alternative:</strong>{' '}
                    {latestRecommendation.suggested_alternative}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => navigate('/operator/ai-intelligence')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/20 transition-all"
                >
                  Review in AI Dashboard
                </button>
                <button
                  onClick={() => navigate('/operator/itinerary')}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all shadow-xs"
                >
                  View Itinerary Timeline
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              All multi-agent telemetry optimal. No pending interventions required.
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Group Overview & Itinerary Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Adaptive Micro-Groups Cards */}
        <div className="glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active Micro-Groups</h3>
            <button
              onClick={() => navigate('/operator/tourists')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-0.5"
            >
              <span>Manage</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {groups.map((grp) => (
              <div
                key={grp.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: grp.color_hex || '#3B82F6' }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{grp.name}</h4>
                      <p className="text-[10px] text-slate-500">
                        {grp.size || grp.members?.length || 5} members • Pace: {grp.walking_preference}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    {grp.compatibility_score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Itinerary Timeline */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Today's Dynamic Timeline</h3>
            </div>
            <button
              onClick={() => navigate('/operator/itinerary')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-0.5"
            >
              <span>Full Schedule</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {itineraryItems.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200"
              >
                <div className="flex flex-col items-center shrink-0 w-12 text-center pt-0.5">
                  <span className="text-xs font-bold text-blue-600">{item.start_time}</span>
                  <span className="text-[10px] text-slate-400">{item.end_time}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                    {item.is_alternative ? (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold">
                        AI Reroute
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{item.location_name}</p>
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    item.status === 'COMPLETED'
                      ? 'bg-slate-200 text-slate-600'
                      : item.status === 'IN_PROGRESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {item.status || 'SCHEDULED'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
