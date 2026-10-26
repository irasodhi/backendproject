/**
 * CampusFind API Client
 * Wraps all backend REST API calls. Used by the frontend pages.
 * Base URL: change to your deployed server URL when going to production.
 */
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '' ||
  window.location.protocol === 'file:'
);

const API_BASE = isLocalhost ? 'http://localhost:5000/api' : '/api';

// ─── Token helpers ────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem('campusfind_token') || null;
}

function setToken(token) {
  localStorage.setItem('campusfind_token', token);
}

function clearToken() {
  localStorage.removeItem('campusfind_token');
}

// ─── Generic fetch wrapper ────────────────────────────────────────────
async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = false) {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (requiresAuth) {
    throw new Error('Not authenticated. Please sign in.');
  }

  const config = { method, headers };
  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutMs = body ? 12000 : 8000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  config.signal = controller.signal;

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Server request timed out after ${timeoutMs / 1000}s. Running locally.`);
    }
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Is the backend running on port 5000?');
    }
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  AUTH ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

const AuthAPI = {
  /**
   * Register a new user account.
   * @param {string} username  Full name
   * @param {string} useremail Email address
   * @param {string} userpassword Password
   * @param {string} [contactPhone] Optional phone number
   * @returns {Promise<{success, token, user, message}>}
   */
  async signup(username, useremail, userpassword, contactPhone = '') {
    const data = await apiRequest('/auth/signup', 'POST', {
      username, useremail, userpassword, contactPhone,
    });
    if (data.token) setToken(data.token);
    return data;
  },

  /**
   * Log in with email and password.
   * @param {string} useremail
   * @param {string} userpassword
   * @returns {Promise<{success, token, user, message}>}
   */
  async login(useremail, userpassword) {
    const data = await apiRequest('/auth/login', 'POST', { useremail, userpassword });
    if (data.token) setToken(data.token);
    return data;
  },

  /**
   * Get current logged-in user's profile.
   * @returns {Promise<{success, user}>}
   */
  async getMe() {
    return await apiRequest('/auth/me', 'GET', null, true);
  },

  /**
   * Update current user's profile (name, phone).
   * @param {object} updates  { username?, contactPhone? }
   * @returns {Promise<{success, user, message}>}
   */
  async updateProfile(updates) {
    return await apiRequest('/auth/profile', 'PUT', updates, true);
  },

  /**
   * Fetch all registered accounts from backend.
   * @returns {Promise<{success, users}>}
   */
  async getUsers() {
    return await apiRequest('/auth/users', 'GET', null, false);
  },

  /** Log out the current user (clears token and localStorage). */
  logout() {
    clearToken();
    localStorage.removeItem('current_user');
    localStorage.removeItem('isLoggedIn');
  },
};

// ═══════════════════════════════════════════════════════════════════
//  REPORTS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

const ReportsAPI = {
  /**
   * Fetch all reports, with optional filters.
   * @param {object} [filters]  { type, category, zone, status, search, page, limit }
   * @returns {Promise<{success, reports, total, page}>}
   */
  async getAll(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await apiRequest(`/reports${params ? '?' + params : ''}`);
  },

  /**
   * Fetch dashboard statistics.
   * @returns {Promise<{success, stats: {totalLost, totalFound, totalReturned, activeSearching}}>}
   */
  async getStats() {
    return await apiRequest('/reports/stats');
  },

  /**
   * Get reports submitted by the current user.
   * @returns {Promise<{success, reports}>}
   */
  async getMine() {
    return await apiRequest('/reports/my', 'GET', null, true);
  },

  /**
   * Get a single report by its MongoDB _id or custom REP-XXXX id.
   * @param {string} id
   * @returns {Promise<{success, report}>}
   */
  async getById(id) {
    return await apiRequest(`/reports/${id}`);
  },

  /**
   * Submit a new lost or found report.
   * @param {object} reportData  { type, itemName, category, color, zone, date, description, hiddenDetails, image, contactPhone }
   * @returns {Promise<{success, report, message}>}
   */
  async create(reportData) {
    return await apiRequest('/reports', 'POST', reportData, false);
  },

  /**
   * Update an existing report (owner only).
   * @param {string} id  MongoDB _id
   * @param {object} updates
   * @returns {Promise<{success, report, message}>}
   */
  async update(id, updates) {
    return await apiRequest(`/reports/${id}`, 'PUT', updates, true);
  },

  /**
   * Delete a report (owner or admin only).
   * @param {string} id  MongoDB _id
   * @returns {Promise<{success, message}>}
   */
  async delete(id) {
    return await apiRequest(`/reports/${id}`, 'DELETE', null, true);
  },
};

// ═══════════════════════════════════════════════════════════════════
//  CLAIMS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

const ClaimsAPI = {
  /**
   * Get all claims for the current user (as claimant or owner).
   * @returns {Promise<{success, claims}>}
   */
  async getMyClaims(email = '') {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    return await apiRequest(`/claims${q}`, 'GET', null, false);
  },

  /**
   * Get a specific claim by its CLM- ID.
   * @param {string} claimId
   * @returns {Promise<{success, claim}>}
   */
  async getById(claimId) {
    return await apiRequest(`/claims/${claimId}`, 'GET', null, false);
  },

  /**
   * Submit a claim on a report.
   * @param {object} claimData
   * @returns {Promise<{success, claim, message}>}
   */
  async create(claimData) {
    return await apiRequest('/claims', 'POST', claimData, false);
  },

  /**
   * Update claim status.
   * @param {string} claimId
   * @param {object} updates
   * @returns {Promise<{success, claim, message}>}
   */
  async updateStatus(claimId, updates) {
    return await apiRequest(`/claims/${claimId}/status`, 'PUT', updates, false);
  },

  /**
   * Send a chat message in a claim conversation.
   * @param {string} claimId
   * @param {string} text
   * @param {string} [type='text']
   * @returns {Promise<{success, message}>}
   */
  async sendMessage(claimId, text, type = 'text') {
    return await apiRequest(`/claims/${claimId}/messages`, 'POST', { text, type }, false);
  },
};

// ═══════════════════════════════════════════════════════════════════
//  NOTIFICATIONS ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

const NotificationsAPI = {
  /**
   * Fetch all notifications for the current user.
   * @param {string} [email]
   * @returns {Promise<{success, notifications}>}
   */
  async getAll(email = '') {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    return await apiRequest(`/notifications${q}`, 'GET', null, false);
  },

  /**
   * Create a new notification.
   * @param {object} notifData
   * @returns {Promise<{success, notification}>}
   */
  async create(notifData) {
    return await apiRequest('/notifications', 'POST', notifData, false);
  },

  /**
   * Mark all notifications as read.
   * @param {string} [email]
   * @returns {Promise<{success, message}>}
   */
  async markAllRead(email = '') {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    return await apiRequest(`/notifications/read-all${q}`, 'PUT', null, false);
  },

  /**
   * Clear (delete) all notifications.
   * @param {string} [email]
   * @returns {Promise<{success, message}>}
   */
  async clearAll(email = '') {
    const q = email ? `?email=${encodeURIComponent(email)}` : '';
    return await apiRequest(`/notifications/clear${q}`, 'DELETE', null, false);
  },

  /**
   * Delete a single notification.
   * @param {string} id  Notification ID (NOTIF-XXXX)
   * @returns {Promise<{success, message}>}
   */
  async deleteOne(id) {
    return await apiRequest(`/notifications/${id}`, 'DELETE', null, false);
  },
};

// ─── Export ───────────────────────────────────────────────────────────
// These globals are available to all scripts on the page
window.CampusFindAPI = {
  auth:          AuthAPI,
  reports:       ReportsAPI,
  claims:        ClaimsAPI,
  notifications: NotificationsAPI,
  getToken,
  setToken,
  clearToken,
};

console.log('%c🎓 CampusFind API Client loaded', 'color:#00e676;font-weight:bold;font-size:13px;');
