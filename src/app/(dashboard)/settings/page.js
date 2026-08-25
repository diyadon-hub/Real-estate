'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Settings as SettingsIcon, Download, Upload, Database, Key } from 'lucide-react';

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  const handleExportCSV = async (table) => {
    setExporting(true);
    try {
      const { data } = await supabase.from(table).select('*').eq('is_deleted', false);
      if (!data || data.length === 0) { alert(`No ${table} data to export`); return; }

      const headers = Object.keys(data[0]);
      const csv = [headers.join(','), ...data.map(row => headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(','))].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table}_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Export failed'); } finally { setExporting(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header"><div><h1 className="page-title">Settings</h1><p className="page-subtitle">Manage your dashboard</p></div></div>

      {/* API Keys info */}
      <div className="card" style={{ marginBottom: 'var(--space-base)' }}>
        <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}><Key size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Configuration</h3>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-base)' }}>
          Configure these in your <code>.env.local</code> file:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-base)' }}>
            <span>Supabase URL</span>
            <span style={{ color: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'var(--color-success)' : 'var(--color-warning)' }}>{process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configured' : '⚠ Not set'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-base)' }}>
            <span>Google Maps API Key</span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>Optional</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-base)' }}>
            <span>Gemini AI API Key</span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>Optional (for AI search)</span>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="card" style={{ marginBottom: 'var(--space-base)' }}>
        <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}><Download size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Export Data (CSV)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          {['properties', 'contacts', 'developments', 'areas', 'documents', 'notes', 'follow_ups'].map(table => (
            <button key={table} className="btn btn-secondary btn-sm" onClick={() => handleExportCSV(table)} disabled={exporting}>
              <Download size={14} /> {table.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Database Info */}
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}><Database size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> About</h3>
        <div style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          <p><strong>Real Estate Dashboard</strong> v1.0.0</p>
          <p>Built with Next.js + Supabase</p>
          <p style={{ marginTop: 'var(--space-sm)' }}>Your data is stored securely in Supabase with Row Level Security enabled. All information is private and accessible only to you.</p>
        </div>
      </div>
    </div>
  );
}
