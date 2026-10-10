import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CloudRain
} from 'lucide-react';
import { itineraryApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function DynamicItinerary() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adapting, setAdapting] = useState(false);
  const { lastItineraryEvent } = useSocket();

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      const res = await itineraryApi.get('tour_ooty_nilgiris', 1);
      if (res.data?.itinerary) {
        setItinerary(res.data.itinerary);
      }
    } catch (err) {
      console.error('Error loading itinerary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItinerary();
  }, [lastItineraryEvent]);

  const handleApplyAIAdaptation = async () => {
    try {
      setAdapting(true);
      await itineraryApi.applyAIAdaptation({ tour_id: 'tour_ooty_nilgiris' });
      fetchItinerary();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdapting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              Dynamic Timeline Engine
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 text-slate-900 tracking-tight">
            {itinerary?.title || 'Day 1: Flora, Mountain Mist & Nilgiri Aromas'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Weather-aware schedule optimizer with instant automated fallback activity rerouting.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleApplyAIAdaptation}
            disabled={adapting}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{adapting ? 'Applying AI Adaptation...' : 'Apply AI Weather Reroute'}</span>
          </button>
        </div>
      </div>

      {/* Weather Alert Notice */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-900 shadow-xs">
        <CloudRain className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800">Weather Agent Advisory</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Heavy rainfall (75% probability, 14mm/h) predicted at high altitudes around 2:00 PM – 4:30 PM. The AI
            Coordinator has pre-calculated an indoor alternative to Doddabetta Peak (Tea Museum Multimedia Cinema &
            Artisan Chocolate Tasting).
          </p>
        </div>
      </div>

      {/* Timeline Items */}
      <div className="space-y-4 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-slate-200">
        {itinerary?.items?.map((item) => {
          const isAdapted = item.is_alternative;
          return (
            <div key={item.id} className="relative flex items-start space-x-4 group">
              {/* Timeline Node Icon */}
              <div
                className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 z-10 border shadow-xs ${
                  item.status === 'COMPLETED'
                    ? 'bg-slate-100 border-slate-200 text-slate-500'
                    : item.status === 'IN_PROGRESS'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 animate-pulse'
                    : isAdapted
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-200 text-blue-600'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span className="text-[11px] font-bold mt-1">{item.start_time}</span>
              </div>

              {/* Timeline Card */}
              <div
                className={`flex-1 p-5 rounded-3xl border transition-all ${
                  isAdapted
                    ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                    : 'glass-card'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    {isAdapted && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Weather-Proof Alternative</span>
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                      item.status === 'COMPLETED'
                        ? 'bg-slate-100 text-slate-600'
                        : item.status === 'IN_PROGRESS'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : isAdapted
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {item.status || 'SCHEDULED'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2">{item.description}</p>

                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.location_name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: {item.start_time} - {item.end_time}</span>
                  </div>
                </div>

                {item.weather_alert && (
                  <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center space-x-2 font-medium">
                    <CloudRain className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.weather_alert}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
