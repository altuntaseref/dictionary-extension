import { useState, useEffect } from 'react'
import Login from './components/Login'
import WordsList from './components/WordsList'

const SUPABASE_URL = 'https://udykdytmggswelwkrixi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkeWtkeXRtZ2dzd2Vsd2tyaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDMzOTAsImV4cCI6MjA3ODAxOTM5MH0.PGufPyetZGyN2pndysxkCy8rKvDItWfJH_KP2hOxM88'
const API_BASE = 'https://dictionary-backend.business-altuntass.workers.dev'
const WEB_APP_URL = 'https://dictionary-extension.pages.dev/'

function App() {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadToken()
  }, [])

  const loadToken = async () => {
    try {
      const result = await chrome.storage.local.get(['ws_token'])
      const savedToken = result?.ws_token || null
      setToken(savedToken)
      if (savedToken) {
        // Notify background script
        chrome.runtime?.sendMessage({ type: 'SESSION_UPDATED', token: savedToken })
      }
    } catch (error) {
      console.error('Failed to load token:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (token) => {
    await chrome.storage.local.set({ ws_token: token })
    setToken(token)
    chrome.runtime?.sendMessage({ type: 'SESSION_UPDATED', token })
  }

  const handleLogout = async () => {
    await chrome.storage.local.remove('ws_token')
    setToken(null)
    chrome.runtime?.sendMessage({ type: 'SESSION_UPDATED', token: null })
  }

  if (loading) {
    return (
      <div className="popup-container">
        <div className="popup-loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div className="popup-logo">★</div>
        <div className="popup-brand">
          <div className="popup-title">WordSnap</div>
          <div className="popup-subtitle">My Dictionary</div>
        </div>
      </div>

      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <WordsList token={token} onLogout={handleLogout} />
      )}
    </div>
  )
}

export default App

