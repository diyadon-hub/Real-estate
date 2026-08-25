'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';
import { AREA_UNITS } from '@/lib/utils/constants';

export default function AddAreaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', city: '', taluk: '', district: '', state: '', pincode: '',
    latitude: '', longitude: '', description: '',
    current_avg_rate: '', rate_unit: 'sq.ft',
    development_level: '', important_places: '', notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Area name is required'); return; }
    setSaving(true); setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const areaData = { user_id: user.id };
      Object.entries(form).forEach(([k, v]) => {
        if (v) {
          if (['latitude', 'longitude', 'current_avg_rate'].includes(k)) areaData[k] = Number(v);
          else areaData[k] = v;
        }
      });

      const { data, error: err } = await supabase.from('areas').insert(areaData).select().single();
      if (err) throw err;

      await supabase.from('activity_log').insert({
        user_id: user.id, entity_type: 'area', entity_id: data.id, entity_name: data.name, action: 'created',
      });

      router.push(`/areas/${data.id}`);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <button className="btn btn-ghost" onClick={() => router.back()}><ArrowLeft size={18} /></button>
        <h1 className="page-title">Add Area</h1>
      </div>
      {error && <div style={{ padding: 'var(--space-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
        <div className="form-group"><label className="form-label">Area Name *</label><input className="form-input" placeholder="e.g., Koramangala" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Taluk</label><input className="form-input" value={form.taluk} onChange={e => setForm({ ...form, taluk: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">District</label><input className="form-input" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">State</label><input className="form-input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Current Avg Rate</label><input className="form-input" type="number" step="any" placeholder="e.g., 2000" value={form.current_avg_rate} onChange={e => setForm({ ...form, current_avg_rate: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Rate Unit</label><select className="form-select" value={form.rate_unit} onChange={e => setForm({ ...form, rate_unit: e.target.value })}>{AREA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Latitude</label><input className="form-input" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Longitude</label><input className="form-input" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">Important Places Nearby</label><input className="form-input" value={form.important_places} onChange={e => setForm({ ...form, important_places: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-divider)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : <><Save size={16} /> Save Area</>}</button>
        </div>
      </form>
    </div>
  );
}
