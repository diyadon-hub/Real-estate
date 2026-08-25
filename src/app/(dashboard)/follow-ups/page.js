'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Bell, CheckCircle2, Clock, Calendar, Trash2, Check } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatting';

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [form, setForm] = useState({ title: '', description: '', due_date: '', priority: 'Normal', entity_type: 'general' });
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data } = await supabase.from('follow_ups').select('*').eq('is_deleted', false).order('due_date', { ascending: true });
      setFollowUps(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.title || !form.due_date) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('follow_ups').insert({
        user_id: user.id, title: form.title, description: form.description || null,
        due_date: form.due_date, priority: form.priority, entity_type: form.entity_type,
      });
      setShowAdd(false);
      setForm({ title: '', description: '', due_date: '', priority: 'Normal', entity_type: 'general' });
      load();
    } catch (err) { console.error(err); }
  };

  const handleComplete = async (id) => {
    await supabase.from('follow_ups').update({ status: 'Completed', completed_at: new Date().toISOString() }).eq('id', id);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this follow-up?')) return;
    await supabase.from('follow_ups').update({ is_deleted: true }).eq('id', id);
    load();
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = followUps.filter(f => {
    if (filter === 'pending') return f.status === 'Pending';
    if (filter === 'today') return f.status === 'Pending' && f.due_date === today;
    if (filter === 'completed') return f.status === 'Completed';
    return true;
  });

  const todayCount = followUps.filter(f => f.status === 'Pending' && f.due_date === today).length;
  const overdueCount = followUps.filter(f => f.status === 'Pending' && f.due_date < today).length;

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="page-header">
        <div><h1 className="page-title">Follow-ups</h1><p className="page-subtitle">{todayCount > 0 ? `${todayCount} today` : 'No follow-ups today'}{overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Add Follow-up</button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
        {[{ id: 'pending', label: 'Pending' }, { id: 'today', label: "Today's" }, { id: 'completed', label: 'Completed' }, { id: 'all', label: 'All' }].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} className={`filter-chip ${filter === t.id ? 'active' : ''}`}>{t.label}</button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" placeholder="e.g., Call Rajesh about Plot 42" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Due Date *</label><input className="form-input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Priority</label><select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option>High</option><option>Normal</option><option>Low</option></select></div>
          </div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={!form.title || !form.due_date}>Save</button>
          </div>
        </div>
      )}

      {loading && <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}

      {!loading && filtered.length === 0 && (
        <div className="card"><div className="empty-state">
          <Bell size={32} className="empty-state-icon" />
          <p className="empty-state-title">{filter === 'today' ? 'No follow-ups today' : 'No follow-ups'}</p>
          <p className="empty-state-description">Create follow-ups to stay on top of important tasks.</p>
        </div></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {filtered.map(fu => {
          const isOverdue = fu.status === 'Pending' && fu.due_date < today;
          const isToday = fu.due_date === today;
          return (
            <div key={fu.id} className="card card-compact" style={{ borderLeft: `3px solid ${fu.priority === 'High' ? 'var(--color-danger)' : isOverdue ? 'var(--color-warning)' : isToday ? 'var(--color-accent)' : 'var(--color-border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }}>
                  {fu.status === 'Completed' ? (
                    <CheckCircle2 size={18} style={{ color: 'var(--color-success)', marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <button onClick={() => handleComplete(fu.id)} style={{ border: '2px solid var(--color-border)', width: 20, height: 20, borderRadius: 'var(--radius-full)', background: 'transparent', cursor: 'pointer', flexShrink: 0, marginTop: 2 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 'var(--font-size-md)', textDecoration: fu.status === 'Completed' ? 'line-through' : 'none', color: fu.status === 'Completed' ? 'var(--color-text-tertiary)' : 'var(--color-text)' }}>{fu.title}</div>
                    {fu.description && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 2 }}>{fu.description}</p>}
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: isOverdue ? 'var(--color-danger)' : isToday ? 'var(--color-accent)' : 'var(--color-text-tertiary)', fontWeight: isOverdue || isToday ? 600 : 400 }}>
                        <Calendar size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {isToday ? 'Today' : isOverdue ? `Overdue (${formatDate(fu.due_date)})` : formatDate(fu.due_date)}
                      </span>
                      {fu.priority === 'High' && <span className="badge" style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', fontSize: 10 }}>High</span>}
                    </div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(fu.id)} style={{ color: 'var(--color-text-tertiary)' }}><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
