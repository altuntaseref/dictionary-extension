import { useState, useEffect } from 'react'

const API_BASE = 'https://dictionary-backend.business-altuntass.workers.dev'
const WEB_APP_URL = 'https://dictionary-extension.pages.dev/'

export default function WordsList({ token, onLogout }) {
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWords()
  }, [token])

  const loadWords = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_BASE}/api/words`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch words')
      }

      const data = await res.json()
      const sortedWords = (data.words || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)

      setWords(sortedWords)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenWeb = () => {
    chrome.tabs.create({ url: WEB_APP_URL })
  }

  return (
    <div className="popup-card">
      <div className="popup-card-title">Recent words ({words.length})</div>
      
      {loading ? (
        <div className="popup-loading">Loading words...</div>
      ) : error ? (
        <div className="popup-error">{error}</div>
      ) : words.length === 0 ? (
        <div className="popup-empty">No words yet. Select text on any page to save!</div>
      ) : (
        <ul className="popup-word-list">
          {words.map((word) => (
            <li key={word.id} className="popup-word-item">
              <div className="popup-word-text">{word.word}</div>
              {word.meaning && (
                <div className="popup-word-meaning">{word.meaning}</div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="popup-actions">
        <button onClick={handleOpenWeb} className="popup-btn-secondary">
          Open full library
        </button>
        <button onClick={onLogout} className="popup-btn-ghost">
          Sign out
        </button>
      </div>
    </div>
  )
}

