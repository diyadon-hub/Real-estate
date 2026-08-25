'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from 'lucide-react';
import { PROPERTY_TYPES, PROPERTY_STATUSES, FACING_OPTIONS, AREA_UNITS } from '@/lib/utils/constants';
import { calculateArea, calculateTotalValue, calculateRate } from '@/lib/utils/calculations';
import addStyles from '../add/add.module.css';

export default function EditPropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => { loadProperty(); loadAreas(); }, [id]);

  const loadAreas = async () => {
    const { data } = await supabase.from('areas').select('id, name').eq('is_deleted', false).order('name');
    setAreas(data || []);
  };

  const loadProperty = async () => {
    const { data } = await supabase.from('properties').select('*').eq('id', id).single();
    if (!data) { router.push('/properties'); return; }
    const formData = {};
    Object.entries(data).forEach(([key, value]) => {
      formData[key] = value !== null && value !== undefined ? String(value) : '';
    });
    formData.is_corner = data.is_corner || false;
    setForm(formData);
    setLoading(false);
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updateData = {};
      const numberFields = ['length', 'width', 'total_area', 'asking_price', 'price_per_sqft', 'price_per_sqyard',
        'total_estimated_value', 'previous_price', 'purchase_price', 'expected_selling_price', 'latitude', 'longitude'];

      Object.entries(form).forEach(([key, value]) => {
        if (['id', 'user_id', 'created_at', 'updated_at', 'display_id', 'is_deleted', 'deleted_at'].includes(key)) return;
        if (numberFields.includes(key)) {
          updateData[key] = value ? Number(value) : null;
        } else if (key === 'is_corner') {
          updateData[key] = Boolean(value);
        } else {
          updateData[key] = value || null;
        }
      });

      const { error: updateError } = await supabase.from('properties').update(updateData).eq('id', id);
      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          user_id: user.id, entity_type: 'property', entity_id: id,
          entity_name: form.title || 'Untitled', action: 'updated',
        });
      }

      router.push(`/properties/${id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={addStyles.page}><div className="skeleton" style={{ height: 400, borderRadius: 12 }} /></div>;

  return (
    <div className={addStyles.page}>
      <div className={addStyles.header}>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="page-title">Edit Property</h1>
      </div>

      {error && <div className={addStyles.errorBar}>{error}</div>}

      <form onSubmit={handleSubmit} className={addStyles.form}>
        {/* Property Information */}
        <div className="form-section">
          <h3 className="form-section-title">Property Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-group">
              <label className="form-label">Property Name / Title</label>
              <input className="form-input" value={form.title || ''} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select className="form-select" value={form.property_type || ''} onChange={e => updateField('property_type', e.target.value)}>
                  <option value="">Select type</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status || 'Available'} onChange={e => updateField('status', e.target.value)}>
                  {PROPERTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Plot Number</label>
                <input className="form-input" value={form.plot_number || ''} onChange={e => updateField('plot_number', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Survey Number</label>
                <input className="form-input" value={form.survey_number || ''} onChange={e => updateField('survey_number', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="form-section">
          <h3 className="form-section-title">Dimensions & Area</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Length</label><input className="form-input" type="number" step="any" value={form.length || ''} onChange={e => updateField('length', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Width</label><input className="form-input" type="number" step="any" value={form.width || ''} onChange={e => updateField('width', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Total Area</label><input className="form-input" type="number" step="any" value={form.total_area || ''} onChange={e => updateField('total_area', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Area Unit</label><select className="form-select" value={form.area_unit || 'sq.ft'} onChange={e => updateField('area_unit', e.target.value)}>{AREA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Facing</label><select className="form-select" value={form.facing || ''} onChange={e => updateField('facing', e.target.value)}><option value="">Select</option>{FACING_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Road Width</label><input className="form-input" value={form.road_width || ''} onChange={e => updateField('road_width', e.target.value)} /></div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}><label className="form-checkbox"><input type="checkbox" checked={form.is_corner || false} onChange={e => updateField('is_corner', e.target.checked)} /> Corner Property</label></div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <h3 className="form-section-title">Location</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Area / Locality</label><input className="form-input" value={form.area_name || ''} onChange={e => updateField('area_name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.city || ''} onChange={e => updateField('city', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address || ''} onChange={e => updateField('address', e.target.value)} /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Latitude</label><input className="form-input" type="number" step="any" value={form.latitude || ''} onChange={e => updateField('latitude', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Longitude</label><input className="form-input" type="number" step="any" value={form.longitude || ''} onChange={e => updateField('longitude', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label">Nearby Landmark</label><input className="form-input" value={form.nearby_landmark || ''} onChange={e => updateField('nearby_landmark', e.target.value)} /></div>
          </div>
        </div>

        {/* Pricing */}
        <div className="form-section">
          <h3 className="form-section-title">Pricing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Asking Price (₹)</label><input className="form-input" type="number" step="any" value={form.asking_price || ''} onChange={e => updateField('asking_price', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Rate/Sq.Ft (₹)</label><input className="form-input" type="number" step="any" value={form.price_per_sqft || ''} onChange={e => updateField('price_per_sqft', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Estimated Value (₹)</label><input className="form-input" type="number" step="any" value={form.total_estimated_value || ''} onChange={e => updateField('total_estimated_value', e.target.value)} /></div>
            </div>
            <div className="form-row-3">
              <div className="form-group"><label className="form-label">Previous Price (₹)</label><input className="form-input" type="number" step="any" value={form.previous_price || ''} onChange={e => updateField('previous_price', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Purchase Price (₹)</label><input className="form-input" type="number" step="any" value={form.purchase_price || ''} onChange={e => updateField('purchase_price', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Expected Selling (₹)</label><input className="form-input" type="number" step="any" value={form.expected_selling_price || ''} onChange={e => updateField('expected_selling_price', e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="form-section">
          <h3 className="form-section-title">Description & Notes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={4} value={form.description || ''} onChange={e => updateField('description', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Internal Notes</label><textarea className="form-textarea" rows={3} value={form.internal_notes || ''} onChange={e => updateField('internal_notes', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Development Potential</label><input className="form-input" value={form.development_potential || ''} onChange={e => updateField('development_potential', e.target.value)} /></div>
          </div>
        </div>

        <div className={addStyles.actions}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
