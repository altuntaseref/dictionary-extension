import { useState } from 'react';
import { api } from '../lib/api';

export default function AddWordModal({ onClose, onSuccess }) {
  const [word, setWord] = useState('');
  const [sourceLang, setSourceLang] = useState('');
  const [targetLang, setTargetLang] = useState('Turkish');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim()) return;

    try {
      setLoading(true);
      setError('');
      await api.translate(word, sourceLang || undefined, targetLang);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-md w-full p-8 shadow-xl border border-border-color"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-drab-dark-brown mb-6">Add New Word</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Word
            </label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              required
              className="input"
              placeholder="capture"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Source Language (Optional)
            </label>
            <input
              type="text"
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="input"
              placeholder="English (auto-detect if empty)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Target Language
            </label>
            <input
              type="text"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              required
              className="input"
              placeholder="Turkish"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Adding...' : 'Add Word'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
