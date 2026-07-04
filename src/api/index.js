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
  refuse:   (id, ignore = false) => api.post(`/api/missions/${id}/refuse`, { ignore }),
  status:   (id, data) => api.post(`/api/missions/${id}/status`, data),
  location: (id, data) => api.post(`/api/missions/${id}/location`, data),
  message:  (id, data) => api.post(`/api/missions/${id}/messages`, data),
  report:   (id, data) => api.post(`/api/missions/${id}/report`, data),
  rate:     (id, data) => api.post(`/api/missions/${id}/rate`, data),
  inbox: ()      => api.get('/api/missions/inbox'),
  seen:  (id)    => api.post(`/api/missions/${id}/seen`),
  claim: (id, comment) => api.post(`/api/missions/${id}/claim`, { comment }),
  validate:     (id)         => api.post(`/api/missions/${id}/validate`),
  transfer:     (id, data)   => api.post(`/api/missions/${id}/transfer`, data),
  assignAdmin:     (id, data)   => api.post(`/api/missions/${id}/assign-admin`, data),
  reportProblem:   (id, data)   => api.post(`/api/missions/${id}/report-problem`, data),
    myReports:       ()           => api.get('/api/missions/my-reports'),
  adminProblems:   (status)     => api.get('/api/missions/admin/problems', { params: { status } }),
  resolveReport:   (id, data)   => api.put(`/api/missions/admin/problems/${id}`, data),
  history:  (id) => api.get(`/api/missions/${id}/history`),
}

// USERS
export const usersAPI = {
    oeils:            (params) => api.get('/api/users/oeils', { params }),
    oeil:             (id)     => api.get(`/api/users/oeils/${id}`, { params: { _t: Date.now() } }),
    notifications:    ()       => api.get('/api/users/notifications'),
    markRead:         (data)   => api.put('/api/users/notifications/read', data),
    availability:     ()       => api.get('/api/users/oeil/availability'),
    oeilEarnings:     ()       => api.get('/api/users/oeil/earnings'),
    adminFinanceOeils: ()      => api.get('/api/users/admin/finance/oeils'),
   wireTransfer:     (oeilId, data) => api.post(`/api/users/admin/finance/${oeilId}/wire-transfer`, data),
    uploadAvatar:     (formData) => api.post('/api/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (data) => data,
    }),
  setAvailability:  (data)   => api.put('/api/users/oeil/availability', data),
  toggleAvailable:  ()       => api.put('/api/users/oeil/toggle-available'),
  favorites:        ()       => api.get('/api/users/favorites'),
  addFavorite:      (id)     => api.post(`/api/users/favorites/${id}`),
  removeFavorite:   (id)     => api.delete(`/api/users/favorites/${id}`),
  withdraw:         (data)   => api.post('/api/users/oeil/withdraw', data),
  validatePromo:    (data)   => api.post('/api/promo/validate', data),
  clientStats:      ()       => api.get('/api/users/client/stats'),
  identityRequests:  (status) => api.get('/api/users/admin/identity-requests', { params: { status } }),
  approveIdentity:   (id)     => api.post(`/api/users/admin/identity-requests/${id}/approve`),
  rejectIdentity:    (id, data) => api.post(`/api/users/admin/identity-requests/${id}/reject`, data),
  submitIdentity:    (data)   => api.post('/api/users/oeil/identity', data),
}

// ADMIN
export const adminAPI = {
  stats:          ()       => api.get('/api/users/admin/stats'),
  dashboardExecutif: (params) => api.get('/api/users/admin/dashboard/executif', { params }),
  dashboardAlertes: (params) => api.get('/api/users/admin/dashboard/alertes', { params }),
  dashboardServices: (params) => api.get('/api/users/admin/dashboard/services', { params }),
  dashboardFunnel: (params) => api.get('/api/users/admin/dashboard/funnel', { params }),
  dashboardGeo: (params) => api.get('/api/users/admin/dashboard/geo', { params }),
  dashboardOeils: (params) => api.get('/api/users/admin/dashboard/oeils', { params }),
  dashboardClients: (params) => api.get('/api/users/admin/dashboard/clients', { params }),
    dashboardFileAttente: (params) => api.get('/api/users/admin/dashboard/fileattente', { params }),
  users:          (params) => api.get('/api/users/admin/all', { params }),
  verifyOeil:     (id)     => api.put(`/api/users/admin/${id}/verify-oeil`),
  toggleActive:   (id)     => api.put(`/api/users/admin/${id}/toggle-active`),
  withdrawals:    ()       => api.get('/api/users/admin/withdrawals'),
  processWithdraw:(id, data) => api.put(`/api/users/admin/withdrawals/${id}`, data),
  fraudDashboard: ()       => api.get('/api/anti-fraud/dashboard', { params: { _t: Date.now() } }),
  settings:       ()       => api.get('/api/users/admin/settings'),
  saveSettings:   (data)   => api.put('/api/users/admin/settings', data),
  claims:         ()       => api.get('/api/users/admin/claims'),
  flaggedMessages: () => api.get('/api/users/admin/flagged-messages'),
  warnUser: (userId, data) => api.post(`/api/anti-fraud/warn/${userId}`, data),


resolveClaim:    (id, decision) => api.put(`/api/users/admin/claims/${id}/resolve`, { decision }),
identityRequests:(status)       => api.get('/api/users/admin/identity-requests', { params: { status } }),
  admins:          ()             => api.get('/api/super-admin/admins'),
  createAdmin:     (data)         => api.post('/api/super-admin/admins', data),
  updateAdmin:     (id, data)     => api.put(`/api/super-admin/admins/${id}`, data),
  deleteAdmin:     (id)           => api.delete(`/api/super-admin/admins/${id}`),
  promos:          ()             => api.get('/api/promo/admin'),
  createPromo:     (data)         => api.post('/api/promo/admin', data),
  togglePromo:     (id)           => api.put(`/api/promo/admin/${id}/toggle`),
  deletePromo:     (id)           => api.delete(`/api/promo/admin/${id}`),
approveIdentity: (id)           => api.post(`/api/users/admin/identity-requests/${id}/approve`),
rejectIdentity:  (id, data)     => api.post(`/api/users/admin/identity-requests/${id}/reject`, data),
}

export const reliabilityAPI = {
    me:             ()           => api.get('/api/reliability/me'),
    requestReview:  (data)       => api.post('/api/reliability/review-request', data),
    adminRequests:  (status)     => api.get('/api/reliability/admin/requests', { params: { status } }),
    adminHistory:   (oeilId)     => api.get(`/api/reliability/admin/${oeilId}/history`),
    decideRequest:  (id, data)   => api.post(`/api/reliability/admin/requests/${id}/decide`, data),
    adminSuspended: ()           => api.get('/api/reliability/admin/suspended'),
    adminAllScores: (params)     => api.get('/api/reliability/admin/all-scores', { params }),
    adminReactivate: (oeilId, data) => api.post(`/api/reliability/admin/${oeilId}/reactivate`, data),
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
