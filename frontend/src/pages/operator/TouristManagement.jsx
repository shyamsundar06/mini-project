import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  HeartPulse,
  Languages,
  Footprints,
  Phone,
  X,
  Download
} from 'lucide-react';
import { touristApi, groupApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export default function TouristManagement() {
  const [tourists, setTourists] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');
  const [selectedTourist, setSelectedTourist] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const { lastBookingEvent, lastGroupEvent } = useSocket();
  const [formData, setFormData] = useState({
    name: '',
    age: 29,
    gender: 'Male',
    preferred_language: 'Tamil',
    walking_preference: 'Fast',
    activity_preference: 'Adventurous',
    interests: 'Photography, Trekking, Flora',
    accessibility_requirements: 'None',
    emergency_contact_name: 'Contact Person',
    emergency_contact_phone: '+91 98451 00000',
    group_id: ''
  });

  const fetchTourists = async () => {
    try {
      setLoading(true);
      const [tRes, gRes] = await Promise.all([
        touristApi.getAll(),
        groupApi.getAll('tour_ooty_nilgiris')
      ]);

      let serverTourists = tRes.data?.tourists || [];
      // Reset local cache to fresh state
      const DATA_VERSION = 'v3_fresh_15_allocation_ai';
      if (localStorage.getItem('tourism_data_version') !== DATA_VERSION) {
        localStorage.setItem('tourism_data_version', DATA_VERSION);
        localStorage.removeItem('tourism_client_added_tourists');
        localStorage.removeItem('tourism_deleted_tourist_names');
        localStorage.removeItem('tourism_deleted_tourist_ids');
        localStorage.removeItem('tourist_active_booking');
      }

      let clientTourists = [];
      let deletedIds = [];
      let deletedNames = [];
      try {
        clientTourists = JSON.parse(localStorage.getItem('tourism_client_added_tourists') || '[]');
        deletedIds = JSON.parse(localStorage.getItem('tourism_deleted_tourist_ids') || '[]');
        deletedNames = JSON.parse(localStorage.getItem('tourism_deleted_tourist_names') || '[]');
      } catch (e) {}

      // Auto-heal: Any active server tourist or client tourist MUST NOT be blacklisted
      const serverNames = new Set(serverTourists.map((st) => (st.name || '').toLowerCase().trim()));
      const serverIds = new Set(serverTourists.map((st) => st.id));

      if (clientTourists.length > 0) {
        const clientNames = clientTourists.map((ct) => ct.name.toLowerCase());
        deletedNames = deletedNames.filter((dn) => !clientNames.includes(dn) && !serverNames.has(dn));
        deletedIds = deletedIds.filter((di) => !clientTourists.some((ct) => ct.id === di) && !serverIds.has(di));
      } else {
        deletedNames = deletedNames.filter((dn) => !serverNames.has(dn));
        deletedIds = deletedIds.filter((di) => !serverIds.has(di));
      }
      try {
        localStorage.setItem('tourism_deleted_tourist_names', JSON.stringify(deletedNames));
        localStorage.setItem('tourism_deleted_tourist_ids', JSON.stringify(deletedIds));
      } catch (e) {}

      if (lastBookingEvent?.tourist_name) {
        const bookedName = lastBookingEvent.tourist_name.toLowerCase();
        deletedNames = deletedNames.filter((dn) => dn !== bookedName);
      }

      // Merge clientTourists if not already in serverTourists
      const merged = [...serverTourists];
      clientTourists.forEach((ct) => {
        const existingIndex = merged.findIndex(
          (m) => m.name.toLowerCase() === ct.name.toLowerCase() || m.id === ct.id
        );
        if (existingIndex >= 0) {
          merged[existingIndex] = { ...merged[existingIndex], ...ct };
        } else {
          merged.unshift(ct);
        }
      });

      // Filter out any deleted tourists
      const activeTourists = merged.filter(
        (t) => !deletedIds.includes(t.id) && !deletedNames.includes(t.name?.toLowerCase())
      );

      // Deduplicate by tourist name (case-insensitive) so nobody is ever rendered twice
      const seenNames = new Set();
      const uniqueTourists = [];
      for (const t of activeTourists) {
        const clean = t.name ? t.name.toLowerCase().trim() : '';
        if (clean && !seenNames.has(clean)) {
          seenNames.add(clean);
          uniqueTourists.push(t);
        }
      }

      setTourists(uniqueTourists);
      if (gRes.data?.groups) setGroups(gRes.data.groups);
    } catch (err) {
      console.error('Error fetching tourists:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTourists();
  }, [lastBookingEvent, lastGroupEvent]);

  useEffect(() => {
    const handleFocus = () => fetchTourists();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleAddTourist = async (e) => {
    e.preventDefault();
    try {
      const assignedGroupObj = groups.find((g) => g.id === formData.group_id);
      const newT = {
        id: `trt_${Date.now().toString().slice(-6)}`,
        ...formData,
        group_name: assignedGroupObj?.name || 'Group Beta',
        group_color: assignedGroupObj?.color_hex || '#3B82F6',
        tour_id: 'tour_ooty_nilgiris',
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      };

      // Store in local storage immediately
      try {
        const existing = JSON.parse(localStorage.getItem('tourism_client_added_tourists') || '[]');
        const filtered = existing.filter((t) => t.name.toLowerCase().trim() !== formData.name.toLowerCase().trim());
        filtered.unshift(newT);
        localStorage.setItem('tourism_client_added_tourists', JSON.stringify(filtered));

        // If it was previously marked deleted, un-delete it
        const deletedNames = JSON.parse(localStorage.getItem('tourism_deleted_tourist_names') || '[]');
        const cleanDeleted = deletedNames.filter((n) => n !== formData.name.toLowerCase().trim());
        localStorage.setItem('tourism_deleted_tourist_names', JSON.stringify(cleanDeleted));
      } catch (e) {}

      // Optimistic state update with deduplication
      setTourists((prev) => {
        const filtered = prev.filter((t) => t.name.toLowerCase().trim() !== formData.name.toLowerCase().trim());
        return [newT, ...filtered];
      });

      await touristApi.create({
        ...formData,
        tour_id: 'tour_ooty_nilgiris'
      });
      fetchTourists();
      setShowAddModal(false);
      setFormData({
        name: '',
        age: 29,
        gender: 'Male',
        preferred_language: 'Tamil',
        walking_preference: 'Fast',
        activity_preference: 'Adventurous',
        interests: 'Photography, Trekking, Flora',
        accessibility_requirements: 'None',
        emergency_contact_name: 'Contact Person',
        emergency_contact_phone: '+91 98451 00000',
        group_id: ''
      });
      fetchTourists();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTourist = async (id) => {
    const target = tourists.find((t) => t.id === id);
    const targetName = target?.name;
    if (confirm(`Are you sure you want to remove tourist ${targetName || ''}?`)) {
      try {
        // Optimistic UI removal
        setTourists((prev) => prev.filter((t) => t.id !== id));

        // 1. Remove from client added list
        try {
          const existing = JSON.parse(localStorage.getItem('tourism_client_added_tourists') || '[]');
          const updated = existing.filter(
            (t) => t.id !== id && t.name?.toLowerCase() !== targetName?.toLowerCase()
          );
          localStorage.setItem('tourism_client_added_tourists', JSON.stringify(updated));
        } catch (e) {}

        // 2. Add to deleted IDs blacklist
        try {
          const deletedList = JSON.parse(localStorage.getItem('tourism_deleted_tourist_ids') || '[]');
          if (!deletedList.includes(id)) deletedList.push(id);
          localStorage.setItem('tourism_deleted_tourist_ids', JSON.stringify(deletedList));

          if (targetName) {
            const deletedNames = JSON.parse(localStorage.getItem('tourism_deleted_tourist_names') || '[]');
            if (!deletedNames.includes(targetName.toLowerCase())) deletedNames.push(targetName.toLowerCase());
            localStorage.setItem('tourism_deleted_tourist_names', JSON.stringify(deletedNames));
          }
        } catch (e) {}

        // 3. Call backend API
        await touristApi.delete(id);
        fetchTourists();
      } catch (err) {
        console.error('Delete tourist error:', err);
        fetchTourists();
      }
    }
  };

  const filteredTourists = tourists.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.preferred_language.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.interests && t.interests.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesGroup =
      selectedGroupFilter === 'ALL' || t.group_id === selectedGroupFilter;
    return matchesSearch && matchesGroup;
  });

  const exportTouristManifestCSV = () => {
    if (!tourists.length) return;
    const headers = [
      'ID',
      'Name',
      'Age',
      'Gender',
      'Language',
      'Pace',
      'Activity Preference',
      'Group Name',
      'Accessibility Requirements',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Status'
    ];

    const rows = tourists.map((t) => [
      t.id,
      `"${t.name}"`,
      t.age,
      t.gender,
      t.preferred_language,
      t.walking_preference,
      t.activity_preference,
      `"${t.group_name || 'Unassigned'}"`,
      `"${t.accessibility_requirements || 'None'}"`,
      `"${t.emergency_contact_name || 'N/A'}"`,
      `"${t.emergency_contact_phone || 'N/A'}"`,
      t.status || 'ACTIVE'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nilgiris_Tour_Manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tourist Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Directory of {tourists.length} registered tourists, profiles, preferences, and micro-group assignments.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportTouristManifestCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all"
            title="Download CSV Tour Manifest for Forest Rangers & Logistics"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Manifest (CSV)</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tourist</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by tourist name, language (Tamil, Hindi...), interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        <select
          value={selectedGroupFilter}
          onChange={(e) => setSelectedGroupFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 shadow-xs"
        >
          <option value="ALL">All Groups ({tourists.length})</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tourist Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTourists.map((t) => (
          <div
            key={t.id}
            onClick={() => setSelectedTourist(t)}
            className="glass-card rounded-2xl p-5 cursor-pointer hover:border-blue-300 transition-all flex flex-col justify-between space-y-3 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                    <p className="text-[11px] text-slate-500">
                      {t.age} yrs • {t.gender}
                    </p>
                  </div>
                </div>

                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: `${t.group_color || '#3B82F6'}15`,
                    color: t.group_color || '#2563EB',
                    borderColor: `${t.group_color || '#3B82F6'}30`,
                    borderWidth: '1px'
                  }}
                >
                  {t.group_name || 'Unassigned'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <Languages className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.preferred_language}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Footprints className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pace: {t.walking_preference}</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2">
                  <HeartPulse className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{t.interests || 'Sightseeing'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
              <span className="flex items-center space-x-1">
                <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'EMERGENCY' ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="capitalize font-semibold">{t.status || 'Active'}</span>
              </span>
              <span className="font-mono">GPS: ({t.current_latitude?.toFixed(3)}, {t.current_longitude?.toFixed(3)})</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tourist Profile Modal */}
      {selectedTourist && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                  {selectedTourist.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedTourist.name}</h3>
                  <p className="text-xs text-blue-600 font-bold">
                    {selectedTourist.group_name || 'Group'} • {selectedTourist.preferred_language}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTourist(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500">Walking Pace</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedTourist.walking_preference}</p>
                </div>
                <div>
                  <span className="text-slate-500">Activity Style</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedTourist.activity_preference}</p>
                </div>
                <div>
                  <span className="text-slate-500">Accessibility</span>
                  <p className="font-bold text-amber-700 mt-0.5">{selectedTourist.accessibility_requirements || 'None'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Dietary</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedTourist.dietary_pref || 'Vegetarian'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-500">Interests</span>
                <p className="font-semibold text-slate-700 mt-0.5">{selectedTourist.interests}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Emergency Contact</span>
                  <p className="font-bold text-slate-900">{selectedTourist.emergency_contact_name || 'Relative'}</p>
                  <p className="text-slate-600">{selectedTourist.emergency_contact_phone || '+91 98451 00000'}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  handleDeleteTourist(selectedTourist.id);
                  setSelectedTourist(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold"
              >
                Remove
              </button>
              <button
                onClick={() => setSelectedTourist(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tourist Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Add New Tourist</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTourist} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Senthil Nathan"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Language</label>
                  <select
                    value={formData.preferred_language}
                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  >
                    <option value="Tamil">Tamil</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Malayalam">Malayalam</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Kannada">Kannada</option>
                    <option value="English">English</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Walking Pace</label>
                  <select
                    value={formData.walking_preference}
                    onChange={(e) => setFormData({ ...formData, walking_preference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  >
                    <option value="Fast">Fast (Trekker)</option>
                    <option value="Moderate">Moderate (Standard)</option>
                    <option value="Slow">Slow (Leisure)</option>
                    <option value="Minimal">Minimal (Wheelchair/Cane)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Activity Preference</label>
                  <select
                    value={formData.activity_preference}
                    onChange={(e) => setFormData({ ...formData, activity_preference: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  >
                    <option value="Adventurous">Adventurous</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Nature">Nature</option>
                    <option value="Relaxed">Relaxed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Interests</label>
                <input
                  type="text"
                  value={formData.interests}
                  onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                  placeholder="e.g. Photography, Tea Tasting, Botany"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
                >
                  Save Tourist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
