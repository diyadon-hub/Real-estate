'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, List, Grid, Filter, X } from 'lucide-react';
import { formatCurrency, formatArea, formatDimensions } from '@/lib/utils/formatting';
import { PROPERTY_TYPES, PROPERTY_STATUSES, FACING_OPTIONS, SMART_FILTERS } from '@/lib/utils/constants';
import styles from './properties.module.css';

function PropertiesContent() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '', type: '', facing: '', area: '',
    priceMin: '', priceMax: '', areaMin: '', areaMax: '',
  });
  const [activeSmartFilters, setActiveSmartFilters] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilters(prev => ({ ...prev, status: statusParam }));
    }
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      let query = supabase
        .from('properties')
        .select('*, property_images(url, is_primary)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(p => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const searchable = [p.title, p.area_name, p.city, p.address, p.property_type, p.description, p.display_id]
        .filter(Boolean).join(' ').toLowerCase();
      if (!searchable.includes(q)) return false;
    }
    // Filters
    if (filters.status && p.status !== filters.status) return false;
    if (filters.type && p.property_type !== filters.type) return false;
    if (filters.facing && p.facing !== filters.facing) return false;
    if (filters.priceMin && (p.asking_price || 0) < Number(filters.priceMin)) return false;
    if (filters.priceMax && (p.asking_price || 0) > Number(filters.priceMax)) return false;
    if (filters.areaMin && (p.total_area || 0) < Number(filters.areaMin)) return false;
    if (filters.areaMax && (p.total_area || 0) > Number(filters.areaMax)) return false;
    return true;
  });

  const toggleSmartFilter = (filter) => {
    const isActive = activeSmartFilters.includes(filter.label);
    if (isActive) {
      setActiveSmartFilters(prev => prev.filter(f => f !== filter.label));
      // Clear filter
      if (filter.type === 'status') setFilters(prev => ({ ...prev, status: '' }));
      if (filter.type === 'facing') setFilters(prev => ({ ...prev, facing: '' }));
      if (filter.type === 'property_type') setFilters(prev => ({ ...prev, type: '' }));
      if (filter.type === 'price_max') setFilters(prev => ({ ...prev, priceMax: '' }));
    } else {
      setActiveSmartFilters(prev => [...prev, filter.label]);
      // Apply filter
      if (filter.type === 'status') setFilters(prev => ({ ...prev, status: filter.value }));
      if (filter.type === 'facing') setFilters(prev => ({ ...prev, facing: filter.value }));
      if (filter.type === 'property_type') setFilters(prev => ({ ...prev, type: filter.value }));
      if (filter.type === 'price_max') setFilters(prev => ({ ...prev, priceMax: String(filter.value) }));
    }
  };

  const clearFilters = () => {
    setFilters({ status: '', type: '', facing: '', area: '', priceMin: '', priceMax: '', areaMin: '', areaMax: '' });
    setActiveSmartFilters([]);
    setSearchQuery('');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '') || searchQuery;

  const getPrimaryImage = (prop) => {
    const images = prop.property_images || [];
    const primary = images.find(img => img.is_primary);
    return primary?.url || images[0]?.url || null;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">{filteredProperties.length} properties</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => router.push('/properties/add')}>
            <Plus size={16} /> Add Property
          </button>
        </div>
      </div>

      {/* Search + Controls */}
      <div className={styles.controls}>
        <div className={styles.searchRow}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className={`btn btn-secondary btn-sm ${showFilters ? styles.filterActive : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} /> Filters
          </button>
          <div className={styles.viewToggle}>
            <button
              className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'list' ? styles.viewActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
            <button
              className={`btn btn-ghost btn-icon btn-sm ${viewMode === 'grid' ? styles.viewActive : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Smart Filter Chips */}
        <div className={styles.chipRow}>
          {SMART_FILTERS.map((f) => (
            <button
              key={f.label}
              className={`filter-chip ${activeSmartFilters.includes(f.label) ? 'active' : ''}`}
              onClick={() => toggleSmartFilter(f)}
            >
              {f.label}
            </button>
          ))}
          {hasActiveFilters && (
            <button className={`filter-chip ${styles.clearChip}`} onClick={clearFilters}>
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className={styles.filterPanel}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All</option>
                  {PROPERTY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                  <option value="">All</option>
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Facing</label>
                <select className="form-select" value={filters.facing} onChange={e => setFilters({ ...filters, facing: e.target.value })}>
                  <option value="">All</option>
                  {FACING_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price Range</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" type="number" placeholder="Min" value={filters.priceMin} onChange={e => setFilters({ ...filters, priceMin: e.target.value })} />
                  <input className="form-input" type="number" placeholder="Max" value={filters.priceMax} onChange={e => setFilters({ ...filters, priceMax: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingGrid}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProperties.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--color-text-tertiary)' }}>🏠</div>
            <p className="empty-state-title">
              {hasActiveFilters ? 'No properties match your filters' : 'No properties yet'}
            </p>
            <p className="empty-state-description">
              {hasActiveFilters
                ? 'Try adjusting your search or filters.'
                : 'Add your first property to start building your database.'}
            </p>
            {!hasActiveFilters && (
              <button className="btn btn-primary" onClick={() => router.push('/properties/add')}>
                <Plus size={16} /> Add Property
              </button>
            )}
          </div>
        </div>
      )}

      {/* List View */}
      {!loading && filteredProperties.length > 0 && viewMode === 'list' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Area</th>
                <th>Size</th>
                <th>Facing</th>
                <th>Rate</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProperties.map(prop => (
                <tr key={prop.id} className="clickable" onClick={() => router.push(`/properties/${prop.id}`)}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 500 }}>{prop.title || 'Untitled'}</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                        {prop.display_id} · {prop.property_type || '—'}
                      </span>
                    </div>
                  </td>
                  <td>{prop.area_name || prop.city || '—'}</td>
                  <td>{prop.total_area ? formatArea(prop.total_area, prop.area_unit) : formatDimensions(prop.length, prop.width)}</td>
                  <td>{prop.facing || '—'}</td>
                  <td>{prop.price_per_sqft ? `₹${Number(prop.price_per_sqft).toLocaleString('en-IN')}/sqft` : '—'}</td>
                  <td style={{ fontWeight: 500 }}>{prop.asking_price ? formatCurrency(prop.asking_price) : '—'}</td>
                  <td><span className={`badge ${prop.status === 'Available' ? 'status-available' : prop.status === 'Sold' ? 'status-sold' : prop.status === 'Reserved' ? 'status-reserved' : 'status-default'}`}>{prop.status || 'Available'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {!loading && filteredProperties.length > 0 && viewMode === 'grid' && (
        <div className={styles.grid}>
          {filteredProperties.map(prop => {
            const img = getPrimaryImage(prop);
            return (
              <div key={prop.id} className={styles.gridCard} onClick={() => router.push(`/properties/${prop.id}`)}>
                <div className={styles.gridImage}>
                  {img ? (
                    <img src={img} alt={prop.title || 'Property'} />
                  ) : (
                    <div className={styles.gridImagePlaceholder}>🏠</div>
                  )}
                  <span className={`badge ${prop.status === 'Available' ? 'status-available' : 'status-default'} ${styles.gridBadge}`}>
                    {prop.status || 'Available'}
                  </span>
                </div>
                <div className={styles.gridContent}>
                  <h4 className={styles.gridTitle}>{prop.title || 'Untitled Property'}</h4>
                  <p className={styles.gridMeta}>{[prop.property_type, prop.area_name].filter(Boolean).join(' · ')}</p>
                  <div className={styles.gridFooter}>
                    <span className={styles.gridPrice}>{prop.asking_price ? formatCurrency(prop.asking_price) : '—'}</span>
                    <span className={styles.gridArea}>
                      {prop.total_area ? formatArea(prop.total_area, prop.area_unit) : formatDimensions(prop.length, prop.width)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}>
      <PropertiesContent />
    </Suspense>
  );
}
