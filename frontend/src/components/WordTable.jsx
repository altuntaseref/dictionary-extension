import { useState } from 'react';
import { api } from '../lib/api';
import WordDetailModal from './WordDetailModal';

export default function WordTable({ words, onUpdate }) {
  const [selectedWord, setSelectedWord] = useState(null);
  const [sortBy, setSortBy] = useState('newest');

  const sortedWords = [...words].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (sortBy === 'a-z') {
      return a.word.localeCompare(b.word);
    }
    return 0;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-sage/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage/20 flex items-center justify-between bg-sage/10">
          <h2 className="text-lg font-semibold text-drab-dark-brown">
            {words.length} {words.length === 1 ? 'Word' : 'Words'}
          </h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-sage/50 rounded-lg px-3 py-1.5 bg-white text-drab-dark-brown focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="a-z">A-Z</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sage/20 bg-sage/10">
                <th className="px-6 py-3 text-left text-xs font-semibold text-drab-dark-brown uppercase tracking-wider">
                  Word
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-drab-dark-brown uppercase tracking-wider">
                  Meaning
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-drab-dark-brown uppercase tracking-wider">
                  Examples
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-drab-dark-brown uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-drab-dark-brown uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-sage/20">
              {sortedWords.map((word) => (
                <tr key={word.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-drab-dark-brown">{word.word}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-umber max-w-md truncate">{word.meaning || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      {Array.isArray(word.examples) ? word.examples.length : 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-umber">{formatDate(word.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedWord(word)}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
