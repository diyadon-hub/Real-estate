'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, StickyNote, Trash2, Search } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatting';
import { ENTITY_TYPES } from '@/lib/utils/constants';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({ title: '', content: '', entity_type: 'general' });
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await supabase.from('notes').select('*').eq('is_deleted', false).order('created_at', { ascending: false });
      setNotes(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('notes').insert({
        user_id: user.id, title: form.title || null, content: form.content || null, entity_type: form.entity_type,
      });
      setShowAdd(false);
      setForm({ title: '', content: '', entity_type: 'general' });
      load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    await supabase.from('notes').update({ is_deleted: true }).eq('id', id);
    load();
  };

  const filtered = notes.filter(n => {
    if (!searchQuery) return true;
    return [n.title, n.content].filter(Boolean).join(' ').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div><h1 className="page-title">Notes</h1><p className="page-subtitle">{filtered.length} notes</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Note</button>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="search-input-wrapper"><Search size={16} className="search-icon" /><input className="search-input" placeholder="Search notes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
          <div className="form-group"><label className="form-label">Title</label><input className="form-input" placeholder="Note title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus /></div>
          <div className="form-group"><label className="form-label">Content</label><textarea className="form-textarea" rows={4} placeholder="Write your note..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.entity_type} onChange={e => setForm({ ...form, entity_type: e.target.value })}>{ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd}>Save Note</button>
          </div>
        </div>
      )}

      {loading && <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}

      {!loading && filtered.length === 0 && !showAdd && (
        <div className="card"><div className="empty-state">
          <StickyNote size={32} className="empty-state-icon" />
          <p className="empty-state-title">{searchQuery ? 'No notes match' : 'No notes yet'}</p>
          <p className="empty-state-description">Create notes to capture insights about properties, areas, and contacts.</p>
          {!searchQuery && <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Note</button>}
        </div></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {filtered.map(note => (
          <div key={note.id} className="card card-compact">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                {note.title && <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 4 }}>{note.title}</h4>}
                {note.content && <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{note.content}</p>}
                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', alignItems: 'center' }}>
                  <span className="tag">{note.entity_type}</span>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{formatRelativeTime(note.created_at)}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(note.id)} style={{ color: 'var(--color-text-tertiary)' }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
