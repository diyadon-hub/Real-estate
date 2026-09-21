'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Upload, X, MapPin, Image as ImageIcon } from 'lucide-react';
import { PROPERTY_TYPES, PROPERTY_STATUSES, FACING_OPTIONS, AREA_UNITS } from '@/lib/utils/constants';
import { calculateArea, calculateTotalValue, calculateRate } from '@/lib/utils/calculations';
import addStyles from '../../add/add.module.css';

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
    formData.negotiable_price = data.negotiable_price !== null && data.negotiable_price !== undefined ? String(data.negotiable_price) : '';
    setForm(formData);
    setLoading(false);
  };

  // Get short unit label for display
  const getShortUnitLabel = () => {
    const map = { 'sq.ft': 'sq ft', 'sq.m': 'sq m', 'sq.yards': 'sq yards', 'acre': 'acre', 'guntha': 'guntha' };
    return map[form.area_unit] || form.area_unit || 'sq ft';
  };

  const updateField = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate total area from length × width
      if (field === 'length' || field === 'width') {
        const l = field === 'length' ? value : prev.length;
        const w = field === 'width' ? value : prev.width;
        const area = calculateArea(l, w);
        if (area !== null) {
          updated.total_area = String(area);
        }
      }
      return updated;
    });
  };

  // Calculate total value dynamically
  const getTotalValue = () => {
    const area = Number(form.total_area);
    const rate = Number(form.price_per_unit);
    if (area > 0 && rate > 0) {
      return area * rate;
    }
    return null;
  };

  // Parse Google Maps link to extract coordinates
  const parseGoogleMapsLink = (link) => {
    if (!link) return null;
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /place\/[^/]+\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];
    for (const pattern of patterns) {
      const match = link.match(pattern);
      if (match) {
        return { lat: match[1], lng: match[2] };
      }
    }
    return null;
  };

  const handleMapsLinkChange = (link) => {
    setForm(prev => {
      const updated = { ...prev, google_maps_link: link };
      const coords = parseGoogleMapsLink(link);
      if (coords) {
        updated.latitude = coords.lat;
        updated.longitude = coords.lng;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updateData = {};
      const numberFields = ['length', 'width', 'total_area', 'price_per_unit', 'negotiable_price',
        'latitude', 'longitude', 'number_of_floors',
        'asking_price', 'price_per_sqft', 'price_per_sqyard',
        'total_estimated_value', 'previous_price', 'purchase_price', 'expected_selling_price'];
      const booleanFields = ['is_corner'];

      Object.entries(form).forEach(([key, value]) => {
        if (['id', 'user_id', 'created_at', 'updated_at', 'display_id', 'is_deleted', 'deleted_at'].includes(key)) return;
        if (numberFields.includes(key)) {
          updateData[key] = value ? Number(value) : null;
        } else if (booleanFields.includes(key)) {
          updateData[key] = Boolean(value);
        } else {
          updateData[key] = value || null;
        }
      });

      // Calculate total estimated value from price_per_unit × total_area
      const totalValue = getTotalValue();
      if (totalValue) {
        updateData.total_estimated_value = Math.round(totalValue);
      }

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

  const totalValue = getTotalValue();

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
                <input className="form-input" placeholder="e.g., Apartment, Plot" value={form.property_type || ''} onChange={e => updateField('property_type', e.target.value)} />
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
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Number of Floors</label>
                <input className="form-input" type="number" min="0" step="1" value={form.number_of_floors || ''} onChange={e => updateField('number_of_floors', e.target.value)} />
              </div>
              <div className="form-group" />
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div className="form-section">
          <h3 className="form-section-title">Dimensions & Area</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Length</label>
                <input className="form-input" type="number" step="any" value={form.length || ''} onChange={e => updateField('length', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Width</label>
                <input className="form-input" type="number" step="any" value={form.width || ''} onChange={e => updateField('width', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Area</label>
                <input className="form-input" type="number" step="any" value={form.total_area || ''} onChange={e => updateField('total_area', e.target.value)} />
                {form.length && form.width && (
                  <span className="form-hint" style={{ color: 'var(--color-success)' }}>
                    = {Number(form.length).toLocaleString('en-IN')} × {Number(form.width).toLocaleString('en-IN')} = {(Number(form.length) * Number(form.width)).toLocaleString('en-IN')} {getShortUnitLabel()}
                  </span>
                )}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Area Unit</label>
                <select className="form-select" value={form.area_unit || 'sq.ft'} onChange={e => updateField('area_unit', e.target.value)}>
                  {AREA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Facing</label>
                <select className="form-select" value={form.facing || ''} onChange={e => updateField('facing', e.target.value)}>
                  <option value="">Select</option>
                  {FACING_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Road Width</label>
                <input className="form-input" value={form.road_width || ''} onChange={e => updateField('road_width', e.target.value)} />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className="form-checkbox">
                  <input type="checkbox" checked={form.is_corner || false} onChange={e => updateField('is_corner', e.target.checked)} />
                  Corner Property
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <h3 className="form-section-title">Location</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Area / Locality</label>
                <input className="form-input" value={form.area_name || ''} onChange={e => updateField('area_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city || ''} onChange={e => updateField('city', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address || ''} onChange={e => updateField('address', e.target.value)} />
            </div>

            {/* Google Maps Location */}
            <div className="form-group">
              <label className="form-label"><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Google Maps Location</label>
              <input
                className="form-input"
                placeholder="Paste Google Maps link or search URL..."
                value={form.google_maps_link || ''}
                onChange={e => handleMapsLinkChange(e.target.value)}
              />
              <span className="form-hint">Paste a Google Maps link to auto-fill coordinates</span>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-input" type="number" step="any" value={form.latitude || ''} onChange={e => updateField('latitude', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-input" type="number" step="any" value={form.longitude || ''} onChange={e => updateField('longitude', e.target.value)} />
              </div>
            </div>
            {form.latitude && form.longitude && (
              <div className={addStyles.mapPreview}>
                <iframe
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: 'var(--radius-md)' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&q=${form.latitude},${form.longitude}&zoom=15`}
                  allowFullScreen
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="form-hint"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}
                >
                  <MapPin size={12} /> Open in Google Maps
                </a>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Nearby Landmark</label>
              <input className="form-input" value={form.nearby_landmark || ''} onChange={e => updateField('nearby_landmark', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Owner & Agent Details */}
        <div className="form-section">
          <h3 className="form-section-title">Owner & Agent Details</h3>
          <span className="form-hint" style={{ display: 'block', marginBottom: 'var(--space-sm)', marginTop: '-4px' }}>
            🔒 These details are private and will not be publicly visible
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Owner's Name</label>
                <input className="form-input" placeholder="e.g., Mr. Ravi Kumar" value={form.owner_name || ''} onChange={e => updateField('owner_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Agent's Name</label>
                <input className="form-input" placeholder="e.g., Mr. Suresh" value={form.agent_name || ''} onChange={e => updateField('agent_name', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="form-section">
          <h3 className="form-section-title">Pricing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price per {getShortUnitLabel()} (₹)</label>
                <input className="form-input" type="number" step="any" placeholder={`e.g., ${form.area_unit === 'sq.m' ? '50000' : '5000'}`} value={form.price_per_unit || ''} onChange={e => updateField('price_per_unit', e.target.value)} />
                {totalValue && (
                  <span className="form-hint" style={{ color: 'var(--color-success)' }}>
                    Total Value: {Number(form.total_area).toLocaleString('en-IN')} {getShortUnitLabel()} × ₹{Number(form.price_per_unit).toLocaleString('en-IN')} = ₹{Math.round(totalValue).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Negotiable Price (₹)</label>
                <input className="form-input" type="number" step="any" placeholder="e.g., 48000" value={form.negotiable_price || ''} onChange={e => updateField('negotiable_price', e.target.value)} />
                <span className="form-hint" style={{ marginTop: 4 }}>
                  Enter the final negotiable price if applicable
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="form-section">
          <h3 className="form-section-title">Description & Notes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={4} value={form.description || ''} onChange={e => updateField('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Internal Notes</label>
              <textarea className="form-textarea" rows={3} value={form.internal_notes || ''} onChange={e => updateField('internal_notes', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Development Potential</label>
              <input className="form-input" value={form.development_potential || ''} onChange={e => updateField('development_potential', e.target.value)} />
            </div>
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
