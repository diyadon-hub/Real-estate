'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const { data: properties } = await supabase.from('properties').select('property_type, status, area_name, asking_price, price_per_sqft, total_area').eq('is_deleted', false);
      const { data: documents } = await supabase.from('documents').select('property_id').eq('is_deleted', false);
      const { data: areas } = await supabase.from('areas').select('name, current_avg_rate');

      // Type distribution
      const byType = {};
      const byStatus = {};
      const byArea = {};
      (properties || []).forEach(p => {
        const t = p.property_type || 'Other';
        const s = p.status || 'Available';
        const a = p.area_name || 'Unknown';
        byType[t] = (byType[t] || 0) + 1;
        byStatus[s] = (byStatus[s] || 0) + 1;
        byArea[a] = (byArea[a] || 0) + 1;
      });

      // Properties with docs
      const propsWithDocs = new Set((documents || []).map(d => d.property_id));
      const totalProps = (properties || []).length;
      const withDocs = propsWithDocs.size;

      // Average price by area
      const avgPriceByArea = {};
      (properties || []).forEach(p => {
        if (p.area_name && p.price_per_sqft) {
          if (!avgPriceByArea[p.area_name]) avgPriceByArea[p.area_name] = { total: 0, count: 0 };
          avgPriceByArea[p.area_name].total += Number(p.price_per_sqft);
          avgPriceByArea[p.area_name].count += 1;
        }
      });

      setData({ byType, byStatus, byArea, totalProps, withDocs, avgPriceByArea, areas });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading) return <div style={{ maxWidth: 900 }}><div className="skeleton" style={{ height: 400, borderRadius: 12 }} /></div>;

  const barColors = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#EA580C', '#6B7280', '#0891B2'];

  const renderBarChart = (data, title) => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...entries.map(e => e[1]), 1);
    return (
      <div className="card">
        <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>{title}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {entries.map(([key, value], i) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <span style={{ width: 100, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', textAlign: 'right', flexShrink: 0 }}>{key}</span>
              <div style={{ flex: 1, height: 24, background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: barColors[i % barColors.length], borderRadius: 'var(--radius-sm)', transition: 'width 0.5s ease', minWidth: 2 }} />
              </div>
              <span style={{ width: 30, fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header"><div><h1 className="page-title">Analytics</h1><p className="page-subtitle">Property portfolio overview</p></div></div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-base)', marginBottom: 'var(--space-xl)' }}>
        <div className="summary-card"><span className="summary-card-label">Total Properties</span><span className="summary-card-value">{data?.totalProps || 0}</span></div>
        <div className="summary-card"><span className="summary-card-label">With Documents</span><span className="summary-card-value">{data?.withDocs || 0}</span></div>
        <div className="summary-card"><span className="summary-card-label">Without Documents</span><span className="summary-card-value">{(data?.totalProps || 0) - (data?.withDocs || 0)}</span></div>
        <div className="summary-card"><span className="summary-card-label">Doc Completeness</span><span className="summary-card-value">{data?.totalProps ? Math.round((data.withDocs / data.totalProps) * 100) : 0}%</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-base)' }}>
        {data?.byType && Object.keys(data.byType).length > 0 && renderBarChart(data.byType, 'Properties by Type')}
        {data?.byStatus && Object.keys(data.byStatus).length > 0 && renderBarChart(data.byStatus, 'Properties by Status')}
        {data?.byArea && Object.keys(data.byArea).length > 0 && renderBarChart(data.byArea, 'Properties by Area')}
        {data?.avgPriceByArea && Object.keys(data.avgPriceByArea).length > 0 && (
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Average Rate by Area</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {Object.entries(data.avgPriceByArea).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count)).map(([area, v]) => (
                <div key={area} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--color-divider)', fontSize: 'var(--font-size-base)' }}>
                  <span>{area}</span><strong>₹{Math.round(v.total / v.count).toLocaleString('en-IN')}/sqft</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data?.totalProps === 0 && (
        <div className="card"><div className="empty-state">
          <BarChart3 size={32} className="empty-state-icon" />
          <p className="empty-state-title">No data to analyze</p>
          <p className="empty-state-description">Add properties to see analytics and insights.</p>
        </div></div>
      )}
    </div>
  );
}
