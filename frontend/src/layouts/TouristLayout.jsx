import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  Mic,
  MapPin,
  ShieldAlert,
  Home,
  Globe,
  Check,
  Sparkles,
  UserCheck,
  CalendarCheck,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import TouristBookingWizard from '../components/TouristBookingWizard';

export default function TouristLayout() {
  const { user, switchRoleDemo } = useAuth();
  const { lang, setLang, t, hasChosenLang, currentLanguageObj } = useLanguage();
  const { lastDeletedEvent } = useSocket();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  const navigate = useNavigate();

  const handleRestartLogin = () => {
    try {
      localStorage.removeItem('tourist_active_booking');
      localStorage.removeItem('tourism_user');
      localStorage.removeItem('tourism_token');
      setActiveBooking(null);
      setShowBookingWizard(true);
      window.dispatchEvent(new Event('tourist_booking_updated'));
    } catch (e) {}
  };

  useEffect(() => {
    const syncLayoutBooking = () => {
      try {
        const DATA_VERSION = 'v5_tourist_login_restart';
        if (localStorage.getItem('tourism_data_version') !== DATA_VERSION) {
          localStorage.setItem('tourism_data_version', DATA_VERSION);
          localStorage.removeItem('tourist_active_booking');
          localStorage.removeItem('tourism_client_added_tourists');
          localStorage.removeItem('tourism_deleted_tourist_names');
          localStorage.removeItem('tourism_deleted_tourist_ids');
          localStorage.removeItem('tourism_user');
          localStorage.removeItem('tourism_token');
          setActiveBooking(null);
          setShowBookingWizard(true);
          return;
        }

        const storedBooking = localStorage.getItem('tourist_active_booking');
        if (storedBooking) {
          setActiveBooking(JSON.parse(storedBooking));
        } else {
          setActiveBooking(null);
          setShowBookingWizard(true);
        }
      } catch (e) {}
    };

    syncLayoutBooking();
    const handleOpenWizard = () => setShowBookingWizard(true);
    window.addEventListener('storage', syncLayoutBooking);
    window.addEventListener('tourist_booking_updated', syncLayoutBooking);
    window.addEventListener('open_booking_wizard', handleOpenWizard);
    return () => {
      window.removeEventListener('storage', syncLayoutBooking);
      window.removeEventListener('tourist_booking_updated', syncLayoutBooking);
      window.removeEventListener('open_booking_wizard', handleOpenWizard);
    };
  }, []);

  useEffect(() => {
    if (lastDeletedEvent) {
      try {
        const stored = localStorage.getItem('tourist_active_booking');
        if (stored) {
          const parsed = JSON.parse(stored);
          const delName = (lastDeletedEvent.name || '').toLowerCase().trim();
          const delId = lastDeletedEvent.id;
          const bkName = (parsed.tourist_name || '').toLowerCase().trim();
          const bkId = parsed.tourist_id || parsed.touristId || parsed.id;

          if (
            (delName && (delName === bkName || delName === (user?.name || '').toLowerCase().trim())) ||
            (delId && (delId === bkId || delId === user?.id))
          ) {
            localStorage.removeItem('tourist_active_booking');
            setActiveBooking(null);
            window.dispatchEvent(new Event('tourist_booking_updated'));
          }
        }
      } catch (e) {}
    }
  }, [lastDeletedEvent, user]);

  const touristTabs = [
    { to: '/tourist', icon: Home, label: t('tabHome'), end: true },
    { to: '/tourist/voice', icon: Mic, label: t('tabVoice') },
    { to: '/tourist/map', icon: MapPin, label: t('tabMap') },
    { to: '/tourist/sos', icon: ShieldAlert, label: t('tabSOS'), isDanger: true }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-200 relative">
      {/* Language Selection Modal (Appears before they enter or on language click) */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 text-white">
                <Globe className="w-6 h-6 animate-spin-slow" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {t('welcomeSelectLang')}
              </h3>
              <p className="text-xs text-slate-500 leading-snug">
                {t('welcomeSub')}
              </p>
            </div>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                    lang === l.code
                      ? 'bg-blue-50 border-blue-500 shadow-sm text-blue-900 ring-2 ring-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="text-base mr-1.5">{l.flag}</span>
                    <span className="font-extrabold text-xs">{l.native}</span>
                    <p className="text-[10px] text-slate-400 font-medium">{l.name}</p>
                  </div>
                  {lang === l.code && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLangModal(false)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('enterApp')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tourist Booking & Onboarding Wizard */}
      <TouristBookingWizard
        isOpen={showBookingWizard}
        onClose={() => setShowBookingWizard(false)}
        onBookingSuccess={(booking) => {
          setActiveBooking(booking);
          setShowBookingWizard(false);
          try {
            window.dispatchEvent(new Event('tourist_booking_updated'));
          } catch (e) {}
        }}
      />

      {/* Tourist App Top Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 p-3.5 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-slate-900">{t('appTitle')}</h1>
              <div className="flex items-center space-x-1">
                <span className="text-[11px] text-blue-600 font-semibold">{t('tourSubtitle')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Restart Login Button */}
            <button
              onClick={handleRestartLogin}
              className="px-2 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-bold flex items-center space-x-1 transition-all"
              title="Restart from Login Page"
            >
              <RotateCcw className="w-3 h-3 text-amber-600" />
              <span>Restart</span>
            </button>

            {/* Active Tourist Profile & Re-Book Button */}
            <button
              onClick={() => setShowBookingWizard(true)}
              className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-extrabold flex items-center space-x-1 transition-all"
              title="Change Tourist / Book Package"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeBooking?.tourist_name || user?.name || 'Tourist'}</span>
            </button>

            {/* Language Switcher Pill */}
            <button
              onClick={() => setShowLangModal(true)}
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 transition-all"
              title="Change Language / மொழியை மாற்றவும்"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px]">{currentLanguageObj.native}</span>
            </button>

            {/* Operator Portal Link */}
            <a
              href={typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? "http://localhost:4000" : "/operator"}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 text-[11px] font-bold flex items-center space-x-1 transition-all"
              title="Open Tour Operator Dashboard"
            >
              <span>{typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? 'Operator (4000) ↗' : 'Operator Portal ↗'}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Floating Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 z-40 flex items-center justify-around shadow-lg">
        {touristTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
                  tab.isDanger
                    ? isActive
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40'
                      : 'text-rose-600 hover:bg-rose-50'
                    : isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icon className={`w-5 h-5 ${tab.isDanger ? 'animate-bounce' : ''}`} />
              <span className="text-[10px] font-bold mt-1">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
