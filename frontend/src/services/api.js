import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

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
      // Не редиректим если это публичный эндпоинт
      if (!window.location.pathname.includes('/admin')) {
        // Можно не редиректить для публичных страниц
      } else {
        window.location.href = '/login';
      }
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

// ==================== CONTENT API ====================
export const contentAPI = {
  // Board Members
  getBoardMembers: (includeInactive = false) =>
    api.get('/content/board-members', { params: { include_inactive: includeInactive } }),
  getBoardMember: (id) => api.get(`/content/board-members/${id}`),
  createBoardMember: (data) => api.post('/content/board-members', data),
  updateBoardMember: (id, data) => api.put(`/content/board-members/${id}`, data),
  deleteBoardMember: (id) => api.delete(`/content/board-members/${id}`),

  // Partners
  getPartners: (includeInactive = false) =>
    api.get('/content/partners', { params: { include_inactive: includeInactive } }),
  getPartner: (id) => api.get(`/content/partners/${id}`),
  createPartner: (data) => api.post('/content/partners', data),
  updatePartner: (id, data) => api.put(`/content/partners/${id}`, data),
  deletePartner: (id) => api.delete(`/content/partners/${id}`),

  // Charter
  getCharter: () => api.get('/content/charter'),
  getCharters: () => api.get('/content/charters'),
  createCharter: (data) => api.post('/content/charters', data),
  updateCharter: (id, data) => api.put(`/content/charters/${id}`, data),
  deleteCharter: (id) => api.delete(`/content/charters/${id}`),

  // Chief Rheumatologists
  getChiefRheumatologists: (includeInactive = false) =>
    api.get('/content/chief-rheumatologists', { params: { include_inactive: includeInactive } }),
  getChiefRheumatologist: (id) => api.get(`/content/chief-rheumatologists/${id}`),
  createChiefRheumatologist: (data) => api.post('/content/chief-rheumatologists', data),
  updateChiefRheumatologist: (id, data) => api.put(`/content/chief-rheumatologists/${id}`, data),
  deleteChiefRheumatologist: (id) => api.delete(`/content/chief-rheumatologists/${id}`),

  // Diseases
  getDiseases: (includeInactive = false) =>
    api.get('/content/diseases', { params: { include_inactive: includeInactive } }),
  getDisease: (id) => api.get(`/content/diseases/${id}`),
  createDisease: (data) => api.post('/content/diseases', data),
  updateDisease: (id, data) => api.put(`/content/diseases/${id}`, data),
  deleteDisease: (id) => api.delete(`/content/diseases/${id}`),

  // Disease Documents
  getDiseaseDocuments: (diseaseId = null, includeInactive = false) =>
    api.get('/content/disease-documents', { params: { disease_id: diseaseId, include_inactive: includeInactive } }),
  createDiseaseDocument: (data) => api.post('/content/disease-documents', data),
  updateDiseaseDocument: (id, data) => api.put(`/content/disease-documents/${id}`, data),
  deleteDiseaseDocument: (id) => api.delete(`/content/disease-documents/${id}`),

  // Rheumatology Centers
  getCenters: (includeInactive = false) =>
    api.get('/content/centers', { params: { include_inactive: includeInactive } }),
  getCenter: (id) => api.get(`/content/centers/${id}`),
  getCenterWithStaff: (id) => api.get(`/content/centers/${id}/with-staff`),
  createCenter: (data) => api.post('/content/centers', data),
  updateCenter: (id, data) => api.put(`/content/centers/${id}`, data),
  deleteCenter: (id) => api.delete(`/content/centers/${id}`),

  // Center Staff
  getCenterStaff: (centerId = null, includeInactive = false) =>
    api.get('/content/center-staff', { params: { center_id: centerId, include_inactive: includeInactive } }),
  getStaffMember: (id) => api.get(`/content/center-staff/${id}`),
  createStaffMember: (data) => api.post('/content/center-staff', data),
  updateStaffMember: (id, data) => api.put(`/content/center-staff/${id}`, data),
  deleteStaffMember: (id) => api.delete(`/content/center-staff/${id}`),

  // News
  getNews: (newsType = null, publishedOnly = true, skip = 0, limit = 20) =>
    api.get('/content/news', { params: { news_type: newsType, published_only: publishedOnly, skip, limit } }),
  getFeaturedNews: (limit = 10) =>
    api.get('/content/news/featured', { params: { limit } }),
  getEvents: (upcomingOnly = true, limit = 10) =>
    api.get('/content/news/events', { params: { upcoming_only: upcomingOnly, limit } }),
  getNewsItem: (id) => api.get(`/content/news/${id}`),
  createNews: (data) => api.post('/content/news', data),
  updateNews: (id, data) => api.put(`/content/news/${id}`, data),
  deleteNews: (id) => api.delete(`/content/news/${id}`),

  // File Upload
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/content/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
