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

  example: (word, targetLang) =>
    apiRequest('/api/example', {
      method: 'POST',
      body: JSON.stringify({ word, target_lang: targetLang }),
    }),

  export: async (format = 'json') => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || localStorage.getItem('supabase.auth.token');
    const res = await fetch(`${API_BASE}/api/export?format=${format}`, {
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
};

