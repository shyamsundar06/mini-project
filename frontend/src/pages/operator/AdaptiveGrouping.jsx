import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ArrowRightLeft,
  Users,
  Footprints,
  Languages,
  HeartPulse,
  ShieldCheck,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { groupApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function AdaptiveGrouping() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [recommendedClusters, setRecommendedClusters] = useState(null);
  const [selectedTouristToMove, setSelectedTouristToMove] = useState(null);
  const [selectedTargetGroup, setSelectedTargetGroup] = useState('');
  const { lastGroupEvent } = useSocket();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await groupApi.getAll('tour_ooty_nilgiris');
      if (res.data?.groups) {
        setGroups(res.data.groups);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [lastGroupEvent]);

  const handleGenerateAI = async () => {
    try {
      setGenerating(true);
      const res = await groupApi.generateAI({ tour_id: 'tour_ooty_nilgiris' });
      if (res.data?.recommendedGroups) {
        setRecommendedClusters(res.data.recommendedGroups);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveGroups = async () => {
    try {
      setApproving(true);
      await groupApi.approveAI({
        tour_id: 'tour_ooty_nilgiris',
        groups: recommendedClusters || groups
      });

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setRecommendedClusters(null);
      fetchGroups();
    } catch (err) {
      alert(err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleMoveTourist = async () => {
    if (!selectedTouristToMove || !selectedTargetGroup) return;
    try {
      await groupApi.moveTourist({
        tourist_id: selectedTouristToMove.id,
        source_group_id: selectedTouristToMove.group_id,
        target_group_id: selectedTargetGroup
      });
      setSelectedTouristToMove(null);
      fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeDisplayGroups = recommendedClusters || groups;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Multi-Dimensional AI Clustering Engine</span>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 text-slate-900 tracking-tight">Adaptive Grouping System</h2>
          <p className="text-xs text-slate-600 mt-1">
            Dynamically partitions tourists into compatible micro-groups based on walking pace, language, interests, age proximity, and accessibility.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateAI}
            disabled={generating}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Clustering Tourists...' : 'Regenerate AI Groups'}</span>
          </button>

          <button
            onClick={handleApproveGroups}
            disabled={approving}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Sync Groups</span>
          </button>
        </div>
      </div>

      {/* Recommended Preview Banner if AI Regenerated */}
      {recommendedClusters && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
            <p className="text-xs text-indigo-900">
              <strong>AI Recommendation Ready:</strong> Optimized 3 clusters with average 94% compatibility. Click "Approve & Sync" to apply to live tour.
            </p>
          </div>
          <button
            onClick={() => setRecommendedClusters(null)}
            className="text-xs text-indigo-700 hover:text-indigo-900 px-3 py-1 bg-white border border-indigo-200 rounded-lg font-bold"
          >
            Discard
          </button>
        </div>
      )}

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeDisplayGroups.map((grp) => (
          <div
            key={grp.id}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-4 border-slate-200 hover:border-blue-300 transition-all relative overflow-hidden shadow-sm"
          >
            {/* Top Color Accent Ribbon */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: grp.color_hex || '#3B82F6' }}
            />

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <span>{grp.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Lead: <strong>{grp.leader_name}</strong> ({grp.leader_phone})
                  </p>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                    {grp.compatibility_score}% Match
                  </span>
                </div>
              </div>

              {/* Group Attribute Pills */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <Footprints className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pace: {grp.walking_preference}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Avg Age: {grp.avg_age} yrs</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2">
                  <HeartPulse className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{grp.common_interests}</span>
                </div>
              </div>

              {/* Members List */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Members ({grp.members?.length || 0})</span>
                  <span>Fit Score</span>
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {grp.members?.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: grp.color_hex || '#3B82F6' }}
                        >
                          {m.name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{m.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {m.age}y • {m.preferred_language} • {m.walking_preference}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[11px] font-bold text-emerald-600">
                          {m.compatibility_score || m.individualScore || grp.compatibility_score}%
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTouristToMove({ ...m, group_id: grp.id });
                            setSelectedTargetGroup(
                              activeDisplayGroups.find((g) => g.id !== grp.id)?.id || ''
                            );
                          }}
                          title="Move to another group"
                          className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Move Modal */}
      {selectedTouristToMove && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Move Tourist to Group</h3>
            <p className="text-xs text-slate-600">
              Reassign <strong>{selectedTouristToMove.name}</strong> to a different micro-group.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Group</label>
              <select
                value={selectedTargetGroup}
                onChange={(e) => setSelectedTargetGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {activeDisplayGroups
                  .filter((g) => g.id !== selectedTouristToMove.group_id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Avg Age {g.avg_age}, Pace: {g.walking_preference})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setSelectedTouristToMove(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveTourist}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
