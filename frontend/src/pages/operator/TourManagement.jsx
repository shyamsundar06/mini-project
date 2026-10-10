import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Calendar,
  Users,
  DollarSign,
  Layers,
  Sparkles,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';
import { tourApi } from '../../services/api';

export default function TourManagement() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    primary_destination: '',
    start_date: '2026-09-01',
    end_date: '2026-09-04',
    budget: 180000,
    max_capacity: 25,
    destinations: [
      { name: 'Ooty Botanical Gardens', latitude: 11.4190, longitude: 76.7112, arrival_time: '09:30 AM', departure_time: '12:00 PM' },
      { name: 'Doddabetta Peak', latitude: 11.4010, longitude: 76.7350, arrival_time: '02:00 PM', departure_time: '04:30 PM' }
    ],
    activities: [
      { title: 'Botanical Heritage Guided Tour', activity_type: 'sightseeing', duration_minutes: 90, cost: 150, is_weather_sensitive: true },
      { title: 'Tea Processing & Tasting', activity_type: 'indoor', duration_minutes: 60, cost: 250, is_weather_sensitive: false }
    ]
  });

  const fetchTours = async () => {
    try {
      setLoading(true);
      const res = await tourApi.getAll();
      if (res.data?.tours) {
        setTours(res.data.tours);
      }
    } catch (err) {
      console.error('Error fetching tours:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleViewTour = async (id) => {
    try {
      const res = await tourApi.getById(id);
      if (res.data?.tour) {
        setSelectedTour(res.data.tour);
      }
    } catch (err) {
      console.error('Error fetching tour details:', err);
    }
  };

  const handleCreateTour = async (e) => {
    e.preventDefault();
    try {
      await tourApi.create(formData);
      setShowCreateModal(false);
      fetchTours();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDeleteTour = async (id) => {
    if (confirm('Are you sure you want to delete this tour?')) {
      try {
        await tourApi.delete(id);
        fetchTours();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tour Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure tour packages, destinations, activities, capacities, and itineraries.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Tour</span>
        </button>
      </div>

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tours.map((tour) => (
          <div
            key={tour.id}
            className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all group shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    tour.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {tour.status}
                </span>
                <span className="text-xs font-bold text-blue-600">₹{Number(tour.budget).toLocaleString()}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors">
                {tour.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tour.description}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{tour.primary_destination}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {tour.touristsCount || 16} / {tour.max_capacity || 25} pax
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tour.start_date}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{tour.groupsCount || 3} Groups</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => handleViewTour(tour.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 border border-slate-200"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Details</span>
                </button>
                <button
                  onClick={() => handleDeleteTour(tour.id)}
                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tour Detail Modal */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                  {selectedTour.status}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedTour.title}</h3>
                <p className="text-xs text-slate-500">{selectedTour.primary_destination}</p>
              </div>
              <button
                onClick={() => setSelectedTour(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Duration</span>
                <p className="font-bold text-slate-800 mt-0.5">
                  {selectedTour.start_date} to {selectedTour.end_date}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Budget</span>
                <p className="font-bold text-blue-600 mt-0.5">₹{Number(selectedTour.budget).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-slate-500">Capacity</span>
                <p className="font-bold text-emerald-600 mt-0.5">{selectedTour.tourists?.length || 16} Tourists</p>
              </div>
            </div>

            {/* Destinations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Destinations</h4>
              <div className="space-y-2">
                {selectedTour.destinations?.map((d) => (
                  <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{d.name}</p>
                      <p className="text-slate-500 text-[11px]">{d.description}</p>
                    </div>
                    <span className="text-slate-400 text-[10px]">{d.arrival_time} - {d.departure_time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Activities</h4>
              <div className="space-y-2">
                {selectedTour.activities?.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{a.title}</p>
                      <p className="text-slate-500 text-[11px] capitalize">{a.activity_type} • {a.duration_minutes} mins</p>
                    </div>
                    <span className="text-blue-600 font-bold">₹{a.cost}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedTour(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Create Tour Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Create New Tour</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTour} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tour Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Kodaikanal Pine Forest Explorer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Primary Destination</label>
                <input
                  type="text"
                  required
                  value={formData.primary_destination}
                  onChange={(e) => setFormData({ ...formData, primary_destination: e.target.value })}
                  placeholder="e.g. Kodaikanal, Tamil Nadu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tour Budget (₹)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={formData.max_capacity}
                    onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed tour itinerary notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
                >
                  Create Tour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
