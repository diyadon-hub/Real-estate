'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Building2 } from 'lucide-react';
import { DEVELOPMENT_TYPES, DEVELOPMENT_STATUSES } from '@/lib/utils/constants';
import { getStatusColor, getImpactColor } from '@/lib/utils/formatting';

export default function DevelopmentsPage() {
  const [developments, setDevelopments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await supabase.from('developments').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
      setDevelopments(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = developments.filter(d => {
    if (searchQuery && ![d.name, d.project_type, d.location, d.nearby_area].filter(Boolean).join(' ').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (typeFilter && d.project_type !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 'var(--content-max-width)' }}>
      <div className="page-header">
        <div><h1 className="page-title">Developments</h1><p className="page-subtitle">{filtered.length} projects</p></div>
        <button className="btn btn-primary" onClick={() => router.push('/developments/add')}><Plus size={16} /> Add Development</button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Search developments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {DEVELOPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading && <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}

      {!loading && filtered.length === 0 && (
        <div className="card"><div className="empty-state">
          <Building2 size={32} className="empty-state-icon" />
          <p className="empty-state-title">{searchQuery || typeFilter ? 'No developments match' : 'No developments yet'}</p>
          <p className="empty-state-description">Track roads, highways, layouts, and other developments that affect property values.</p>
          {!searchQuery && !typeFilter && <button className="btn btn-primary" onClick={() => router.push('/developments/add')}><Plus size={16} /> Add Development</button>}
        </div></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Project</th><th>Type</th><th>Location</th><th>Status</th><th>Impact</th><th>Completion</th></tr></thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="clickable" onClick={() => router.push(`/developments/${d.id}`)}>
                  <td style={{ fontWeight: 500 }}>{d.name}</td>
                  <td>{d.project_type ? <span className="tag">{d.project_type}</span> : '—'}</td>
                  <td>{d.location || d.nearby_area || '—'}</td>
                  <td><span className={`badge ${getStatusColor(d.current_status)}`}>{d.current_status || 'Planned'}</span></td>
                  <td>{d.expected_impact ? <span className={`badge ${getImpactColor(d.expected_impact)}`}>{d.expected_impact}</span> : '—'}</td>
                  <td>{d.expected_completion ? new Date(d.expected_completion).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
