import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tourism_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If unauthorized and not on login page, handle appropriately
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Tour APIs
export const tourApi = {
  getAll: () => api.get('/tours'),
  getById: (id) => api.get(`/tours/${id}`),
  create: (data) => api.post('/tours', data),
  update: (id, data) => api.put(`/tours/${id}`, data),
  delete: (id) => api.delete(`/tours/${id}`),
};

// Tourist APIs
export const touristApi = {
  getAll: () => api.get('/tourists'),
  getById: (id) => api.get(`/tourists/${id}`),
  create: (data) => api.post('/tourists', data),
  update: (id, data) => api.put(`/tourists/${id}`, data),
  delete: (id) => api.delete(`/tourists/${id}`),
  bookTour: (data) => api.post('/tourists/book', data),
};

// Group APIs
export const groupApi = {
  getAll: (tourId) => api.get(`/groups${tourId ? `?tour_id=${tourId}` : ''}`),
  getStrategies: () => api.get('/groups/strategies'),
  generateAI: (data) => api.post('/groups/generate-ai', data),
  approveAI: (data) => api.post('/groups/approve-ai', data),
  moveTourist: (data) => api.post('/groups/move-tourist', data),
};

// Itinerary APIs
export const itineraryApi = {
  get: (tourId, day = 1) => api.get(`/itineraries?tour_id=${tourId}&day=${day}`),
  addItem: (data) => api.post('/itineraries/items', data),
  updateItem: (id, data) => api.put(`/itineraries/items/${id}`, data),
  applyAIAdaptation: (data) => api.post('/itineraries/apply-ai-adaptation', data),
};

// Location APIs
export const locationApi = {
  update: (data) => api.post('/locations/update', data),
  getLive: (tourId) => api.get(`/locations/live${tourId ? `?tour_id=${tourId}` : ''}`),
};

// AI APIs
export const aiApi = {
  analyze: (data) => api.post('/ai/analyze', data),
  getRecommendations: (tourId) => api.get(`/ai/recommendations${tourId ? `?tour_id=${tourId}` : ''}`),
  respond: (id, data) => api.post(`/ai/recommendations/${id}/respond`, data),
  voiceQuery: (data) => api.post('/ai/voice-query', data),
};

// Emergency APIs
export const emergencyApi = {
  getAll: (tourId) => api.get(`/emergencies${tourId ? `?tour_id=${tourId}` : ''}`),
  triggerSOS: (data) => api.post('/emergencies/sos', data),
  updateStatus: (id, data) => api.put(`/emergencies/${id}`, data),
};

// Expense & Cost Estimator APIs
export const expenseApi = {
  calculateTourCost: (data) => api.post('/expenses/tour-cost', data),
  estimateEmergencyExpense: (data) => api.post('/expenses/emergency-estimate', data),
};

// Analytics APIs
export const analyticsApi = {
  get: (tourId) => api.get(`/analytics${tourId ? `?tour_id=${tourId}` : ''}`),
  submitFeedback: (data) => api.post('/analytics/feedback', data),
};

// Broadcast Announcement APIs
export const broadcastApi = {
  getAll: (tourId, groupId) => api.get(`/broadcasts?tour_id=${tourId || 'tour_ooty_nilgiris'}${groupId ? `&group_id=${groupId}` : ''}`),
  create: (data) => api.post('/broadcasts', data),
  acknowledge: (id, data) => api.post(`/broadcasts/${id}/ack`, data),
};

// Simulation APIs
export const simulationApi = {
  gpsStep: () => api.post('/simulation/gps-step'),
  weatherDisruption: () => api.post('/simulation/weather-disruption'),
  emergencySOS: () => api.post('/simulation/emergency-sos'),
  reset: () => api.post('/simulation/reset'),
};

// Real-Time Weather Monitoring & Alerts APIs
export const weatherApi = {
  getLive: (params) => api.get('/weather/current', { params }),
  getTourDestinations: (params) => api.get('/weather/tour-destinations', { params }),
  broadcastAlert: (data) => api.post('/weather/broadcast-alert', data),
  searchPlaces: (q) => api.get(`/weather/search-places?q=${encodeURIComponent(q)}`),
};

export default api;
