// Popup logic: Login via Supabase Auth REST, fetch last 10 words from backend

// Configure these via extension options or inline (safe: anon key only)
const SUPABASE_URL = 'https://udykdytmggswelwkrixi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWtkeXRtZ2dzd2Vsd2tyaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDMzOTAsImV4cCI6MjA3ODAxOTM5MH0.PGufPyetZGyN2pndysxkCy8rKvDItWfJH_KP2hOxM88'
const API_BASE = 'https://dictionary-backend.business-altuntass.workers.dev' // e.g. https://dictionary-backend.xxx.workers.dev

const storage = chrome.storage?.local

const els = {
  authView: document.getElementById('auth-view'),
  wordsView: document.getElementById('words-view'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  loginForm: document.getElementById('login-form'),
  authError: document.getElementById('auth-error'),
  wordList: document.getElementById('word-list'),
  signout: document.getElementById('signout'),
  openWeb: document.getElementById('open-web'),
}

els.openWeb.href = 'https://dictionary-extension.pages.dev/'

async function getSessionToken() {
  if (!storage) return null
  const v = await storage.get('ws_token')
  return v?.ws_token || null
}

async function render() {
  const token = await getSessionToken()
  if (!token) {
    els.authView.classList.remove('hidden')
    els.wordsView.classList.add('hidden')
    return
  }
  els.authView.classList.add('hidden')
  els.wordsView.classList.remove('hidden')
  await loadWords(token)
}

async function loadWords(token) {
  try {
    const res = await fetch(`${API_BASE}/api/words`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    const words = (data.words || [])
      .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
    els.wordList.innerHTML = words.map(w => `<li><strong>${escapeHtml(w.word)}</strong><br/><span style="color:#6B5B53">${escapeHtml(w.meaning || '')}</span></li>`).join('')
  } catch (e) {
    els.wordList.innerHTML = `<li class="error">Failed to load: ${e.message}</li>`
  }
}

els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  els.authError.textContent = ''
  try {
    const email = els.email.value.trim()
    const password = els.password.value.trim()
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error_description || data?.error || 'Login failed')
    const token = data.access_token
    if (!token) throw new Error('No access token')
    if (storage) await storage.set({ ws_token: token })
    await render()
    // Persist token to background for content script usage
    chrome.runtime?.sendMessage({ type: 'SESSION_UPDATED', token })
  } catch (err) {
    els.authError.textContent = err.message
  }
})

els.signout.addEventListener('click', async () => {
  if (storage) await storage.remove('ws_token')
  chrome.runtime?.sendMessage({ type: 'SESSION_UPDATED', token: null })
  await render()
})

function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])) }

render()


