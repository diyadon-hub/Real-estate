'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, MapPin, Calendar, Trash2, Edit, ExternalLink, Save } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatting';
import { getStatusColor, getImpactColor } from '@/lib/utils/formatting';
import { DEVELOPMENT_TYPES, DEVELOPMENT_STATUSES, IMPACT_LEVELS } from '@/lib/utils/constants';

export default function DevelopmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [dev, setDev] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const { data } = await supabase.from('developments').select('*').eq('id', id).single();
      if (!data) { router.push('/developments'); return; }
      setDev(data); setEditForm(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      const { id: _, user_id, created_at, updated_at, is_deleted, deleted_at, ...updateData } = editForm;
      Object.keys(updateData).forEach(k => { if (updateData[k] === '') updateData[k] = null; });
      await supabase.from('developments').update(updateData).eq('id', id);
      setEditing(false); load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this development?')) return;
    await supabase.from('developments').update({ is_deleted: true }).eq('id', id);
    router.push('/developments');
  };

  if (loading) return <div style={{ maxWidth: 700 }}><div className="skeleton" style={{ height: 300, borderRadius: 12 }} /></div>;
  if (!dev) return null;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
          <button className="btn btn-ghost" onClick={() => router.push('/developments')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{dev.name}</h1>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 4 }}>
              {dev.project_type && <span className="tag">{dev.project_type}</span>}
              <span className={`badge ${getStatusColor(dev.current_status)}`}>{dev.current_status}</span>
              {dev.expected_impact && <span className={`badge ${getImpactColor(dev.expected_impact)}`}>{dev.expected_impact} Impact</span>}
            </div>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setEditing(!editing)}><Edit size={16} /> {editing ? 'Cancel' : 'Edit'}</button>
          <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={handleDelete}><Trash2 size={16} /></button>
        </div>
      </div>

      {editing ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={editForm.project_type || ''} onChange={e => setEditForm({ ...editForm, project_type: e.target.value })}><option value="">Select</option>{DEVELOPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={editForm.current_status || ''} onChange={e => setEditForm({ ...editForm, current_status: e.target.value })}>{DEVELOPMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={editForm.location || ''} onChange={e => setEditForm({ ...editForm, location: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={3} value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Expected Impact</label><select className="form-select" value={editForm.expected_impact || ''} onChange={e => setEditForm({ ...editForm, expected_impact: e.target.value })}><option value="">Select</option>{IMPACT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Expected Completion</label><input className="form-input" type="date" value={editForm.expected_completion || ''} onChange={e => setEditForm({ ...editForm, expected_completion: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Impact Explanation</label><textarea className="form-textarea" rows={2} value={editForm.impact_explanation || ''} onChange={e => setEditForm({ ...editForm, impact_explanation: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" rows={2} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save</button></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              {dev.location && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><MapPin size={14} /> {dev.location}</div>}
              {dev.nearby_area && <div style={{ fontSize: 'var(--font-size-base)' }}>Near: {dev.nearby_area}</div>}
              {dev.start_date && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><Calendar size={14} /> Started: {formatDate(dev.start_date)}</div>}
              {dev.expected_completion && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><Calendar size={14} /> Expected: {formatDate(dev.expected_completion)}</div>}
              {dev.source_reference && <div style={{ fontSize: 'var(--font-size-base)' }}>Source: {dev.source_reference}</div>}
            </div>
          </div>

          {dev.description && <div className="card"><h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}>Description</h3><p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{dev.description}</p></div>}

          {dev.impact_explanation && (
            <div className="card" style={{ background: dev.expected_impact === 'Very High' || dev.expected_impact === 'High' ? 'var(--color-warning-light)' : 'var(--color-bg)', borderColor: 'transparent' }}>
              <h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}>Impact Analysis</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{dev.impact_explanation}</p>
            </div>
          )}

          {dev.notes && <div className="card"><h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}>Notes</h3><p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{dev.notes}</p></div>}

          {dev.latitude && dev.longitude && (
            <div className="card">
              <div className="section-header">
                <h3 className="section-title">Location</h3>
                <a href={`https://www.google.com/maps?q=${dev.latitude},${dev.longitude}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm"><ExternalLink size={14} /> Maps</a>
              </div>
              <div style={{ height: 150, background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>
                <MapPin size={20} /> {dev.latitude.toFixed(4)}, {dev.longitude.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
