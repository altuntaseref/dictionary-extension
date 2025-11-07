import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787';

async function apiRequest(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || localStorage.getItem('supabase.auth.token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || 'Request failed');
  }

  return res.json();
}

export const api = {
  translate: (word, sourceLang, targetLang) =>
    apiRequest('/api/translate', {
      method: 'POST',
      body: JSON.stringify({ word, source_lang: sourceLang, target_lang: targetLang }),
    }),

  example: (word, targetLang, translationLang) =>
    apiRequest('/api/example', {
      method: 'POST',
      body: JSON.stringify({ word, target_lang: targetLang, translation_lang: translationLang }),
    }),

  getPlans: () => apiRequest('/api/plans', { method: 'GET' }),

  // Get words (no plan check)
  getWords: (groupId = null) => {
    const url = new URL(`${API_BASE}/api/words`);
    if (groupId) {
      url.searchParams.set('group_id', groupId);
    }
    return apiRequest(url.pathname + url.search, { method: 'GET' });
  },

  export: async (format = 'json', groupId = null) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || localStorage.getItem('supabase.auth.token');
    const url = new URL(`${API_BASE}/api/export`);
    url.searchParams.set('format', format);
    if (groupId) {
      url.searchParams.set('group_id', groupId);
    }
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: { message: 'Export failed' } }));
      throw new Error(error.error?.message || 'Export failed');
    }
    if (format === 'csv') {
      return res.text();
    }
    return res.json();
  },

  // User plan info
  getUserPlan: () => apiRequest('/api/user/plan', { method: 'GET' }),

  // Groups API
  getGroups: () => apiRequest('/api/groups', { method: 'GET' }),
  createGroup: (name) =>
    apiRequest('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  updateGroup: (groupId, name) =>
    apiRequest(`/api/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),
  deleteGroup: (groupId) =>
    apiRequest(`/api/groups/${groupId}`, {
      method: 'DELETE',
    }),

  // Word group assignment
  assignWordToGroup: (wordId, groupId) =>
    apiRequest(`/api/words/${wordId}/group`, {
      method: 'PUT',
      body: JSON.stringify({ group_id: groupId }),
    }),

  // Admin API
  admin: {
    getPlans: () => apiRequest('/api/admin/plans', { method: 'GET' }),
    updatePlan: (planId, updates) =>
      apiRequest(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    getUsers: (page = 1, limit = 50) =>
      apiRequest(`/api/admin/users?page=${page}&limit=${limit}`, { method: 'GET' }),
    assignPlan: (userId, planId, expiresAt = null) =>
      apiRequest('/api/admin/users/assign-plan', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, plan_id: planId, expires_at: expiresAt }),
      }),
    getUserPlan: (userId) =>
      apiRequest(`/api/admin/users/${userId}/plan`, { method: 'GET' }),
  },
};
