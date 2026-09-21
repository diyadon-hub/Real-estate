'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save, Upload, X, MapPin, Image as ImageIcon, Search } from 'lucide-react';
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
    latitude: '', longitude: '', google_maps_link: '',
    number_of_floors: '',
    length: '', width: '', total_area: '', area_unit: 'sq.ft',
    facing: '', road_width: '', is_corner: false, development_status: '',
    status: 'Available',
    owner_name: '', agent_name: '',
    price_per_unit: '', is_negotiable: false,
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

  // Get the display label for the currently selected area unit
  const getUnitLabel = () => {
    const unit = AREA_UNITS.find(u => u.value === form.area_unit);
    return unit ? unit.label : form.area_unit;
  };

  // Get short unit label for display in calculations
  const getShortUnitLabel = () => {
    const map = { 'sq.ft': 'sq ft', 'sq.m': 'sq m', 'sq.yards': 'sq yards', 'acre': 'acre', 'guntha': 'guntha' };
    return map[form.area_unit] || form.area_unit;
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
      if (field === 'area_id') {
        const area = areas.find(a => a.id === value);
        if (area) updated.area_name = area.name;
      }
      return updated;
    });
  };

  // Calculate total value dynamically (for display only)
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
    // Pattern: @lat,lng or q=lat,lng or ll=lat,lng
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
      const numberFields = ['length', 'width', 'total_area', 'price_per_unit',
        'latitude', 'longitude', 'number_of_floors'];
      const booleanFields = ['is_corner', 'is_negotiable'];

      Object.entries(form).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (numberFields.includes(key)) {
            propertyData[key] = value ? Number(value) : null;
          } else if (booleanFields.includes(key)) {
            propertyData[key] = Boolean(value);
          } else {
            propertyData[key] = value;
          }
        }
      });

      // Calculate total estimated value from price_per_unit × total_area
      const totalValue = getTotalValue();
      if (totalValue) {
        propertyData.total_estimated_value = Math.round(totalValue);
      }

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

  const totalValue = getTotalValue();

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
                <input className="form-input" placeholder="e.g., Apartment, Plot" value={form.property_type} onChange={e => updateField('property_type', e.target.value)} />
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
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Number of Floors</label>
                <input className="form-input" type="number" min="0" step="1" placeholder="e.g., 3" value={form.number_of_floors} onChange={e => updateField('number_of_floors', e.target.value)} />
              </div>
              <div className="form-group" />
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
            <div className="form-group">
              <label className="form-label">Area / Locality</label>
              <input className="form-input" placeholder="e.g., Koramangala" value={form.area_name} onChange={e => updateField('area_name', e.target.value)} />
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

            {/* Google Maps Location */}
            <div className="form-group">
              <label className="form-label"><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Google Maps Location</label>
              <input
                className="form-input"
                placeholder="Paste Google Maps link or search URL..."
                value={form.google_maps_link}
                onChange={e => handleMapsLinkChange(e.target.value)}
              />
              <span className="form-hint">Paste a Google Maps link to auto-fill coordinates, or enter latitude/longitude manually below</span>
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
            {form.latitude && form.longitude && (
              <div className={styles.mapPreview}>
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
                <input className="form-input" placeholder="e.g., Mr. Ravi Kumar" value={form.owner_name} onChange={e => updateField('owner_name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Agent's Name</label>
                <input className="form-input" placeholder="e.g., Mr. Suresh" value={form.agent_name} onChange={e => updateField('agent_name', e.target.value)} />
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
                <input className="form-input" type="number" step="any" placeholder={`e.g., ${form.area_unit === 'sq.m' ? '50000' : '5000'}`} value={form.price_per_unit} onChange={e => updateField('price_per_unit', e.target.value)} />
                {totalValue && (
                  <span className="form-hint" style={{ color: 'var(--color-success)' }}>
                    Total Value: {Number(form.total_area).toLocaleString('en-IN')} {getShortUnitLabel()} × ₹{Number(form.price_per_unit).toLocaleString('en-IN')} = ₹{Math.round(totalValue).toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label className="form-checkbox">
                  <input type="checkbox" checked={form.is_negotiable} onChange={e => updateField('is_negotiable', e.target.checked)} />
                  Negotiable
                </label>
                <span className="form-hint" style={{ marginTop: 4 }}>
                  {form.is_negotiable ? '✓ Price is negotiable' : 'Price is non-negotiable'}
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
