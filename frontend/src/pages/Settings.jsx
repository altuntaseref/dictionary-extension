import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [aiModel, setAiModel] = useState('gpt-4o-mini');

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787'}/api/export?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `words.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Export error: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-drab-dark-brown mb-2 tracking-[-0.033em]">Settings</h1>
          <p className="text-base text-umber">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <div className="bg-white rounded-lg border border-sage/30 p-6">
            <h2 className="text-lg font-semibold text-drab-dark-brown mb-6">Account</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-drab-dark-brown mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input bg-gray-50"
                />
              </div>
              <button
                onClick={signOut}
                className="btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* AI Settings */}
          <div className="bg-white rounded-lg border border-sage/30 p-6">
            <h2 className="text-lg font-semibold text-drab-dark-brown mb-6">AI Settings</h2>
            <div>
              <label className="block text-sm font-medium text-drab-dark-brown mb-2">
                AI Model
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="input"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-5">Claude 3.5</option>
              </select>
              <p className="text-xs text-umber mt-2">
                This setting will be used for generating translations and examples.
              </p>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg border border-sage/30 p-6">
            <h2 className="text-lg font-semibold text-drab-dark-brown mb-6">Data Management</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-drab-dark-brown mb-3">Export Data</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleExport('json')}
                    disabled={exporting}
                    className="btn-secondary"
                  >
                    {exporting ? 'Exporting...' : 'Export JSON'}
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                    className="btn-secondary"
                  >
                    {exporting ? 'Exporting...' : 'Export CSV'}
                  </button>
                </div>
              </div>
              
              <div className="pt-6 border-t border-sage/20">
                <h3 className="text-sm font-medium text-drab-dark-brown mb-3">Danger Zone</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 mb-3">
                    Deleting all data is permanent and cannot be undone.
                  </p>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors border border-red-600">
                    Delete All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
