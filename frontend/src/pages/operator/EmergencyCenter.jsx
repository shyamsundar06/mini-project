import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  PhoneCall,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  DollarSign,
  HeartPulse,
  Building,
  Download
} from 'lucide-react';
import { emergencyApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function EmergencyCenter() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [responderName, setResponderName] = useState('First Responder Murugan');
  const [resolutionNotes, setResolutionNotes] = useState('Hydration and medical assistance provided on-site. Tourist stabilized.');
  const [actualCost, setActualCost] = useState(500);
  const { activeEmergency } = useSocket();

  const fetchEmergencies = async () => {
    try {
      setLoading(true);
      const res = await emergencyApi.getAll('tour_ooty_nilgiris');
      if (res.data?.emergencies) {
        setEmergencies(res.data.emergencies);
        if (res.data.emergencies.length > 0 && !selectedEmergency) {
          setSelectedEmergency(res.data.emergencies[0]);
        }
      }
    } catch (err) {
      console.error('Error loading emergencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies();
  }, [activeEmergency]);

  const handleUpdateStatus = async (status) => {
    if (!selectedEmergency) return;
    try {
      await emergencyApi.updateStatus(selectedEmergency.id, {
        status,
        assigned_responder: responderName,
        resolution_notes: resolutionNotes,
        actual_cost: actualCost
      });
      fetchEmergencies();
    } catch (err) {
      alert(err.message);
    }
  };

  const exportIncidentReportCSV = () => {
    if (!emergencies.length) return;
    const headers = [
      'Incident ID',
      'Tourist Name',
      'Group',
      'Emergency Type',
      'Status',
      'Latitude',
      'Longitude',
      'Distance (km)',
      'Estimated Cost Min (INR)',
      'Estimated Cost Max (INR)',
      'Reported Time',
      'Resolved At'
    ];

    const rows = emergencies.map((e) => [
      e.id,
      `"${e.tourist_name || 'N/A'}"`,
      `"${e.group_name || 'N/A'}"`,
      e.emergency_type || 'MEDICAL',
      e.status,
      e.latitude,
      e.longitude,
      e.estimated_distance_km || 1.8,
      e.estimated_cost_min || 1500,
      e.estimated_cost_max || 2500,
      `"${e.reported_at || 'N/A'}"`,
      `"${e.resolved_at || 'N/A'}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nilgiris_SOS_Incident_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS Emergency Coordination Center</span>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 text-slate-900 tracking-tight">
            Emergency Incident Management
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Real-time SOS triage, nearest medical dispatch, and operational emergency expense reserve tracking.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportIncidentReportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
            title="Download CSV Incident Audit Log for Rangers and Insurance"
          >
            <Download className="w-4 h-4 text-rose-600" />
            <span>Export Incident Log (CSV)</span>
          </button>
          <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 text-xs shadow-xs">
            <span className="text-slate-500 font-medium">Available Reserve:</span>
            <span className="font-bold text-emerald-700">₹25,000</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Emergency Queue & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Incident Queue */}
        <div className="glass-card rounded-3xl p-5 border border-slate-200 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Emergency Queue ({emergencies.length})
          </h3>

          <div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
            {emergencies.map((emg) => {
              const isActive = emg.status === 'ACTIVE' || emg.status === 'INVESTIGATING';
              return (
                <div
                  key={emg.id}
                  onClick={() => setSelectedEmergency(emg)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedEmergency?.id === emg.id
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                      : isActive
                      ? 'bg-rose-50 border-rose-200 hover:bg-rose-100/60'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        emg.status === 'ACTIVE'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : emg.status === 'INVESTIGATING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {emg.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(emg.reported_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-2">{emg.tourist_name || 'Tourist'}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{emg.message}</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                    <span>{emg.group_name || 'Group'}</span>
                    <span>GPS: {emg.latitude?.toFixed(3)}, {emg.longitude?.toFixed(3)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Command Center Inspector */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-200 space-y-5">
          {selectedEmergency ? (
            <>
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedEmergency.status === 'ACTIVE'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : selectedEmergency.status === 'INVESTIGATING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedEmergency.status} PRIORITY {selectedEmergency.priority || 'CRITICAL'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">ID: #{selectedEmergency.id}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {selectedEmergency.tourist_name} ({selectedEmergency.group_name || 'Group Alpha'})
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <a
                    href={`tel:${selectedEmergency.tourist_phone || '+919845112345'}`}
                    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Tourist</span>
                  </a>
                </div>
              </div>

              {/* Message Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Emergency Description
                </span>
                <p className="text-slate-800 text-sm font-semibold leading-relaxed">
                  "{selectedEmergency.message}"
                </p>
                <div className="flex items-center space-x-4 pt-2 text-slate-500 text-[11px]">
                  <span>Emergency Type: <strong className="text-slate-700">{selectedEmergency.emergency_type}</strong></span>
                  <span>Coordinates: <strong className="text-slate-700">{selectedEmergency.latitude?.toFixed(5)}, {selectedEmergency.longitude?.toFixed(5)}</strong></span>
                </div>
              </div>

              {/* Nearest Medical & Rescue Support Station */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-indigo-700" />
                    <h4 className="text-xs font-bold text-slate-900">Dispatched Nearest Support Unit</h4>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    ~6 min ETA
                  </span>
                </div>
                <p className="text-xs text-indigo-900">
                  <strong>Ooty Botanical First Aid & Ranger Outpost</strong> (1.2 km away) has been notified.
                </p>
              </div>

              {/* Emergency Expense Estimation Module */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900">Emergency Operational Expense Estimator</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Rule-based Model</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Estimated Cost</span>
                    <p className="text-base font-bold text-amber-700 mt-0.5">
                      ₹{selectedEmergency.estimated_cost_min || 1500} – ₹{selectedEmergency.estimated_cost_max || 3000}
                    </p>
                    <p className="text-[10px] text-slate-400">Rapid Response Unit</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Available Reserve</span>
                    <p className="text-base font-bold text-emerald-700 mt-0.5">₹25,000</p>
                    <p className="text-[10px] text-slate-400">Allocated Tour Buffer</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[11px]">Remaining Buffer</span>
                    <p className="text-base font-bold text-indigo-700 mt-0.5">₹22,000 – ₹23,500</p>
                    <p className="text-[10px] text-slate-400">Safe Surplus</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  * Note: This is an approximate operational estimate, not an exact medical or financial prediction.
                </p>
              </div>

              {/* Operator Action Inputs & Resolution */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Assigned Responder</label>
                    <input
                      type="text"
                      value={responderName}
                      onChange={(e) => setResponderName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Actual Incurred Cost (₹)</label>
                    <input
                      type="number"
                      value={actualCost}
                      onChange={(e) => setActualCost(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Resolution / Medical Notes</label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white text-xs"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-1">
                  <button
                    onClick={() => handleUpdateStatus('INVESTIGATING')}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                  >
                    Mark as Investigating
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolve Emergency</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Select an incident from the emergency queue to open the command console.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
