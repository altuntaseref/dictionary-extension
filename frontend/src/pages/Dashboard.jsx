import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import Layout from '../components/Layout';
import WordCard from '../components/WordCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, recent: 0 });

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    try {
      setLoading(true);
      const data = await api.export('json');
      const wordsList = data.words || [];
      setWords(wordsList);
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = wordsList.filter(w => new Date(w.created_at) > sevenDaysAgo).length;
      
      setStats({
        total: wordsList.length,
        recent,
      });
    } catch (error) {
      console.error('Failed to load words:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentWords = words
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-drab-dark-brown mb-2 tracking-[-0.033em]">Dashboard</h1>
          <p className="text-base text-umber">Welcome back! Here's your vocabulary overview.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-lg border border-sage/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-umber font-medium">Total Words</div>
              <span className="material-symbols-outlined text-2xl text-sage">book</span>
            </div>
            <div className="text-4xl font-black text-drab-dark-brown">{stats.total}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-sage/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-umber font-medium">Added This Week</div>
              <span className="material-symbols-outlined text-2xl text-sage">calendar_today</span>
            </div>
            <div className="text-4xl font-black text-drab-dark-brown">{stats.recent}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-sage/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-umber font-medium">Examples Generated</div>
              <span className="material-symbols-outlined text-2xl text-sage">auto_awesome</span>
            </div>
            <div className="text-4xl font-black text-drab-dark-brown">
              {words.reduce((acc, w) => acc + (Array.isArray(w.examples) ? w.examples.length : 0), 0)}
            </div>
          </div>
        </div>

        {/* Recent Words */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-drab-dark-brown tracking-[-0.02em]">Recent Words</h2>
              <p className="text-sm text-umber mt-1">Your latest vocabulary additions</p>
            </div>
            <a href="/words" className="text-sm text-primary hover:text-primary/80 font-medium">
              View all →
            </a>
          </div>
          
          {loading ? (
            <div className="text-center py-16 text-umber">Loading...</div>
          ) : recentWords.length === 0 ? (
            <div className="bg-white rounded-lg border border-sage/30 p-16 text-center">
              <p className="text-umber mb-4">No words yet. Start by adding your first word!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentWords.map((word) => (
                <WordCard key={word.id} word={word} onUpdate={loadWords} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
