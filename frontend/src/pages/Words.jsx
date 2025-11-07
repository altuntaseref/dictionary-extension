import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import WordGroup from '../components/WordGroup';
import FloatingActionButton from '../components/FloatingActionButton';
import GroupManagementModal from '../components/GroupManagementModal';

export default function Words() {
  const [words, setWords] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wordsData, groupsData] = await Promise.all([
        api.getWords(),
        api.getGroups().catch(() => ({ groups: [] })), // Ignore groups error if not available
      ]);
      setWords(wordsData.words || []);
      setGroups(groupsData.groups || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format, groupId = null) => {
    try {
      setExporting(true);
      const response = await api.export(format, groupId);
      
      let blob;
      if (format === 'csv') {
        blob = new Blob([response], { type: 'text/csv' });
      } else {
        blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `words${groupId ? `_group_${groupId}` : ''}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export error: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  // Group words by their group_id
  const groupedWords = words.reduce((acc, word) => {
    const groupId = word.group_id || 'ungrouped';
    const groupName = word.group_id 
      ? groups.find(g => g.id === word.group_id)?.name || 'Unknown Group'
      : 'Ungrouped';
    
    if (!acc[groupId]) {
      acc[groupId] = { name: groupName, id: groupId, words: [] };
    }
    acc[groupId].words.push(word);
    return acc;
  }, {});

  // Filter words by search term
  const filteredGroups = Object.values(groupedWords).map(group => ({
    ...group,
    words: group.words.filter((word) =>
      word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.meaning?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter(group => group.words.length > 0);

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-drab-dark-brown text-4xl font-black leading-tight tracking-[-0.033em]">
            Word Library
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-drab-dark-brown text-sm font-bold leading-normal tracking-[0.015em] hover:bg-sage/20 border border-sage/50 disabled:opacity-50"
              >
                <span className="material-symbols-outlined mr-2 text-base">ios_share</span>
                <span className="truncate">Export</span>
                <span className="material-symbols-outlined ml-2 text-base">expand_more</span>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-sage/30 py-2 z-10">
                  <div className="px-4 py-2 text-xs font-semibold text-umber uppercase">All Words</div>
                  <button
                    onClick={() => {
                      handleExport('json');
                      setShowExportMenu(false);
                    }}
                    disabled={exporting}
                    className="w-full text-left px-4 py-2 text-sm text-drab-dark-brown hover:bg-sage/20 disabled:opacity-50"
                  >
                    Export All as JSON
                  </button>
                  <button
                    onClick={() => {
                      handleExport('csv');
                      setShowExportMenu(false);
                    }}
                    disabled={exporting}
                    className="w-full text-left px-4 py-2 text-sm text-drab-dark-brown hover:bg-sage/20 disabled:opacity-50"
                  >
                    Export All as CSV
                  </button>
                  {groups.length > 0 && (
                    <>
                      <div className="border-t border-sage/20 my-2"></div>
                      <div className="px-4 py-2 text-xs font-semibold text-umber uppercase">By Group</div>
                      {groups.map(group => (
                        <div key={group.id} className="px-4 py-1">
                          <div className="text-xs text-umber mb-1">{group.name}</div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                handleExport('json', group.id);
                                setShowExportMenu(false);
                              }}
                              disabled={exporting}
                              className="flex-1 text-left px-2 py-1 text-xs text-drab-dark-brown hover:bg-sage/20 disabled:opacity-50 rounded"
                            >
                              JSON
                            </button>
                            <button
                              onClick={() => {
                                handleExport('csv', group.id);
                                setShowExportMenu(false);
                              }}
                              disabled={exporting}
                              className="flex-1 text-left px-2 py-1 text-xs text-drab-dark-brown hover:bg-sage/20 disabled:opacity-50 rounded"
                            >
                              CSV
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => document.querySelector('[data-add-word]')?.click()}
              className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90"
            >
              <span className="material-symbols-outlined mr-2 text-base">add</span>
              <span className="truncate">Add New Word</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-drab-dark-brown tracking-[-0.02em]">
            My Word Groups
          </h2>
          <div className="flex items-center gap-3 flex-1">
            <div className="max-w-md flex-1">
              <input
                type="text"
                placeholder="Search words or meanings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input h-10"
              />
            </div>
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sage/50 text-drab-dark-brown hover:bg-sage/20 text-sm font-medium"
            >
              <span className="material-symbols-outlined text-base">folder_managed</span>
              Manage Groups
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-umber">Loading...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white border rounded-lg border-sage/30 p-16 text-center">
            <p className="text-umber mb-4">
              {searchTerm ? 'No words found matching your search.' : 'No words yet. Start by adding your first word!'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <WordGroup
                key={group.id}
                name={group.name}
                words={group.words}
                groups={groups}
                onUpdate={loadData}
              />
            ))}
          </div>
        )}
      </div>
      <FloatingActionButton onSuccess={loadData} />
      <GroupManagementModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onUpdate={loadData}
      />
    </Layout>
  );
}
