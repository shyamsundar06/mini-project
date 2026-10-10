import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  Mic,
  MapPin,
  ShieldAlert,
  Home,
  ArrowRightLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TouristLayout() {
  const { user, switchRoleDemo } = useAuth();
  const navigate = useNavigate();

  const touristTabs = [
    { to: '/tourist', icon: Home, label: 'My Tour', end: true },
    { to: '/tourist/voice', icon: Mic, label: 'AI Voice' },
    { to: '/tourist/map', icon: MapPin, label: 'Live Map' },
    { to: '/tourist/sos', icon: ShieldAlert, label: 'SOS Alert', isDanger: true }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-slate-200 relative">
      {/* Tourist App Top Bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 p-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-slate-900">IntelliTour Guide</h1>
              <p className="text-[11px] text-blue-600 font-semibold">Nilgiris Discovery Tour</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>GPS Live</span>
            </span>

            <button
              onClick={() => {
                switchRoleDemo('operator');
                navigate('/operator');
              }}
              title="Switch to Operator Dashboard"
              className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Floating Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-lg border-t border-slate-200 px-3 py-2 z-50 flex items-center justify-around shadow-lg">
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
