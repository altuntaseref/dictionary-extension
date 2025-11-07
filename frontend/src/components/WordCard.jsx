import { useState } from 'react';
import { api } from '../lib/api';

export default function WordCard({ word, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [examples, setExamples] = useState(word.examples || []);

  const handleGenerateExamples = async () => {
    try {
      setLoading(true);
      const data = await api.example(word.word);
      setExamples([...(examples || []), ...(data.examples || [])]);
      onUpdate();
    } catch (error) {
      alert('Failed to generate examples: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border border-sage/30 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-base font-semibold text-drab-dark-brown">{word.word}</h3>
      </div>
      
      {word.meaning && (
        <p className="text-sm text-umber mb-3 line-clamp-2">{word.meaning}</p>
      )}

      <div className="flex items-center justify-between text-xs text-umber mb-3">
        <span>{Array.isArray(examples) ? examples.length : 0} examples</span>
        <span>{formatDate(word.created_at)}</span>
      </div>

      <button
        onClick={handleGenerateExamples}
        disabled={loading}
        className="w-full text-xs text-primary hover:text-primary/80 hover:bg-primary/10 py-1.5 rounded transition-colors disabled:opacity-50"
      >
        {loading ? 'Generating...' : '+ Add Examples'}
      </button>
    </div>
  );
}
