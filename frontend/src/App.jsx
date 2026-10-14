import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SimulationProvider } from './context/SimulationContext';
import { LanguageProvider } from './context/LanguageContext';

// Layouts
import OperatorLayout from './layouts/OperatorLayout';
import TouristLayout from './layouts/TouristLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Operator Pages
import OperatorDashboard from './pages/operator/OperatorDashboard';
import TourManagement from './pages/operator/TourManagement';
import TouristManagement from './pages/operator/TouristManagement';
import AdaptiveGrouping from './pages/operator/AdaptiveGrouping';
import LiveMap from './pages/operator/LiveMap';
import DynamicItinerary from './pages/operator/DynamicItinerary';
import WeatherMonitor from './pages/operator/WeatherMonitor';
import AIIntelligence from './pages/operator/AIIntelligence';
import EmergencyCenter from './pages/operator/EmergencyCenter';
import CostEstimator from './pages/operator/CostEstimator';
import Analytics from './pages/operator/Analytics';

// Tourist Pages
import TouristDashboard from './pages/tourist/TouristDashboard';
import VoiceAssistant from './pages/tourist/VoiceAssistant';
import TouristMap from './pages/tourist/TouristMap';
import EmergencySOS from './pages/tourist/EmergencySOS';

// Robust React Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto text-xl font-bold">
              🌍
            </div>
            <h2 className="text-xl font-bold text-slate-900">TrailSync Platform</h2>
            <p className="text-xs text-slate-600">
              {this.state.error?.message || 'Something interrupted the session. Reloading application...'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/operator';
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Reset to Operator Dashboard
              </button>
              <button
                onClick={() => {
                  window.location.href = '/tourist';
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Open Tourist App
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRoutes() {
  const { user } = useAuth();
  const currentPort = typeof window !== 'undefined' ? window.location.port : '';
  const isOperatorPort = currentPort === '4000' || currentPort === '5173';
  const isTouristPort = currentPort === '9000' || currentPort === '5174';

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Operator Dashboard Routes */}
      <Route
        path="/operator"
        element={
          isTouristPort ? <Navigate to="/tourist" replace /> : <OperatorLayout />
        }
      >
        <Route index element={<OperatorDashboard />} />
        <Route path="tours" element={<TourManagement />} />
        <Route path="tourists" element={<TouristManagement />} />
        <Route path="groups" element={<AdaptiveGrouping />} />
        <Route path="live-map" element={<LiveMap />} />
        <Route path="weather" element={<WeatherMonitor />} />
        <Route path="itinerary" element={<DynamicItinerary />} />
        <Route path="ai-intelligence" element={<AIIntelligence />} />
        <Route path="emergencies" element={<EmergencyCenter />} />
        <Route path="cost-estimator" element={<CostEstimator />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      {/* Tourist Mobile App Routes */}
      <Route
        path="/tourist"
        element={
          isOperatorPort ? <Navigate to="/operator" replace /> : <TouristLayout />
        }
      >
        <Route index element={<TouristDashboard />} />
        <Route path="voice" element={<VoiceAssistant />} />
        <Route path="map" element={<TouristMap />} />
        <Route path="sos" element={<EmergencySOS />} />
      </Route>

      {/* Default Catch-all Route */}
      <Route
        path="*"
        element={
          isTouristPort ? (
            <Navigate to="/tourist" replace />
          ) : isOperatorPort ? (
            <Navigate to="/operator" replace />
          ) : user?.role === 'tourist' ? (
            <Navigate to="/tourist" replace />
          ) : (
            <Navigate to="/operator" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <SocketProvider>
              <SimulationProvider>
                <AppRoutes />
              </SimulationProvider>
            </SocketProvider>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
