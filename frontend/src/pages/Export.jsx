import { useState } from 'react';
import Layout from '../components/Layout';

export default function Export() {
  const [exporting, setExporting] = useState(false);

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
          <h1 className="text-4xl font-black text-drab-dark-brown mb-2 tracking-[-0.033em]">Export</h1>
          <p className="text-base text-umber">Download your vocabulary data</p>
        </div>

        <div className="bg-white rounded-lg border border-sage/30 p-8">
          <h2 className="text-lg font-semibold text-drab-dark-brown mb-4">Export Formats</h2>
          <p className="text-sm text-umber mb-8">
            Choose a format to download your complete vocabulary list.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-sage/10 rounded-lg border-2 border-dashed border-sage/30 p-6 hover:border-primary transition-colors">
              <div className="text-3xl mb-4">📄</div>
              <h3 className="font-semibold text-drab-dark-brown mb-2">JSON Format</h3>
              <p className="text-sm text-umber mb-4">
                Structured data format, perfect for backups and integrations.
              </p>
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="btn-primary w-full"
              >
                {exporting ? 'Exporting...' : 'Export JSON'}
              </button>
            </div>

            <div className="bg-sage/10 rounded-lg border-2 border-dashed border-sage/30 p-6 hover:border-primary transition-colors">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="font-semibold text-drab-dark-brown mb-2">CSV Format</h3>
              <p className="text-sm text-umber mb-4">
                Spreadsheet-compatible format, great for Excel or Google Sheets.
              </p>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="btn-primary w-full"
              >
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
