'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, TrendingUp, MapPin, Plus, Trash2, Edit, Save, Home, Building2 } from 'lucide-react';
import { formatRate, formatDate, formatCurrency } from '@/lib/utils/formatting';
import { calculatePriceGrowth } from '@/lib/utils/calculations';

export default function AreaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [area, setArea] = useState(null);
  const [properties, setProperties] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [priceForm, setPriceForm] = useState({ year: new Date().getFullYear(), rate: '', notes: '' });

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const { data: a } = await supabase.from('areas').select('*').eq('id', id).single();
      if (!a) { router.push('/areas'); return; }
      setArea(a);

      const { data: props } = await supabase.from('properties').select('id, title, display_id, status, asking_price').eq('area_id', id).eq('is_deleted', false);
      setProperties(props || []);

      const { data: history } = await supabase.from('price_history').select('*').eq('area_id', id).order('year', { ascending: true });
      setPriceHistory(history || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddPrice = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('price_history').insert({
        area_id: id, user_id: user.id, year: Number(priceForm.year), rate: Number(priceForm.rate),
        rate_unit: area.rate_unit || 'sq.ft', notes: priceForm.notes || null,
      });
      setShowAddPrice(false);
      setPriceForm({ year: new Date().getFullYear(), rate: '', notes: '' });
      load();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ maxWidth: 700 }}><div className="skeleton" style={{ height: 300, borderRadius: 12 }} /></div>;
  if (!area) return null;

  const growth = calculatePriceGrowth(priceHistory);

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
          <button className="btn btn-ghost" onClick={() => router.push('/areas')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{area.name}</h1>
            <p className="page-subtitle">{[area.city, area.district, area.state].filter(Boolean).join(', ')}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
        {/* Current Rate */}
        {area.current_avg_rate && (
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={18} style={{ color: '#059669' }} /></div>
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Current Average Rate</div>
              <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>{formatRate(area.current_avg_rate, area.rate_unit)}</div>
            </div>
          </div>
        )}

        {/* Price History */}
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Price History</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddPrice(true)}><Plus size={14} /> Add</button>
          </div>
          {priceHistory.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', marginTop: 8 }}>No price history recorded</p>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--space-sm)' }}>
                {priceHistory.map(ph => (
                  <div key={ph.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--color-divider)', fontSize: 'var(--font-size-base)' }}>
                    <span style={{ fontWeight: 500 }}>{ph.year}</span>
                    <span>{formatRate(ph.rate, ph.rate_unit)}</span>
                  </div>
                ))}
              </div>
              {growth && (
                <div style={{ marginTop: 'var(--space-base)', padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Growth Analysis ({growth.startYear}–{growth.endYear})</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}>
                    <div>Total Growth: <strong>{growth.percentageIncrease.toFixed(1)}%</strong></div>
                    <div>CAGR: <strong>{growth.cagr?.toFixed(1)}%</strong></div>
                    <div>Highest: <strong>₹{growth.highest.toLocaleString('en-IN')}</strong></div>
                    <div>Lowest: <strong>₹{growth.lowest.toLocaleString('en-IN')}</strong></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Properties in this area */}
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}>Properties ({properties.length})</h3>
          {properties.length === 0 ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No properties in this area</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {properties.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-sm)', cursor: 'pointer', borderRadius: 'var(--radius-md)' }} onClick={() => router.push(`/properties/${p.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <Home size={14} /><span style={{ fontWeight: 500, fontSize: 'var(--font-size-base)' }}>{p.title || p.display_id}</span>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-sm)' }}>{p.asking_price ? formatCurrency(p.asking_price) : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {area.description && <div className="card"><h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}>Description</h3><p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{area.description}</p></div>}
        {area.notes && <div className="card"><h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}>Notes</h3><p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>{area.notes}</p></div>}
      </div>

      {/* Add Price Modal */}
      {showAddPrice && (
        <div className="modal-overlay" onClick={() => setShowAddPrice(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Add Price Record</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddPrice(false)}>✕</button></div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
              <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={priceForm.year} onChange={e => setPriceForm({ ...priceForm, year: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Rate (₹/{area.rate_unit || 'sq.ft'})</label><input className="form-input" type="number" step="any" placeholder="e.g., 2000" value={priceForm.rate} onChange={e => setPriceForm({ ...priceForm, rate: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={priceForm.notes} onChange={e => setPriceForm({ ...priceForm, notes: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowAddPrice(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddPrice} disabled={!priceForm.rate}>Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
