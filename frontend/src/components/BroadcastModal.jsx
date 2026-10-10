import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  X,
  Send,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Sparkles,
  Radio
} from 'lucide-react';
import { broadcastApi } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function BroadcastModal({ isOpen, onClose }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [targetGroup, setTargetGroup] = useState('ALL');
  const [priority, setPriority] = useState('NORMAL');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const { lastBroadcastEvent } = useSocket();

  const QUICK_TEMPLATES = [
    {
      title: 'Regroup Assembly',
      text: 'All groups please regroup near Italian Terraced Garden gazebo in 15 minutes for guide briefing.',
      priority: 'NORMAL',
      group: 'ALL'
    },
    {
      title: 'Rain Alert: Move Indoors',
      text: 'Sudden rain shower approaching Doddabetta ridge. All groups proceed to the covered Tea Museum complex immediately.',
      priority: 'HIGH',
      group: 'ALL'
    },
    {
      title: 'Bus Departure to Ooty Lake',
      text: 'Tour shuttle boarding at Main Lower Gate in 20 minutes for scenic lake boathouse visit.',
      priority: 'NORMAL',
      group: 'ALL'
    },
    {
      title: 'Trail Caution for Trekkers',
      text: 'Alpha Trekkers: Rocky terrain ahead is damp. Please maintain steady pace and stay on marked path.',
      priority: 'NORMAL',
      group: 'grp_alpha'
    }
  ];

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const res = await broadcastApi.getAll('tour_ooty_nilgiris');
      if (res.data?.broadcasts) {
        setBroadcasts(res.data.broadcasts);
      }
    } catch (e) {
      console.error('Error fetching broadcasts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBroadcasts();
    }
  }, [isOpen, lastBroadcastEvent]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    try {
      setSending(true);
      const res = await broadcastApi.create({
        tour_id: 'tour_ooty_nilgiris',
        target_group: targetGroup,
        title,
        message,
        priority,
        sender_name: 'Tour Command Center'
      });

      if (res.data?.success) {
        setTitle('');
        setMessage('');
        setSuccessMsg('Announcement broadcasted to all tourists via WebSockets!');
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchBroadcasts();
      }
    } catch (err) {
      console.error('Broadcast send error:', err);
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (tpl) => {
    setTitle(tpl.title);
    setMessage(tpl.text);
    setPriority(tpl.priority);
    setTargetGroup(tpl.group);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Tourist Broadcast & Announcement Center
              </h2>
              <p className="text-xs text-slate-500">
                Push instant live alerts & instructions to tourists' phones in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Preset Templates */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
              Quick Announcement Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_TEMPLATES.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/40 text-xs transition-all space-y-1"
                >
                  <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <span>{tpl.title}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{tpl.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Broadcast Form */}
          <form onSubmit={handleSend} className="space-y-4 pt-1 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Target Group */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Group
                </label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
                >
                  <option value="ALL">All Tourists (Alpha, Beta, Gamma)</option>
                  <option value="grp_alpha">Group Alpha (Nature Trekkers)</option>
                  <option value="grp_beta">Group Beta (Heritage & Culture)</option>
                  <option value="grp_gamma">Group Gamma (Leisure & Wellness)</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Alert Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
                >
                  <option value="NORMAL">Normal Information</option>
                  <option value="HIGH">High Priority (Weather / Route Change)</option>
                  <option value="EMERGENCY">Critical Safety Action</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                placeholder="e.g., Afternoon Gathering at Tea Museum"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Message Content
              </label>
              <textarea
                rows="3"
                placeholder="Type instructions or details for tourists..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 bg-gradient-to-tr from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Broadcasting...' : 'Broadcast to Tourists Now'}</span>
              </button>
            </div>
          </form>

          {/* Broadcast History */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Recent Broadcast History
              </h4>
              <span className="text-[10px] text-slate-400 font-bold">{broadcasts.length} sent</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {broadcasts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No broadcasts sent yet.</p>
              ) : (
                broadcasts.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            b.priority === 'HIGH' || b.priority === 'EMERGENCY'
                              ? 'bg-rose-500'
                              : 'bg-indigo-500'
                          }`}
                        />
                        <h5 className="font-bold text-slate-900">{b.title}</h5>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                          {b.target_group === 'ALL' ? 'All Groups' : b.target_group}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed">{b.message}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>Sender: {b.sender_name}</span>
                      <span className="font-bold text-emerald-600">
                        ✓ {b.ack_count || 0} Tourists Acknowledged
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
