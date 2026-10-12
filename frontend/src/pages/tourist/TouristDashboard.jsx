import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Compass,
  Clock,
  MapPin,
  Mic,
  ShieldAlert,
  Sparkles,
  PhoneCall,
  Megaphone,
  CheckCircle2,
  CalendarDays,
  CheckCircle,
  CloudSun,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';
import TouristFeedbackModal from '../../components/TouristFeedbackModal';
import { useAuth } from '../../context/AuthContext';
import { itineraryApi, broadcastApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';

export default function TouristDashboard() {
  const { user } = useAuth();
  const { t, translateAnnouncement, translateActivity } = useLanguage();
  const [itineraryItem, setItineraryItem] = useState(null);
  const [allItineraryItems, setAllItineraryItems] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [ackedIds, setAckedIds] = useState(new Set());
  const [checkedActivities, setCheckedActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('tourist_checked_activities');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [showFullSchedule, setShowFullSchedule] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [touristInfo, setTouristInfo] = useState({
    name: 'Rahul Kumar',
    groupName: 'Group Alpha (Nature Trekkers)',
    groupId: 'grp_alpha',
    leaderName: 'Rahul Kumar',
    leaderPhone: '+91 98451 12345',
    walkingPreference: 'Fast',
    preferredLanguage: 'Hindi'
  });

  const { lastItineraryEvent, lastBroadcastEvent } = useSocket();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [itinRes, bcRes] = await Promise.all([
        itineraryApi.get('tour_ooty_nilgiris', 1),
        broadcastApi.getAll('tour_ooty_nilgiris', touristInfo.groupId)
      ]);

      if (itinRes.data?.itinerary?.items) {
        const items = itinRes.data.itinerary.items;
        setAllItineraryItems(items);
        const next =
          items.find((i) => i.status === 'SCHEDULED' || i.status === 'REPLACED') || items[1];
        setItineraryItem(next);
      }

      if (bcRes.data?.broadcasts) {
        setBroadcasts(bcRes.data.broadcasts);
      }
    } catch (e) {
      console.log('Error loading tourist dashboard:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [lastItineraryEvent, lastBroadcastEvent]);

  const handleAcknowledge = async (broadcastId) => {
    try {
      await broadcastApi.acknowledge(broadcastId, {
        tourist_id: user?.id || 'trt_1',
        tourist_name: user?.name || 'Rahul Kumar'
      });
      setAckedIds((prev) => new Set([...prev, broadcastId]));
    } catch (e) {
      console.error('Ack error:', e);
    }
  };

  const handleToggleCheckin = (itemId) => {
    const isNowChecked = !checkedActivities[itemId];
    const updated = { ...checkedActivities, [itemId]: isNowChecked };
    setCheckedActivities(updated);
    try {
      localStorage.setItem('tourist_checked_activities', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    if (isNowChecked) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch (err) {
        // Fallback gracefully
      }
    }
  };

  const completedCount = Object.values(checkedActivities).filter(Boolean).length;
  const totalCount = allItineraryItems.length || 4;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const latestAlert = broadcasts[0];
  const translatedLatestAlert = latestAlert ? translateAnnouncement(latestAlert.title, latestAlert.message) : null;

  return (
    <div className="space-y-4 max-w-md mx-auto text-slate-800 pb-12 animate-in fade-in duration-200">
      {/* High-Visibility Live Broadcast Banner if high priority */}
      {latestAlert &&
        (latestAlert.priority === 'HIGH' || latestAlert.priority === 'EMERGENCY') &&
        !ackedIds.has(latestAlert.id) && (
          <div className="p-4 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xl space-y-2 animate-bounce">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-white" />
                <span className="text-xs font-black uppercase tracking-wider">
                  {latestAlert.priority === 'EMERGENCY'
                    ? t('urgentSafetyAlert')
                    : t('liveAnnouncement')}
                </span>
              </div>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-bold">
                {new Date(latestAlert.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <h4 className="font-bold text-sm leading-tight">{translatedLatestAlert.title}</h4>
            <p className="text-xs text-white/95 leading-relaxed">{translatedLatestAlert.message}</p>
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => handleAcknowledge(latestAlert.id)}
                className="px-3 py-1.5 bg-white text-slate-900 font-extrabold text-xs rounded-xl shadow-md flex items-center space-x-1.5 hover:bg-slate-100 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('understoodSafe')}</span>
              </button>
            </div>
          </div>
        )}

      {/* Welcome & Tour Card */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 space-y-3 shadow-sm bg-white">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
            {t('activeTour')}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">{t('dayOf')}</span>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            {t('tourTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{t('tourDestination')}</p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            {t('welcome')} <strong>{user?.name || 'Rahul Kumar'}</strong>
          </span>
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {t('checkedIn')}
          </span>
        </div>
      </div>

      {/* My Group Card */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('myGroup')}</h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            {t('compatibility')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">{t('groupNameAlpha')}</h4>
            <p className="text-[11px] text-slate-500 font-medium">
              {t('groupLead')}
            </p>
          </div>
          <a
            href={`tel:${touristInfo.leaderPhone}`}
            className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
          >
            <PhoneCall className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Announcements & Instructions Feed */}
      <div className="glass-card p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t('guideAnnouncements')}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-semibold">{broadcasts.length} {t('total')}</span>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {broadcasts.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">{t('noAnnouncements')}</p>
          ) : (
            broadcasts.map((bc) => {
              const isAcked = ackedIds.has(bc.id);
              const transBc = translateAnnouncement(bc.title, bc.message);
              return (
                <div
                  key={bc.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{transBc.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(bc.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{transBc.message}</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                    <span className="text-slate-400">{bc.sender_name}</span>
                    <button
                      onClick={() => handleAcknowledge(bc.id)}
                      disabled={isAcked}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        isAcked
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {isAcked ? t('acknowledged') : t('confirmReceipt')}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Complete Interactive Itinerary Timeline & Self Check-in */}
      <div className="glass-card p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {t('todaySchedule')}
            </h3>
          </div>
          <button
            onClick={() => setShowFullSchedule(!showFullSchedule)}
            className="text-xs font-bold text-blue-600 flex items-center space-x-1"
          >
            <span>{showFullSchedule ? t('collapse') : t('expand')}</span>
            {showFullSchedule ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{t('activityProgress')}</span>
            <span>
              {completedCount} of {totalCount} {t('completed')} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {showFullSchedule && (
          <div className="space-y-3 pt-2">
            {allItineraryItems.map((item, idx) => {
              const isChecked = !!checkedActivities[item.id];
              const transAct = translateActivity(item.title, item.description, idx);
              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 relative ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-slate-50/90 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold">
                        {item.start_time}
                      </span>
                      {item.is_alternative ? (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold">
                          {t('alternativeRoute')}
                        </span>
                      ) : null}
                    </div>

                    {/* Self Check-in Checkbox Button */}
                    <button
                      onClick={() => handleToggleCheckin(item.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center space-x-1 transition-all ${
                        isChecked
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isChecked ? t('checkinComplete') : t('markDone')}</span>
                    </button>
                  </div>

                  <div>
                    <h4
                      className={`font-bold text-sm ${
                        isChecked ? 'text-emerald-950 line-through opacity-80' : 'text-slate-900'
                      }`}
                    >
                      {transAct.title}
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{transAct.desc}</p>
                  </div>

                  <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] pt-1 border-t border-slate-100">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.location_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tour Experience Feedback Card */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white rounded-3xl border border-amber-200/80 shadow-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5">
            <span className="flex text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
              Expedition Review
            </span>
          </div>
          <p className="text-xs font-extrabold text-slate-900">How was your expedition today?</p>
          <p className="text-[10px] text-slate-500">Rate guide service, trail safety, and botanical vistas</p>
        </div>
        <button
          onClick={() => setShowFeedbackModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/25 shrink-0 transition-transform hover:scale-105 active:scale-95"
        >
          Review Tour
        </button>
      </div>

      {/* Quick Interactive Actions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => navigate('/tourist/voice')}
          className="p-4 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center space-y-1.5 shadow-md shadow-blue-500/25 hover:scale-[1.02] transition-all"
        >
          <Mic className="w-6 h-6" />
          <span className="text-xs font-bold">Ask AI Voice Guide</span>
          <span className="text-[10px] text-blue-100">6 Languages</span>
        </button>

        <button
          onClick={() => navigate('/tourist/sos')}
          className="p-4 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex flex-col items-center justify-center space-y-1.5 shadow-md shadow-rose-500/25 hover:scale-[1.02] transition-all animate-pulse"
        >
          <ShieldAlert className="w-6 h-6" />
          <span className="text-xs font-bold">Emergency SOS</span>
          <span className="text-[10px] text-rose-100">Instant Help</span>
        </button>
      </div>

      {/* Feedback Modal */}
      <TouristFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userName={touristInfo.name}
        groupName={touristInfo.groupName}
        onSubmitted={() => {
          // Can refresh or show confetti
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
        }}
      />
    </div>
  );
}
