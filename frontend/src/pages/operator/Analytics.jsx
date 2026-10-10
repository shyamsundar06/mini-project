import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  BarChart3,
  Star,
  MessageSquare,
  ThumbsUp,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import { analyticsApi } from '../../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.get('tour_ooty_nilgiris');
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center space-x-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tour Operations Intelligence & Telemetry</span>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1 text-slate-900 tracking-tight">Analytics Dashboard</h2>
          <p className="text-xs text-slate-600 mt-1">
            Real-time analytics across tourist demographic distribution, AI acceptance rates, and expense allocations.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium">
          <span>AI Decision Accuracy: <strong className="text-emerald-700 font-bold">95%</strong></span>
          <span>•</span>
          <span>Response Time: <strong className="text-blue-700 font-bold">6.5 mins</strong></span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Language Distribution */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Tourist Language Preferences</h3>
            <span className="text-[11px] text-slate-500 font-semibold">6 Supported Languages</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.languageStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Walking Pace Distribution */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Walking Preference Distribution</h3>
            <span className="text-[11px] text-slate-500 font-semibold">Physical Pace Tiers</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.walkingStats || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(data?.walkingStats || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Group Compatibility & Member Breakdown */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Micro-Group Compatibility Scores</h3>
            <span className="text-[11px] text-slate-500 font-semibold">Adaptive AI Clustering</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.groupStats || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[70, 100]} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={130} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                />
                <Bar dataKey="score" fill="#10B981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Tour Expense Category Breakdown */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Tour Expense Allocation</h3>
            <span className="text-[11px] text-slate-500 font-semibold">Total: ₹191,000</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.expenseCategories || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {(data?.expenseCategories || []).map((entry, index) => (
                    <Cell key={`cell-exp-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => `₹${Number(val).toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#1e293b' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Tourist Experience, CSAT & Real-Time Testimonials */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>Customer Satisfaction & Voice of Tourist</span>
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1">Tourist Experience & Guide Feedback</h3>
            <p className="text-xs text-slate-500">Live evaluations submitted by tourists across all active micro-groups.</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold flex items-center space-x-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>98% Positive Sentiment</span>
            </span>
          </div>
        </div>

        {/* Rating Breakdown Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-center space-y-1">
            <span className="text-[11px] font-semibold text-amber-800">Overall CSAT Score</span>
            <div className="flex items-center justify-center space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{data?.feedback?.summary?.overall || '4.8'}</span>
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>
            <p className="text-[10px] text-amber-700 font-medium">Based on {data?.feedback?.summary?.totalCount || 3} verified reviews</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-center space-y-1">
            <span className="text-[11px] font-semibold text-blue-800">Guide Excellence</span>
            <div className="flex items-center justify-center space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{data?.feedback?.summary?.guide || '4.9'}</span>
              <span className="text-blue-500 font-bold text-sm">/ 5.0</span>
            </div>
            <p className="text-[10px] text-blue-700 font-medium">Attentiveness & Knowledge</p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800">Safety & Tracking Assurance</span>
            <div className="flex items-center justify-center space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{data?.feedback?.summary?.safety || '4.9'}</span>
              <span className="text-emerald-500 font-bold text-sm">/ 5.0</span>
            </div>
            <p className="text-[10px] text-emerald-700 font-medium">Zero lost incident rating</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 text-center space-y-1">
            <span className="text-[11px] font-semibold text-purple-800">Scenic Route Rating</span>
            <div className="flex items-center justify-center space-x-1.5">
              <span className="text-3xl font-extrabold text-slate-900">{data?.feedback?.summary?.scenery || '4.7'}</span>
              <span className="text-purple-500 font-bold text-sm">/ 5.0</span>
            </div>
            <p className="text-[10px] text-purple-700 font-medium">Botanical Gardens & Trails</p>
          </div>
        </div>

        {/* Tourist Reviews Feed */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>Recent Tourist Reviews & Quotes</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(data?.feedback?.reviews || []).map((rev) => (
              <div
                key={rev.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{rev.tourist_name}</span>
                    <div className="flex text-amber-500">
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-500" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic leading-relaxed">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                  <span>Verified Participant</span>
                  <span>{rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Today'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
