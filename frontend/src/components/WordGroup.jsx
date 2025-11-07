import { useState } from 'react';
import WordItem from './WordItem';

export default function WordGroup({ name, words, groups = [], onUpdate }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white border rounded-lg border-sage/30 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between p-4 gap-4 bg-sage/10">
        <h3 className="text-lg font-semibold text-drab-dark-brown">{name}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <span
              className={`material-symbols-outlined text-drab-dark-brown text-xl transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            >
              expand_less
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-sage/20">
          {words.map((word) => (
            <WordItem key={word.id} word={word} groups={groups} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

