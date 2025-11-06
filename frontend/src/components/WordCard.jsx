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
      alert('Örnek cümle üretilemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800">{word.word}</h3>
        <span className="text-xs text-gray-500">
          {new Date(word.created_at).toLocaleDateString('tr-TR')}
        </span>
      </div>
      
      {word.meaning && (
        <p className="text-gray-600 mb-4">{word.meaning}</p>
      )}

      {examples && examples.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Örnek Cümleler:</h4>
          <ul className="space-y-1">
            {examples.map((ex, idx) => (
              <li key={idx} className="text-sm text-gray-600 italic">
                • {ex}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleGenerateExamples}
        disabled={loading}
        className="w-full mt-4 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition disabled:opacity-50"
      >
        {loading ? 'Üretiliyor...' : '+ Örnek Cümle Ekle'}
      </button>
    </div>
  );
}

