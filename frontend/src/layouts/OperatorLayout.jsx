import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Layers,
  Map,
  CalendarDays,
  Sparkles,
  AlertTriangle,
  Calculator,
  BarChart3,
  Bell,
  LogOut,
  Sliders,
  Play,
  RotateCcw,
  CloudRain,
  Radio,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Compass,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSimulation, DEMO_SCENARIO_STEPS } from '../context/SimulationContext';
import BroadcastModal from '../components/BroadcastModal';

export default function OperatorLayout() {
  const { user, logout, switchRoleDemo } = useAuth();
  const { connected, activeEmergency, notifications } = useSocket();
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const {
    isDemoMode,
    toggleDemoMode,
    currentStep,
    nextStep,
    prevStep,
    isAutoWalking,
    setIsAutoWalking,
    triggerWeatherDisruption,
    triggerEmergencySOS,
    resetSimulation,
    simLoading
  } = useSimulation();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showScenarioBar, setShowScenarioBar] = useState(true);
  const navigate = useNavigate();

  const navItems = [
    { to: '/operator', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/operator/tours', icon: MapPin, label: 'Tours' },
    { to: '/operator/tourists', icon: Users, label: 'Tourists' },
    { to: '/operator/groups', icon: Layers, label: 'Adaptive Groups' },
    { to: '/operator/live-map', icon: Map, label: 'Live Map' },
    { to: '/operator/itinerary', icon: CalendarDays, label: 'Itinerary' },
    { to: '/operator/ai-intelligence', icon: Sparkles, label: 'AI Intelligence' },
    { to: '/operator/emergencies', icon: AlertTriangle, label: 'Emergencies' },
    { to: '/operator/cost-estimator', icon: Calculator, label: 'Cost Estimator' },
    { to: '/operator/analytics', icon: BarChart3, label: 'Analytics' }
  ];

  const currentStepData =
    (DEMO_SCENARIO_STEPS && DEMO_SCENARIO_STEPS[currentStep - 1]) ||
    DEMO_SCENARIO_STEPS[0] ||
    { title: 'Operator Dashboard', description: 'Monitor tour operations' };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 z-30 shadow-sm">
        <div>
          {/* Logo & Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Compass className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  IntelliTour
                </h1>
                <p className="text-xs text-slate-500 font-medium">Operator Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / User Profile & Role Switch */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                {user?.name?.charAt(0) || 'O'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Vikram Anand'}</p>
                <p className="text-[10px] text-emerald-600 font-semibold capitalize">Tour Operator</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              switchRoleDemo('tourist');
              navigate('/tourist');
            }}
            className="w-full py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
          >
            <span>📱 Switch to Tourist App View</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20 shadow-sm">
          <div className="flex items-center space-x-4">
            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
              <span>Tour: Nilgiris Grand Heritage & Botanical Discovery</span>
            </span>

            {/* Mode Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => !isDemoMode && toggleDemoMode()}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  isDemoMode ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Simulation Mode
              </button>
              <button
                onClick={() => isDemoMode && toggleDemoMode()}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  !isDemoMode ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Live Production
              </button>
            </div>
          </div>

          {/* Quick Simulation Controls & Notification Center */}
          <div className="flex items-center space-x-3">
            {isDemoMode && (
              <div className="hidden lg:flex items-center space-x-2">
                <button
                  onClick={() => setIsAutoWalking(!isAutoWalking)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                    isAutoWalking
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 animate-pulse'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{isAutoWalking ? 'GPS Telemetry Streaming' : 'Start GPS Stream'}</span>
                </button>

                <button
                  onClick={triggerWeatherDisruption}
                  disabled={simLoading}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>Simulate Rain Spike</span>
                </button>

                <button
                  onClick={triggerEmergencySOS}
                  disabled={simLoading}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Simulate SOS</span>
                </button>

                <button
                  onClick={resetSimulation}
                  disabled={simLoading}
                  title="Reset Demo Baseline"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 bg-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Broadcast Announcement Button */}
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center space-x-1.5 transition-all shadow-xs"
              title="Broadcast instant announcements to tourists"
            >
              <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Broadcast</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Notifications</h3>
                    <span className="text-[10px] text-slate-400">{notifications.length} recent</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-2 space-y-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No recent notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-2.5 px-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800">{n.title}</p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Active Emergency Banner if any */}
        {activeEmergency && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-3">
              <span className="p-1 rounded bg-rose-600 text-white font-bold text-xs">🚨 ACTIVE SOS</span>
              <span className="text-xs font-semibold text-rose-800">
                Tourist <strong>{activeEmergency.tourist_name || 'Tourist'}</strong> triggered SOS in{' '}
                <strong>{activeEmergency.group_name || 'Group'}</strong> at coordinates ({activeEmergency.latitude?.toFixed(4)},{' '}
                {activeEmergency.longitude?.toFixed(4)})
              </span>
            </div>
            <button
              onClick={() => navigate('/operator/emergencies')}
              className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 shadow-md transition-colors"
            >
              Open Command Center
            </button>
          </div>
        )}

        {/* Guided Scenario Stepper Ribbon */}
        {isDemoMode && showScenarioBar && (
          <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-700 shadow-xs">
            <div className="flex items-center space-x-3 overflow-hidden">
              <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px] shrink-0">
                Step {currentStep}/18
              </span>
              <span className="font-bold text-slate-900 shrink-0">{currentStepData.title}:</span>
              <span className="text-slate-600 truncate">{currentStepData.description}</span>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0 ml-4">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 border border-slate-200"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={nextStep}
                disabled={currentStep === DEMO_SCENARIO_STEPS.length}
                className="p-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white shadow-xs"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowScenarioBar(false)}
                className="text-[10px] text-slate-400 hover:text-slate-600 ml-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
      />
    </div>
  );
}
