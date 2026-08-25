'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search as SearchIcon, Home, Users, Map, Building2, Send, Bot, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { SMART_FILTERS } from '@/lib/utils/constants';

function SearchContent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ properties: [], contacts: [], areas: [], developments: [] });
  const [loading, setLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); performSearch(q); }
  }, [searchParams]);

  const performSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const search = q.toLowerCase();

      const { data: props } = await supabase.from('properties').select('id, title, display_id, area_name, property_type, status, asking_price').eq('is_deleted', false);
      const { data: contacts } = await supabase.from('contacts').select('id, name, role, phone, company').eq('is_deleted', false);
      const { data: areas } = await supabase.from('areas').select('id, name, city, current_avg_rate').eq('is_deleted', false);
      const { data: devs } = await supabase.from('developments').select('id, name, project_type, current_status, expected_impact').eq('is_deleted', false);

      setResults({
        properties: (props || []).filter(p => [p.title, p.display_id, p.area_name, p.property_type].filter(Boolean).join(' ').toLowerCase().includes(search)),
        contacts: (contacts || []).filter(c => [c.name, c.role, c.phone, c.company].filter(Boolean).join(' ').toLowerCase().includes(search)),
        areas: (areas || []).filter(a => [a.name, a.city].filter(Boolean).join(' ').toLowerCase().includes(search)),
        developments: (devs || []).filter(d => [d.name, d.project_type].filter(Boolean).join(' ').toLowerCase().includes(search)),
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSearch = (e) => { e.preventDefault(); performSearch(query); };

  const handleAIQuery = async () => {
    if (!aiQuery.trim()) return;
    const userMsg = aiQuery;
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiQuery('');
    setAiLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg }),
      });
      const data = await response.json();
      setAiMessages(prev => [...prev, { role: 'assistant', content: data.response || 'No results found in your database.' }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, the AI assistant is not available right now. Please configure your Gemini API key in .env.local.' }]);
    } finally { setAiLoading(false); }
  };

  const totalResults = results.properties.length + results.contacts.length + results.areas.length + results.developments.length;

  return (
    <div style={{ maxWidth: 'var(--content-max-width)' }}>
      <h1 className="page-title" style={{ marginBottom: 'var(--space-xl)' }}>Search</h1>

      {/* Global Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="search-input-wrapper">
          <SearchIcon size={16} className="search-icon" />
          <input className="search-input" style={{ height: 44 }} placeholder="Search properties, contacts, areas, projects..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        </div>
      </form>

      {/* Smart Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)' }}>
        {SMART_FILTERS.map(f => (
          <button key={f.label} className="filter-chip" onClick={() => { setQuery(f.label); performSearch(f.label); }}>{f.label}</button>
        ))}
      </div>

      {/* Results */}
      {loading && <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}

      {!loading && totalResults > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {results.properties.length > 0 && (
            <div>
              <h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}><Home size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Properties ({results.properties.length})</h3>
              <div className="card" style={{ padding: 0 }}>
                {results.properties.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-divider)', cursor: 'pointer' }} onClick={() => router.push(`/properties/${p.id}`)}>
                    <div><span style={{ fontWeight: 500 }}>{p.title || 'Untitled'}</span><span style={{ marginLeft: 8, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{p.display_id} · {p.area_name || ''}</span></div>
                    <span>{p.asking_price ? formatCurrency(p.asking_price) : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.contacts.length > 0 && (
            <div>
              <h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}><Users size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Contacts ({results.contacts.length})</h3>
              <div className="card" style={{ padding: 0 }}>
                {results.contacts.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-divider)', cursor: 'pointer' }} onClick={() => router.push(`/contacts/${c.id}`)}>
                    <span style={{ fontWeight: 500 }}>{c.name}</span><span className="tag">{c.role || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.areas.length > 0 && (
            <div>
              <h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}><Map size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Areas ({results.areas.length})</h3>
              <div className="card" style={{ padding: 0 }}>
                {results.areas.map(a => (
                  <div key={a.id} style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-divider)', cursor: 'pointer' }} onClick={() => router.push(`/areas/${a.id}`)}>
                    <span style={{ fontWeight: 500 }}>{a.name}</span><span style={{ marginLeft: 8, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{a.city}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.developments.length > 0 && (
            <div>
              <h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}><Building2 size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Developments ({results.developments.length})</h3>
              <div className="card" style={{ padding: 0 }}>
                {results.developments.map(d => (
                  <div key={d.id} style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--color-divider)', cursor: 'pointer' }} onClick={() => router.push(`/developments/${d.id}`)}>
                    <span style={{ fontWeight: 500 }}>{d.name}</span><span className="tag" style={{ marginLeft: 8 }}>{d.project_type || ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && query && totalResults === 0 && (
        <div className="card"><div className="empty-state">
          <SearchIcon size={32} className="empty-state-icon" />
          <p className="empty-state-title">No results found</p>
          <p className="empty-state-description">Try a different search term or use the AI Assistant below.</p>
        </div></div>
      )}

      {/* AI Assistant */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}><Bot size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> AI Assistant</h3>
        <div className="card">
          <div style={{ minHeight: 150, maxHeight: 400, overflowY: 'auto', marginBottom: 'var(--space-base)' }}>
            {aiMessages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--space-xl)', fontSize: 'var(--font-size-base)' }}>
                Ask questions about your data in natural language.<br />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>e.g., &quot;Show East-facing plots under ₹30 lakh&quot;</span>
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-sm)', padding: 'var(--space-sm) 0', alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 'var(--radius-full)', background: msg.role === 'user' ? 'var(--color-accent-light)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div style={{ fontSize: 'var(--font-size-base)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))}
            {aiLoading && <div style={{ padding: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 8 }}><span className="spinner" /> Searching your database...</div>}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input className="form-input" placeholder="Ask about your properties..." value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAIQuery()} />
            <button className="btn btn-primary btn-icon" onClick={handleAIQuery} disabled={aiLoading || !aiQuery.trim()}><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}><SearchContent /></Suspense>;
}
