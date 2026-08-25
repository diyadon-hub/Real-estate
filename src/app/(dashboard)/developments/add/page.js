'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';
import { DEVELOPMENT_TYPES, DEVELOPMENT_STATUSES, IMPACT_LEVELS } from '@/lib/utils/constants';

export default function AddDevelopmentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', project_type: '', location: '', nearby_area: '',
    latitude: '', longitude: '', description: '',
    current_status: 'Planned', start_date: '', expected_completion: '',
    source_reference: '', expected_impact: '', impact_explanation: '', notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true); setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const devData = { user_id: user.id };
      Object.entries(form).forEach(([k, v]) => {
        if (v) {
          if (['latitude', 'longitude'].includes(k)) devData[k] = Number(v);
          else devData[k] = v;
        }
      });

      const { data, error: err } = await supabase.from('developments').insert(devData).select().single();
      if (err) throw err;

      await supabase.from('activity_log').insert({
        user_id: user.id, entity_type: 'development', entity_id: data.id,
        entity_name: data.name, action: 'created',
      });

      router.push(`/developments/${data.id}`);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <button className="btn btn-ghost" onClick={() => router.back()}><ArrowLeft size={18} /></button>
        <h1 className="page-title">Add Development</h1>
      </div>

      {error && <div style={{ padding: 'var(--space-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
        <div className="form-group"><label className="form-label">Project Name *</label><input className="form-input" placeholder="e.g., New Ring Road Phase 2" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Project Type</label><select className="form-select" value={form.project_type} onChange={e => setForm({ ...form, project_type: e.target.value })}><option value="">Select type</option>{DEVELOPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.current_status} onChange={e => setForm({ ...form, current_status: e.target.value })}>{DEVELOPMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Location</label><input className="form-input" placeholder="Location description" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Nearby Area</label><input className="form-input" placeholder="Affected area" value={form.nearby_area} onChange={e => setForm({ ...form, nearby_area: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Expected Completion</label><input className="form-input" type="date" value={form.expected_completion} onChange={e => setForm({ ...form, expected_completion: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Latitude</label><input className="form-input" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Longitude</label><input className="form-input" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>

        <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-base)' }}>
          <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-base)' }}>Impact on Property Prices</h4>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Expected Impact</label><select className="form-select" value={form.expected_impact} onChange={e => setForm({ ...form, expected_impact: e.target.value })}><option value="">Select level</option>{IMPACT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Source / Reference</label><input className="form-input" placeholder="News article, govt notice..." value={form.source_reference} onChange={e => setForm({ ...form, source_reference: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Why do you expect this impact?</label><textarea className="form-textarea" rows={2} placeholder="Your analysis..." value={form.impact_explanation} onChange={e => setForm({ ...form, impact_explanation: e.target.value })} /></div>
        </div>

        <div className="form-group"><label className="form-label">Personal Notes</label><textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-divider)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <><Save size={16} /> Save Development</>}
          </button>
        </div>
      </form>
    </div>
  );
}
