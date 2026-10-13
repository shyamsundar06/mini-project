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
  Zap,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { groupApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const STRATEGIES = [
  { id: 'AUTO', name: 'Dynamic Auto-Cycle', badge: '🔄 Next Strategy', desc: 'Cycles through alternative optimization passes' },
  { id: 'PACE_MOBILITY', name: 'Pace & Mobility Synergy', badge: '🚶 Pace Focused', desc: 'Clusters by walking speed, stamina, and trek agility' },
  { id: 'LANGUAGE_CULTURE', name: 'Language & Conversational Affinity', badge: '🗣️ Language Synergy', desc: 'Maximizes fluent communication and regional camaraderie' },
  { id: 'INTEREST_THEMATIC', name: 'Interest & Thematic Passion', badge: '🎯 Interest Aligned', desc: 'Aligns travelers by wildlife, adventure, or arts/heritage' },
  { id: 'AGE_COHORTS', name: 'Demographic Peer Cohorts', badge: '👥 Age Cohorts', desc: 'Balances generational brackets for natural social bonding' },
  { id: 'BALANCED_HYBRID', name: 'Multi-Factor Global Synergy', badge: '⚖️ Global Harmony', desc: 'Balances size and mutuality via multi-attribute swaps' },
];

export default function AdaptiveGrouping() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [recommendedClusters, setRecommendedClusters] = useState(null);
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState('AUTO');
  const [iterationCount, setIterationCount] = useState(0);
  const [selectedTouristToMove, setSelectedTouristToMove] = useState(null);
  const { lastGroupEvent, lastBookingEvent } = useSocket();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await groupApi.getAll('tour_ooty_nilgiris');
      let serverGroups = res.data?.groups || [];

      // Read any deleted tourists blacklist
      let deletedIds = [];
      let deletedNames = [];
      try {
        deletedIds = JSON.parse(localStorage.getItem('tourism_deleted_tourist_ids') || '[]');
        deletedNames = JSON.parse(localStorage.getItem('tourism_deleted_tourist_names') || '[]');
      } catch (e) {}

      // Clean server groups to remove any deleted tourists
      serverGroups = serverGroups.map((grp) => {
        const filteredMembers = (grp.members || []).filter(
          (m) => !deletedIds.includes(m.id) && !deletedNames.includes(m.name?.toLowerCase())
        );
        return {
          ...grp,
          size: filteredMembers.length,
          members: filteredMembers
        };
      });

      // Merge locally added or booked tourists so they are guaranteed to reflect in groups
      let clientTourists = [];
      try {
        clientTourists = JSON.parse(localStorage.getItem('tourism_client_added_tourists') || '[]');
      } catch (e) {}

      clientTourists = clientTourists.filter(
        (ct) => !deletedIds.includes(ct.id) && !deletedNames.includes(ct.name?.toLowerCase())
      );

      if (clientTourists.length > 0 && serverGroups.length > 0) {
        serverGroups = serverGroups.map((grp) => {
          const existingMembers = [...(grp.members || [])];
          clientTourists.forEach((ct) => {
            const matchesGroup =
              ct.group_id === grp.id ||
              (!ct.group_id && grp.id === 'grp_beta') ||
              (ct.walking_preference === 'Fast' && grp.id === 'grp_alpha') ||
              (ct.walking_preference === 'Slow' && grp.id === 'grp_gamma');

            if (matchesGroup) {
              const alreadyInGroup = existingMembers.some(
                (m) => m.name.toLowerCase() === ct.name.toLowerCase() || m.id === ct.id
              );
              if (!alreadyInGroup) {
                existingMembers.push({
                  id: ct.id,
                  name: ct.name,
                  age: ct.age || 26,
                  preferred_language: ct.preferred_language || 'English',
                  walking_preference: ct.walking_preference || 'Moderate',
                  activity_preference: ct.activity_preference || 'Cultural',
                  interests: ct.interests || 'Sightseeing',
                  accessibility_requirements: ct.accessibility_requirements || 'None',
                  status: 'ACTIVE',
                  compatibility_score: 95
                });
              }
            }
          });
          return {
            ...grp,
            size: existingMembers.length,
            members: existingMembers
          };
        });
      }

      setGroups(serverGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [lastGroupEvent, lastBookingEvent]);

  useEffect(() => {
    const handleFocus = () => fetchGroups();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Map of tourist id -> original group id
  const originalGroupMap = {};
  const originalGroupNameMap = {};
  groups.forEach((g) => {
    (g.members || []).forEach((m) => {
      originalGroupMap[m.id] = g.id;
      originalGroupNameMap[m.id] = g.name?.split('-')[0]?.trim() || g.name;
    });
  });

  const handleGenerateAI = async (strategyOverride = null) => {
    try {
      setGenerating(true);
      const strat = strategyOverride || selectedStrategyId;
      const nextIteration = iterationCount + 1;
      setIterationCount(nextIteration);

      const res = await groupApi.generateAI({
        tour_id: 'tour_ooty_nilgiris',
        strategy_id: strat,
        iteration: nextIteration
      });

      if (res.data?.recommendedGroups) {
        setRecommendedClusters(res.data.recommendedGroups);
        setActiveStrategy({
          id: res.data.strategyId,
          name: res.data.strategyName,
          badge: res.data.strategyBadge,
          description: res.data.strategyDescription
        });
        await fetchGroups();
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch (cErr) {
          // ignore
        }
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
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 }
      });

      setRecommendedClusters(null);
      setActiveStrategy(null);
      await fetchGroups();
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
      await fetchGroups();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeDisplayGroups = recommendedClusters || groups;

  // Calculate how many tourists were moved in this recommendation
  let movedCount = 0;
  if (recommendedClusters) {
    recommendedClusters.forEach((g) => {
      (g.members || []).forEach((m) => {
        if (originalGroupMap[m.id] && originalGroupMap[m.id] !== g.id) {
          movedCount++;
        }
      });
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Multi-Dimensional AI Clustering Engine</span>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 text-slate-900 tracking-tight">Adaptive Grouping System</h2>
          <p className="text-xs text-slate-600 mt-1">
            Dynamically partitions tourists across groups based on walking pace, mother tongue, shared passions, age cohorts, and pairwise compatibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Strategy Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedStrategyId}
              onChange={(e) => {
                setSelectedStrategyId(e.target.value);
                handleGenerateAI(e.target.value);
              }}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              {STRATEGIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.badge} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleGenerateAI()}
            disabled={generating}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Re-clustering Tourists...' : 'Regenerate AI Groups'}</span>
          </button>

          <button
            onClick={handleApproveGroups}
            disabled={approving || !recommendedClusters}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{approving ? 'Applying...' : 'Approve & Sync Groups'}</span>
          </button>
        </div>
      </div>

      {/* Recommended Preview Banner if AI Regenerated */}
      {recommendedClusters && (
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 border border-indigo-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start md:items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5 md:mt-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-extrabold text-indigo-950 text-sm">
                  {activeStrategy?.name || 'AI Optimization Complete'}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {activeStrategy?.badge || '⚡ Optimized'}
                </span>
                {movedCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    🔄 {movedCount} Tourists Reassigned
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-900 mt-0.5">
                {activeStrategy?.description} — Review the redistributed members below, then click <strong>Approve & Sync</strong> to update live tours.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
            <button
              onClick={() => {
                setRecommendedClusters(null);
                setActiveStrategy(null);
              }}
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              Discard Preview
            </button>
            <button
              onClick={handleApproveGroups}
              disabled={approving}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Sync</span>
            </button>
          </div>
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
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <span>{grp.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Lead: <strong>{grp.leader_name}</strong> ({grp.leader_phone})
                  </p>
                </div>

                <div className="text-right shrink-0">
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
                  <HeartPulse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                  {grp.members?.map((m) => {
                    const wasInDifferentGroup =
                      recommendedClusters &&
                      originalGroupMap[m.id] &&
                      originalGroupMap[m.id] !== grp.id;
                    const prevGroupName = originalGroupNameMap[m.id];

                    return (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          wasInDifferentGroup
                            ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: grp.color_hex || '#3B82F6' }}
                          >
                            {m.name?.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <p className="font-bold text-slate-800 truncate">{m.name}</p>
                              {wasInDifferentGroup && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-200 text-amber-800 rounded-md shrink-0">
                                  Moved from {prevGroupName}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {m.age}y • {m.preferred_language} • {m.walking_preference}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[11px] font-bold text-emerald-600">
                            {m.individualScore || m.compatibility_score || grp.compatibility_score}%
                          </span>
                          <button
                            onClick={() => {
                              setSelectedTouristToMove({ ...m, group_id: grp.id });
                              setSelectedTargetGroup(
                                activeDisplayGroups.find((g) => g.id !== grp.id)?.id || ''
                              );
                            }}
                            title="Move to another group"
                            className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200 cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveTourist}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
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
