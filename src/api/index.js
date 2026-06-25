import api from './client'

// AUTH
export const authAPI = {
  login:    (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me:       ()     => api.get('/api/auth/me'),
  update:   (data) => api.put('/api/auth/me', data),
  password: (data) => api.put('/api/auth/password', data),
}

// MISSIONS
export const missionsAPI = {
  list:     (params) => api.get('/api/missions', { params }),
  get:      (id)     => api.get(`/api/missions/${id}`),
  create:   (data)   => api.post('/api/missions', data),
  accept:   (id)     => api.post(`/api/missions/${id}/accept`),
  interest:  (id)    => api.post(`/api/missions/${id}/interest`),
  interests: (id)    => api.get(`/api/missions/${id}/interests`),
  hire:      (id, oeilId)   => api.post(`/api/missions/${id}/hire/${oeilId}`),
  refuse:   (id)     => api.post(`/api/missions/${id}/refuse`),
  status:   (id, data) => api.post(`/api/missions/${id}/status`, data),
  location: (id, data) => api.post(`/api/missions/${id}/location`, data),
  message:  (id, data) => api.post(`/api/missions/${id}/messages`, data),
  report:   (id, data) => api.post(`/api/missions/${id}/report`, data),
  rate:     (id, data) => api.post(`/api/missions/${id}/rate`, data),
  inbox: ()      => api.get('/api/missions/inbox'),
  seen:  (id)    => api.post(`/api/missions/${id}/seen`),
}

// USERS
export const usersAPI = {
  oeils:            (params) => api.get('/api/users/oeils', { params }),
  oeil:             (id)     => api.get(`/api/users/oeils/${id}`),
  notifications:    ()       => api.get('/api/users/notifications'),
  markRead:         (data)   => api.put('/api/users/notifications/read', data),
  availability:     ()       => api.get('/api/users/oeil/availability'),
  setAvailability:  (data)   => api.put('/api/users/oeil/availability', data),
  toggleAvailable:  ()       => api.put('/api/users/oeil/toggle-available'),
  favorites:        ()       => api.get('/api/users/favorites'),
  addFavorite:      (id)     => api.post(`/api/users/favorites/${id}`),
  removeFavorite:   (id)     => api.delete(`/api/users/favorites/${id}`),
  withdraw:         (data)   => api.post('/api/users/oeil/withdraw', data),
}

// ADMIN
export const adminAPI = {
  stats:          ()       => api.get('/api/users/admin/stats'),
  users:          (params) => api.get('/api/users/admin/all', { params }),
  verifyOeil:     (id)     => api.put(`/api/users/admin/${id}/verify-oeil`),
  toggleActive:   (id)     => api.put(`/api/users/admin/${id}/toggle-active`),
  withdrawals:    ()       => api.get('/api/users/admin/withdrawals'),
  processWithdraw:(id, data) => api.put(`/api/users/admin/withdrawals/${id}`, data),
  fraudDashboard: ()       => api.get('/api/anti-fraud/dashboard'),
}

// MEDIA
export const mediaAPI = {
    upload: (missionId, formData) =>
      api.post(`/api/media/${missionId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: (data) => data,
      }),
  list: (missionId) => api.get(`/api/media/${missionId}`),
}

// REPORTS
export const reportsAPI = {
  get:    (missionId) => api.get(`/api/reports/${missionId}`),
  save:   (missionId, data, submitted = false) => api.post(`/api/reports/${missionId}`, { data, submitted }),
}
