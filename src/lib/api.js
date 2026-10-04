import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5051/api'

// The session lives in httpOnly cookies the page cannot read
const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
  timeout: 20000,
})

// Earlier versions kept the token in localStorage; make sure no copy lingers
try {
  localStorage.removeItem('scholaris.token')
} catch {
  // storage unavailable: nothing to clean up
}

// One refresh at a time: concurrent 401s wait for the same renewal
let refreshing = null
function refreshSession() {
  if (!refreshing) {
    // `{}`, not null: a JSON body of "null" is rejected by the API's strict JSON parser
    refreshing = http.post('/auth/refresh', {}, { _noRefresh: true }).finally(() => {
      refreshing = null
    })
  }
  return refreshing
}

// Endpoints where a 401 means "wrong credentials", not "session expired"
const NO_REFRESH = ['/auth/login', '/auth/verify-otp', '/auth/resend-otp', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/session-end']

// Normalises every failure into one shape
class ApiError extends Error {
  constructor(message, { fields, status } = {}) {
    super(message)
    this.name = 'ApiError'
    this.fields = fields || null
    this.status = status ?? 0
  }
}

let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Access cookie expired → renew once with the refresh cookie, then replay
    const original = error.config || {}
    const path = original.url || ''
    if (error.response?.status === 401 && !original._noRefresh && !original._retried && !NO_REFRESH.some((p) => path.startsWith(p))) {
      try {
        await refreshSession()
        return http({ ...original, _retried: true })
      } catch {
        // fall through: the session is really over
      }
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new ApiError('The server took too long to respond. Please try again.'))
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError(
          `Cannot reach the API at ${BASE_URL}. Make sure the backend is running (cd server && npm run dev).`,
        ),
      )
    }

    const { status, data } = error.response
    const message = data?.message || 'Something went wrong. Please try again.'

    // Session over and could not be renewed: bounce to the login page
    if (status === 401 && !NO_REFRESH.some((p) => path.startsWith(p))) {
      onUnauthorized?.()
    }

    return Promise.reject(new ApiError(message, { fields: data?.fields, status }))
  },
)

// Thin verb helpers: every one returns the parsed response body
const unwrap = (res) => res.data

export const api = {
  get: (url, config) => http.get(url, config).then(unwrap),
  post: (url, body, config) => http.post(url, body, config).then(unwrap),
  put: (url, body, config) => http.put(url, body, config).then(unwrap),
  patch: (url, body, config) => http.patch(url, body, config).then(unwrap),
  delete: (url, config) => http.delete(url, config).then(unwrap),
}

// Drops undefined/empty values so we never send `?status=` or `?search=`
export function params(obj = {}) {
  const out = {}
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') out[k] = v
  })
  return out
}

// Pages through a list endpoint (100 at a time: the API's cap) and returns every row
export async function fetchAll(list, query = {}) {
  const out = []
  for (let page = 1; page <= 500; page += 1) {
    const res = await list({ ...query, page, limit: 100 })
    out.push(...(res.data ?? []))
    if (!res.pagination?.hasNext) break
  }
  return out
}

// Endpoints: one function per action in the UI
export const endpoints = {
  auth: {
    login: (body) => api.post('/auth/login', body),
    verifyOtp: (body) => api.post('/auth/verify-otp', body),
    resendOtp: (body) => api.post('/auth/resend-otp', body),
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
    logoutAll: () => api.post('/auth/logout-all'),
    endSession: () => api.post('/auth/session-end'),
    changePassword: (body) => api.patch('/auth/password', body),
    forgotPassword: (body) => api.post('/auth/forgot-password', body),
    resetPassword: (body) => api.post('/auth/reset-password', body),
  },
  auditLogs: {
    list: (query) => api.get('/audit-logs', { params: params(query) }),
  },
  dashboard: {
    admin: () => api.get('/dashboard/admin'),
    analytics: (months) => api.get('/dashboard/analytics', { params: { months } }),
    teacher: () => api.get('/dashboard/teacher'),
    student: () => api.get('/dashboard/student'),
  },
  students: {
    list: (query) => api.get('/students', { params: params(query) }),
    get: (id) => api.get(`/students/${id}`),
    create: (body) => api.post('/students', body),
    update: (id, body) => api.put(`/students/${id}`, body),
    remove: (id) => api.delete(`/students/${id}`),
  },
  teachers: {
    list: (query) => api.get('/teachers', { params: params(query) }),
    get: (id) => api.get(`/teachers/${id}`),
    create: (body) => api.post('/teachers', body),
    update: (id, body) => api.put(`/teachers/${id}`, body),
    remove: (id) => api.delete(`/teachers/${id}`),
    myClasses: () => api.get('/teachers/me/classes'),
  },
  classes: {
    list: (query) => api.get('/classes', { params: params(query) }),
    get: (id) => api.get(`/classes/${id}`),
    create: (body) => api.post('/classes', body),
    update: (id, body) => api.put(`/classes/${id}`, body),
    remove: (id) => api.delete(`/classes/${id}`),
  },
  subjects: {
    list: (query) => api.get('/subjects', { params: params(query) }),
    create: (body) => api.post('/subjects', body),
    update: (id, body) => api.put(`/subjects/${id}`, body),
    remove: (id) => api.delete(`/subjects/${id}`),
  },
  attendance: {
    register: (query) => api.get('/attendance/register', { params: params(query) }),
    mark: (body) => api.post('/attendance', body),
    overview: (query) => api.get('/attendance/overview', { params: params(query) }),
    mine: () => api.get('/attendance/me'),
  },
  exams: {
    list: (query) => api.get('/exams', { params: params(query) }),
    create: (body) => api.post('/exams', body),
    update: (id, body) => api.put(`/exams/${id}`, body),
    remove: (id) => api.delete(`/exams/${id}`),
    mine: () => api.get('/exams/me'),
  },
  results: {
    list: (query) => api.get('/results', { params: params(query) }),
    sheet: (examId) => api.get(`/results/sheet/${examId}`),
    save: (body) => api.post('/results', body),
    mine: () => api.get('/results/me'),
  },
  assignments: {
    list: (query) => api.get('/assignments', { params: params(query) }),
    get: (id) => api.get(`/assignments/${id}`),
    create: (body) => api.post('/assignments', body),
    update: (id, body) => api.put(`/assignments/${id}`, body),
    remove: (id) => api.delete(`/assignments/${id}`),
    grade: (id, body) => api.patch(`/assignments/${id}/grade`, body),
    mine: () => api.get('/assignments/me'),
    submit: (id, body) => api.post(`/assignments/${id}/submit`, body),
  },
  fees: {
    list: (query) => api.get('/fees', { params: params(query) }),
    summary: () => api.get('/fees/summary'),
    create: (body) => api.post('/fees', body),
    update: (id, body) => api.put(`/fees/${id}`, body),
    remove: (id) => api.delete(`/fees/${id}`),
    remind: (id) => api.post(`/fees/${id}/remind`),
    mine: () => api.get('/fees/me'),
  },
  timetable: {
    get: (classRoom) => api.get('/timetable', { params: { classRoom } }),
    save: (classRoomId, body) => api.put(`/timetable/${classRoomId}`, body),
    mine: () => api.get('/timetable/me'),
  },
  announcements: {
    list: (query) => api.get('/announcements', { params: params(query) }),
    create: (body) => api.post('/announcements', body),
    update: (id, body) => api.put(`/announcements/${id}`, body),
    remove: (id) => api.delete(`/announcements/${id}`),
  },
  settings: {
    get: () => api.get('/settings'),
    update: (body) => api.put('/settings', body),
  },
}

export default endpoints
