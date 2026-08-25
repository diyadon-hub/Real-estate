'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Upload, X, MapPin, Image as ImageIcon } from 'lucide-react';
import { PROPERTY_TYPES, PROPERTY_STATUSES, FACING_OPTIONS, AREA_UNITS } from '@/lib/utils/constants';
import { calculateArea, calculateTotalValue, calculateRate } from '@/lib/utils/calculations';
import styles from './add.module.css';

export default function AddPropertyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [areas, setAreas] = useState([]);

  const [form, setForm] = useState({
    title: '', property_type: '', area_name: '', area_id: '',
    address: '', city: '', plot_number: '', survey_number: '',
    latitude: '', longitude: '',
    length: '', width: '', total_area: '', area_unit: 'sq.ft',
    facing: '', road_width: '', is_corner: false, development_status: '',
    status: 'Available',
    asking_price: '', price_per_sqft: '', price_per_sqyard: '',
    total_estimated_value: '', previous_price: '', purchase_price: '', expected_selling_price: '',
    description: '', internal_notes: '',
    nearby_landmark: '', development_potential: '',
  });

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    const { data } = await supabase.from('areas').select('id, name').eq('is_deleted', false).order('name');
    setAreas(data || []);
  };

  const updateField = (field, value) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate
      if (field === 'length' || field === 'width') {
        const area = calculateArea(
          field === 'length' ? value : prev.length,
          field === 'width' ? value : prev.width
        );
        if (area && !prev.total_area) updated.total_area = String(area);
      }
      if ((field === 'total_area' || field === 'price_per_sqft') && !prev.total_estimated_value) {
        const total = calculateTotalValue(
          field === 'total_area' ? value : prev.total_area,
          field === 'price_per_sqft' ? value : prev.price_per_sqft
        );
        if (total) updated.total_estimated_value = String(Math.round(total));
      }
      if ((field === 'total_estimated_value' || field === 'total_area') && !prev.price_per_sqft) {
        const rate = calculateRate(
          field === 'total_estimated_value' ? value : prev.total_estimated_value,
          field === 'total_area' ? value : prev.total_area
        );
        if (rate) updated.price_per_sqft = String(Math.round(rate));
      }
      if (field === 'area_id') {
        const area = areas.find(a => a.id === value);
        if (area) updated.area_name = area.name;
      }
      return updated;
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, { preview: ev.target.result, name: file.name }]);
        setImageFiles(prev => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, { preview: ev.target.result, name: file.name }]);
        setImageFiles(prev => [...prev, file]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Build the property data - only include non-empty values
      const propertyData = { user_id: user.id };
      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (['length', 'width', 'total_area', 'asking_price', 'price_per_sqft', 'price_per_sqyard',
            'total_estimated_value', 'previous_price', 'purchase_price', 'expected_selling_price',
            'latitude', 'longitude'].includes(key)) {
            propertyData[key] = value ? Number(value) : null;
          } else if (key === 'is_corner') {
            propertyData[key] = Boolean(value);
          } else {
            propertyData[key] = value;
          }
        }
      });

      const { data: property, error: insertError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload images
      if (imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${property.id}/${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('property-images')
              .getPublicUrl(filePath);

            await supabase.from('property_images').insert({
              property_id: property.id,
              user_id: user.id,
              url: publicUrl,
              storage_path: filePath,
              file_name: file.name,
              file_size: file.size,
              is_primary: i === 0,
              sort_order: i,
            });

            // Set primary image on property
            if (i === 0) {
              await supabase.from('properties').update({ primary_image_url: publicUrl }).eq('id', property.id);
            }
          }
        }
      }

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user.id,
        entity_type: 'property',
        entity_id: property.id,
        entity_name: property.title || 'Untitled Property',
        action: 'created',
      });

      router.push(`/properties/${property.id}`);
    } catch (err) {
      setError(err.message || 'Something went wrong while saving. Please try again.');
      console.error('Error saving property:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className="btn btn-ghost" onClick={() => router.back()}>
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="page-title">Add Property</h1>
      </div>

      {error && <div className={styles.errorBar}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Property Information */}
        <div className="form-section">
          <h3 className="form-section-title">Property Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-group">
              <label className="form-label">Property Name / Title</label>
              <input className="form-input" placeholder="e.g., Plot near XYZ" value={form.title} onChange={e => updateField('title', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Property Type</label>
                <select className="form-select" value={form.property_type} onChange={e => updateField('property_type', e.target.value)}>
                  <option value="">Select type</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => updateField('status', e.target.value)}>
                  {PROPERTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Plot Number</label>
                <input className="form-input" placeholder="e.g., 42" value={form.plot_number} onChange={e => updateField('plot_number', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Survey Number</label>
                <input className="form-input" placeholder="e.g., 123/A" value={form.survey_number} onChange={e => updateField('survey_number', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Dimensions & Area */}
        <div className="form-section">
          <h3 className="form-section-title">Dimensions & Area</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Length</label>
                <input className="form-input" type="number" step="any" placeholder="e.g., 30" value={form.length} onChange={e => updateField('length', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Width</label>
                <input className="form-input" type="number" step="any" placeholder="e.g., 40" value={form.width} onChange={e => updateField('width', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Total Area</label>
                <input className="form-input" type="number" step="any" placeholder="Auto-calculated" value={form.total_area} onChange={e => updateField('total_area', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Area Unit</label>
                <select className="form-select" value={form.area_unit} onChange={e => updateField('area_unit', e.target.value)}>
                  {AREA_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Facing</label>
                <select className="form-select" value={form.facing} onChange={e => updateField('facing', e.target.value)}>
                  <option value="">Select facing</option>
                  {FACING_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Road Width</label>
                <input className="form-input" placeholder="e.g., 30 ft" value={form.road_width} onChange={e => updateField('road_width', e.target.value)} />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className="form-checkbox">
                  <input type="checkbox" checked={form.is_corner} onChange={e => updateField('is_corner', e.target.checked)} />
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
                <select className="form-select" value={form.area_id} onChange={e => updateField('area_id', e.target.value)}>
                  <option value="">Select or type area</option>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <span className="form-hint">Or type a custom area name below</span>
              </div>
              <div className="form-group">
                <label className="form-label">Area Name (custom)</label>
                <input className="form-input" placeholder="e.g., Koramangala" value={form.area_name} onChange={e => updateField('area_name', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" placeholder="Full address" value={form.address} onChange={e => updateField('address', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" placeholder="e.g., Bangalore" value={form.city} onChange={e => updateField('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nearby Landmark</label>
                <input className="form-input" placeholder="e.g., Near XYZ Hospital" value={form.nearby_landmark} onChange={e => updateField('nearby_landmark', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-input" type="number" step="any" placeholder="e.g., 12.9716" value={form.latitude} onChange={e => updateField('latitude', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-input" type="number" step="any" placeholder="e.g., 77.5946" value={form.longitude} onChange={e => updateField('longitude', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="form-section">
          <h3 className="form-section-title">Pricing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Asking Price (₹)</label>
                <input className="form-input" type="number" step="any" placeholder="e.g., 2400000" value={form.asking_price} onChange={e => updateField('asking_price', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Rate per Sq.Ft (₹)</label>
                <input className="form-input" type="number" step="any" placeholder="e.g., 2000" value={form.price_per_sqft} onChange={e => updateField('price_per_sqft', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Value (₹)</label>
                <input className="form-input" type="number" step="any" placeholder="Auto-calculated" value={form.total_estimated_value} onChange={e => updateField('total_estimated_value', e.target.value)} />
                {form.total_area && form.price_per_sqft && (
                  <span className="form-hint" style={{ color: 'var(--color-success)' }}>
                    = {Number(form.total_area).toLocaleString('en-IN')} × ₹{Number(form.price_per_sqft).toLocaleString('en-IN')} = ₹{(Number(form.total_area) * Number(form.price_per_sqft)).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Previous Price (₹)</label>
                <input className="form-input" type="number" step="any" value={form.previous_price} onChange={e => updateField('previous_price', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price (₹)</label>
                <input className="form-input" type="number" step="any" value={form.purchase_price} onChange={e => updateField('purchase_price', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Selling Price (₹)</label>
                <input className="form-input" type="number" step="any" value={form.expected_selling_price} onChange={e => updateField('expected_selling_price', e.target.value)} />
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
              <textarea className="form-textarea" rows={4} placeholder="Property description, details, observations..." value={form.description} onChange={e => updateField('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Internal Notes</label>
              <textarea className="form-textarea" rows={3} placeholder="Private notes (not shown to others)" value={form.internal_notes} onChange={e => updateField('internal_notes', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Development Potential</label>
              <input className="form-input" placeholder="e.g., Good for residential layout" value={form.development_potential} onChange={e => updateField('development_potential', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="form-section">
          <h3 className="form-section-title">Images</h3>
          <div
            className={styles.dropZone}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <ImageIcon size={24} style={{ color: 'var(--color-text-tertiary)' }} />
            <p>Drag & drop images here, or <label className={styles.uploadLabel}>browse<input type="file" accept="image/*" multiple onChange={handleImageUpload} hidden /></label></p>
            <span className="form-hint">Supports JPG, PNG, WebP</span>
          </div>
          {images.length > 0 && (
            <div className={styles.imageGrid}>
              {images.map((img, i) => (
                <div key={i} className={styles.imageThumb}>
                  <img src={img.preview} alt={img.name} />
                  <button className={styles.imageRemove} onClick={() => removeImage(i)}>
                    <X size={14} />
                  </button>
                  {i === 0 && <span className={styles.primaryBadge}>Primary</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <span className="spinner" /> : <><Save size={16} /> Save Property</>}
          </button>
        </div>
      </form>
    </div>
  );
}
