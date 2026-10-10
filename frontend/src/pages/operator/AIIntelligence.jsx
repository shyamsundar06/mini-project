import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CloudSun,
  Navigation,
  Users,
  Calendar,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { aiApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function AIIntelligence() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const { lastAIEvent } = useSocket();

  const agents = [
    {
      name: 'Weather Agent',
      service: 'Open-Meteo API',
      icon: CloudSun,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      status: 'MONITORING',
      metrics: 'Rain Prob: 75% at 14:00 • 19.5°C'
    },
    {
      name: 'Route Agent',
      service: 'Geoapify Routing',
      icon: Navigation,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      status: 'EVALUATING',
      metrics: 'Ghat Road: Wet • +18 min delay'
    },
    {
      name: 'Group Agent',
      service: 'Adaptive Clustering',
      icon: Users,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      status: 'OPTIMAL',
      metrics: '3 Micro-groups • Avg Fit: 92%'
    },
    {
      name: 'Itinerary Agent',
      service: 'Dynamic Optimizer',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      status: 'REROUTED',
      metrics: 'Tea Museum Indoor Fallback'
    },
    {
      name: 'Emergency Agent',
      service: 'SOS Triage Engine',
      icon: ShieldAlert,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      status: 'STANDBY',
      metrics: 'Nearest Support: Ooty Hospital (6m)'
    },
    {
      name: 'Coordinator Agent',
      service: 'Google Gemini 2.5',
      icon: Cpu,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      status: 'SYNTHESIZING',
      metrics: 'Multi-Agent Consensus: 95%'
    }
  ];

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await aiApi.getRecommendations('tour_ooty_nilgiris');
      if (res.data?.recommendations) {
        setRecommendations(res.data.recommendations);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [lastAIEvent]);

  const handleRespond = async (id, status) => {
    try {
      await aiApi.respond(id, { status });
      fetchRecommendations();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      await aiApi.analyze({ tour_id: 'tour_ooty_nilgiris' });
      fetchRecommendations();
    } catch (err) {
      alert(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>Multi-Agent AI Intelligence Engine</span>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 text-slate-900 tracking-tight">
            AI Operations & Decision Support
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Autonomous multi-agent consensus evaluating environmental conditions, road safety, and tourist compatibility.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all"
        >
          <Cpu className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Evaluating Multi-Agent Pipeline...' : 'Run Real-time AI Analysis'}</span>
        </button>
      </div>

      {/* Multi-Agent Sub-systems Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Multi-Agent Subsystem Telemetry
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {agents.map((ag) => {
            const Icon = ag.icon;
            return (
              <div
                key={ag.name}
                className={`p-4 rounded-2xl border ${ag.bgColor} ${ag.borderColor} flex flex-col justify-between space-y-2 shadow-xs`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-xl bg-white shadow-xs ${ag.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{ag.status}</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{ag.name}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{ag.service}</p>
                </div>
                <p className="text-[10px] font-semibold text-slate-700 pt-1 border-t border-slate-200/60">
                  {ag.metrics}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations Feed */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Generated AI Recommendations ({recommendations.length})
        </h3>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-6 rounded-3xl border transition-all ${
                rec.status === 'APPROVED'
                  ? 'bg-white border-emerald-300 shadow-xs'
                  : rec.status === 'REJECTED'
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'glass-card border-indigo-200 shadow-md'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{rec.agent_source}</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      Confidence: <strong>{Math.round((rec.confidence_score || 0.95) * 100)}%</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-relaxed">
                    "{rec.recommendation_text}"
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <p className="text-slate-700">
                      <strong className="text-indigo-700">Multi-Agent Rationale:</strong> {rec.reason}
                    </p>

                    {rec.affected_groups && (
                      <p className="text-slate-600">
                        <strong className="text-slate-800">Affected Groups:</strong> {rec.affected_groups}
                      </p>
                    )}

                    {rec.suggested_alternative && (
                      <p className="text-emerald-800 font-medium">
                        <strong>Suggested Alternative:</strong> {rec.suggested_alternative}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                  {rec.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleRespond(rec.id, 'APPROVED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Apply</span>
                      </button>
                      <button
                        onClick={() => handleRespond(rec.id, 'REJECTED')}
                        className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold text-center ${
                        rec.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {rec.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
