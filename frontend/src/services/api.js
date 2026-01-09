import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// News API
export const newsAPI = {
  getAll: (skip = 0, limit = 10) => api.get(`/news?skip=${skip}&limit=${limit}`),
  getById: (id) => api.get(`/news/${id}`),
  create: (data) => api.post('/news', data),
  update: (id, data) => api.put(`/news/${id}`, data),
  delete: (id) => api.delete(`/news/${id}`),
};

// Congress API
export const congressAPI = {
  getAll: () => api.get('/congress'),
  getById: (id) => api.get(`/congress/${id}`),
  register: (congressId, data) => api.post(`/congress/${congressId}/register`, data),
};

// Rheumatology API
export const rheumatologyAPI = {
  getCenters: () => api.get('/rheumatology/centers'),
  getDoctors: (chiefOnly = false) => api.get(`/rheumatology/doctors?chief_only=${chiefOnly}`),
  getDiseases: () => api.get('/rheumatology/diseases'),
  getDiseaseById: (id) => api.get(`/rheumatology/diseases/${id}`),
  applyToSchool: (data) => api.post('/rheumatology/school/apply', data),
  getMembers: () => api.get('/rheumatology/members'),
  getPartners: () => api.get('/rheumatology/partners'),
};

export default api;
