import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function WordItem({ word, groups = [], onUpdate }) {
  const [showExamples, setShowExamples] = useState(false);
  const [examples, setExamples] = useState(word.examples || []);
  const [loading, setLoading] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  useEffect(() => {
    setExamples(word.examples || []);
  }, [word.examples]);

  const handleGenerateExamples = async () => {
    try {
      setLoading(true);
      const data = await api.example(word.word, word.target_lang || 'English', 'Turkish');
      const newExamples = data.examples || [];
      setExamples([...examples, ...newExamples]);
      setShowExamples(true);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      alert('Failed to generate examples: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = async (groupId) => {
    try {
      await api.assignWordToGroup(word.id, groupId);
      setShowGroupMenu(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      alert('Failed to update group: ' + error.message);
    }
  };

  const hasExamples = examples && examples.length > 0;
  const currentGroup = groups.find(g => g.id === word.group_id);

  return (
    <div>
      <div className="p-4 hover:bg-gray-50">
        <div className="grid grid-cols-[200px_1fr_auto] gap-4 items-center">
          <h4 className="font-semibold text-drab-dark-brown">{word.word}</h4>
          <p className="text-sm text-umber">{word.meaning || '—'}</p>
          <div className="flex items-center gap-4 ml-auto">
            {groups.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                  className="flex items-center gap-2 text-sm font-medium text-umber hover:text-drab-dark-brown"
                >
                  <span className="material-symbols-outlined text-base">folder</span>
                  <span>{currentGroup?.name || 'Ungrouped'}</span>
                  <span className="material-symbols-outlined text-xs">expand_more</span>
                </button>
                {showGroupMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-sage/30 py-2 z-20">
                    <button
                      onClick={() => handleGroupChange(null)}
                      className="w-full text-left px-4 py-2 text-sm text-drab-dark-brown hover:bg-sage/20"
                    >
                      Ungrouped
                    </button>
                    {groups.map(group => (
                      <button
                        key={group.id}
                        onClick={() => handleGroupChange(group.id)}
                        className="w-full text-left px-4 py-2 text-sm text-drab-dark-brown hover:bg-sage/20"
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleGenerateExamples}
              disabled={loading}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span>Generate example sentences</span>
            </button>
            {hasExamples && (
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="p-2 rounded-full hover:bg-gray-200"
                title={showExamples ? 'Hide examples' : 'Show examples'}
              >
                <span
                  className={`material-symbols-outlined text-umber transition-transform ${
                    showExamples ? 'rotate-180' : ''
                  }`}
                >
                  expand_less
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showExamples && hasExamples && (
        <div className="mt-0 pt-4 pb-4 px-4 border-t border-sage/20 bg-gray-50/50">
          <ul className="space-y-3 text-sm">
            {examples.map((ex, idx) => {
              // Handle both old format (string) and new format (object with sentence and translation)
              const sentence = typeof ex === 'string' ? ex : ex.sentence || ex;
              const translation = typeof ex === 'object' && ex.translation ? ex.translation : null;
              
              return (
                <li key={idx} className="flex flex-col gap-1">
                  <p className="text-drab-dark-brown">{sentence}</p>
                  {translation && (
                    <p className="text-umber/70 text-xs ml-4">{translation}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
