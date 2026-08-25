'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { FileText, Search, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DocumentsPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadProperties(); }, []);

  const loadProperties = async () => {
    try {
      const { data: props } = await supabase.from('properties').select('id, title, display_id, area_name, property_type').eq('is_deleted', false).order('created_at', { ascending: false });
      const { data: docs } = await supabase.from('documents').select('property_id, category').eq('is_deleted', false);

      const docMap = {};
      (docs || []).forEach(d => {
        if (!docMap[d.property_id]) docMap[d.property_id] = [];
        docMap[d.property_id].push(d.category);
      });

      const enriched = (props || []).map(p => ({
        ...p,
        docCount: (docMap[p.id] || []).length,
        categories: [...new Set(docMap[p.id] || [])],
      }));
      setProperties(enriched);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = properties.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return [p.title, p.display_id, p.area_name].filter(Boolean).join(' ').toLowerCase().includes(q);
  });

  return (
    <div style={{ maxWidth: 'var(--content-max-width)' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Manage property documents</p>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Search properties..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {loading && <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}

      {!loading && filtered.length === 0 && (
        <div className="card"><div className="empty-state">
          <FileText size={32} className="empty-state-icon" />
          <p className="empty-state-title">No properties found</p>
          <p className="empty-state-description">Add properties first to manage their documents.</p>
        </div></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card" style={{ padding: 0 }}>
          {filtered.map(p => (
            <div key={p.id} onClick={() => router.push(`/documents/${p.id}`)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-divider)',
              cursor: 'pointer', transition: 'background var(--transition-fast)',
            }} onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
               onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: p.docCount > 0 ? 'var(--color-success-light)' : 'var(--color-warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.docCount > 0 ? <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} /> : <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 'var(--font-size-md)' }}>{p.title || 'Untitled Property'}</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {p.display_id} · {p.docCount} document{p.docCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
