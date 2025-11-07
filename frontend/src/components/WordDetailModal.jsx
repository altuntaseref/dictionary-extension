import { useState } from 'react';
import { api } from '../lib/api';

export default function WordDetailModal({ word, onClose, onUpdate }) {
  const [examples, setExamples] = useState(word.examples || []);
  const [notes, setNotes] = useState(word.notes || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerateExamples = async () => {
    try {
      setLoading(true);
      const data = await api.example(word.word);
      setExamples([...examples, ...(data.examples || [])]);
      onUpdate();
    } catch (error) {
      alert('Failed to generate examples: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // TODO: Implement save notes functionality
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onUpdate();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-border-color"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-drab-dark-brown mb-1">{word.word}</h2>
                {word.meaning && (
                  <p className="text-base text-umber">{word.meaning}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-umber hover:text-drab-dark-brown transition-colors ml-4"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          {/* Examples Section */}
          <div className="mb-5 pb-5 border-b border-sage/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-drab-dark-brown">Example Sentences</h3>
              <button
                onClick={handleGenerateExamples}
                disabled={loading}
                className="text-sm text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">auto_awesome</span>
                {loading ? 'Generating...' : 'Generate Examples'}
              </button>
            </div>
            {examples.length > 0 ? (
              <div className="space-y-2">
                {examples.map((ex, idx) => (
                  <div key={idx} className="bg-sage/10 rounded-lg p-3 border border-sage/20">
                    <p className="text-sm text-drab-dark-brown">{ex}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-sage/10 rounded-lg p-6 text-center border border-sage/20">
                <p className="text-sm text-umber">No examples yet. Click "Generate Examples" to create some.</p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-drab-dark-brown mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border-color rounded-lg bg-white text-drab-dark-brown placeholder:text-umber/70 focus:outline-none focus:ring-2 focus:ring-umber focus:border-umber transition-all text-sm"
              placeholder="Add your notes about this word..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-sage/20 mt-5">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-umber bg-white border border-sage/50 rounded-lg hover:bg-sage/20 transition-colors">
              Close
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
