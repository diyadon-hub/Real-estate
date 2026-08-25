'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Map, TrendingUp } from 'lucide-react';
import { formatRate } from '@/lib/utils/formatting';

export default function AreasPage() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await supabase.from('areas').select('*, properties(id)').eq('is_deleted', false).order('name');
      setAreas(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = areas.filter(a => {
    if (!searchQuery) return true;
    return [a.name, a.city, a.district, a.taluk].filter(Boolean).join(' ').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 'var(--content-max-width)' }}>
      <div className="page-header">
        <div><h1 className="page-title">Areas</h1><p className="page-subtitle">{filtered.length} areas</p></div>
        <button className="btn btn-primary" onClick={() => router.push('/areas/add')}><Plus size={16} /> Add Area</button>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Search areas..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>

      {loading && <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}

      {!loading && filtered.length === 0 && (
        <div className="card"><div className="empty-state">
          <Map size={32} className="empty-state-icon" />
          <p className="empty-state-title">{searchQuery ? 'No areas match' : 'No areas yet'}</p>
          <p className="empty-state-description">Create areas to organize properties by locality and track price trends.</p>
          {!searchQuery && <button className="btn btn-primary" onClick={() => router.push('/areas/add')}><Plus size={16} /> Add Area</button>}
        </div></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Area</th><th>City</th><th>District</th><th>Current Rate</th><th>Properties</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="clickable" onClick={() => router.push(`/areas/${a.id}`)}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td>{a.city || '—'}</td>
                  <td>{a.district || '—'}</td>
                  <td>{a.current_avg_rate ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={12} /> {formatRate(a.current_avg_rate, a.rate_unit)}</span> : '—'}</td>
                  <td>{a.properties?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
