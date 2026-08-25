'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Home, Users, Building2, FileText, AlertTriangle,
  Plus, ArrowRight, Clock, TrendingUp, CheckCircle2,
  MapPin, Calendar, Activity
} from 'lucide-react';
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/utils/formatting';
import styles from './page.module.css';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get property stats
      const { data: properties } = await supabase
        .from('properties')
        .select('id, status, title, area_name, created_at, asking_price, property_type')
        .eq('is_deleted', false);

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('is_deleted', false);

      const { data: developments } = await supabase
        .from('developments')
        .select('id')
        .eq('is_deleted', false);

      // Get documents count and properties with missing docs
      const { data: documents } = await supabase
        .from('documents')
        .select('property_id')
        .eq('is_deleted', false);

      const propertyIds = properties?.map(p => p.id) || [];
      const propertiesWithDocs = new Set(documents?.map(d => d.property_id) || []);
      const propertiesWithoutDocs = propertyIds.filter(id => !propertiesWithDocs.has(id));

      setStats({
        totalProperties: properties?.length || 0,
        activeProperties: properties?.filter(p => p.status === 'Available').length || 0,
        soldProperties: properties?.filter(p => p.status === 'Sold').length || 0,
        totalContacts: contacts?.length || 0,
        activeDevelopments: developments?.length || 0,
        missingDocs: propertiesWithoutDocs.length,
      });

      // Recent properties
      const sorted = (properties || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentProperties(sorted);

      // Recent activity
      const { data: activityData } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      setRecentActivity(activityData || []);

      // Upcoming follow-ups
      const today = new Date().toISOString().split('T')[0];
      const { data: followUpData } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('status', 'Pending')
        .eq('is_deleted', false)
        .gte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(5);
      setFollowUps(followUpData || []);

    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'created': return <Plus size={14} />;
      case 'updated': return <Activity size={14} />;
      case 'status_changed': return <CheckCircle2 size={14} />;
      case 'document_uploaded': return <FileText size={14} />;
      case 'price_changed': return <TrendingUp size={14} />;
      default: return <Activity size={14} />;
    }
  };

  const getActivityLabel = (entry) => {
    const name = entry.entity_name || entry.entity_type;
    switch (entry.action) {
      case 'created': return `${entry.entity_type} "${name}" created`;
      case 'updated': return `${entry.entity_type} "${name}" updated`;
      case 'status_changed': return `${name} status changed`;
      case 'document_uploaded': return `Document uploaded for "${name}"`;
      case 'price_changed': return `Price updated for "${name}"`;
      default: return `${name} ${entry.action}`;
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${styles.statCard} skeleton`} style={{ height: 100 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your real estate overview</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => router.push('/properties/add')}>
            <Plus size={16} />
            Add Property
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} onClick={() => router.push('/properties')}>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <Home size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats?.totalProperties || 0}</span>
            <span className={styles.statLabel}>Total Properties</span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => router.push('/properties?status=Available')}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <CheckCircle2 size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats?.activeProperties || 0}</span>
            <span className={styles.statLabel}>Available</span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => router.push('/properties?status=Sold')}>
          <div className={`${styles.statIcon} ${styles.iconGray}`}>
            <TrendingUp size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats?.soldProperties || 0}</span>
            <span className={styles.statLabel}>Sold</span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => router.push('/contacts')}>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <Users size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats?.totalContacts || 0}</span>
            <span className={styles.statLabel}>Contacts</span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => router.push('/developments')}>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <Building2 size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats?.activeDevelopments || 0}</span>
            <span className={styles.statLabel}>Developments</span>
          </div>
        </div>

        <div className={styles.statCard} onClick={() => router.push('/documents')}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <AlertTriangle size={18} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats?.missingDocs || 0}</span>
            <span className={styles.statLabel}>Missing Docs</span>
          </div>
        </div>
      </div>

      {/* Main Grid - Activity + Follow-ups + Recent Properties */}
      <div className={styles.mainGrid}>
        {/* Recent Properties */}
        <div className={styles.section}>
          <div className="section-header">
            <h3 className="section-title">Recent Properties</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/properties')}>
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="card">
            {recentProperties.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <Home size={32} className="empty-state-icon" />
                <p className="empty-state-title">No properties yet</p>
                <p className="empty-state-description">Add your first property to start building your database.</p>
                <button className="btn btn-primary" onClick={() => router.push('/properties/add')}>
                  <Plus size={16} /> Add Property
                </button>
              </div>
            ) : (
              <div className={styles.propertyList}>
                {recentProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className={styles.propertyRow}
                    onClick={() => router.push(`/properties/${prop.id}`)}
                  >
                    <div className={styles.propertyInfo}>
                      <span className={styles.propertyTitle}>{prop.title || 'Untitled Property'}</span>
                      <span className={styles.propertyMeta}>
                        {[prop.property_type, prop.area_name].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </div>
                    <div className={styles.propertyRight}>
                      {prop.asking_price && (
                        <span className={styles.propertyPrice}>{formatCurrency(prop.asking_price)}</span>
                      )}
                      <span className={`badge ${prop.status === 'Available' ? 'status-available' : prop.status === 'Sold' ? 'status-sold' : 'status-default'}`}>
                        {prop.status || 'Available'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* Upcoming Follow-ups */}
          <div className={styles.section}>
            <div className="section-header">
              <h3 className="section-title">Upcoming Follow-ups</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push('/follow-ups')}>
                View All
              </button>
            </div>
            <div className="card card-compact">
              {followUps.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Calendar size={24} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    No upcoming follow-ups
                  </p>
                </div>
              ) : (
                <div className={styles.followUpList}>
                  {followUps.map((fu) => (
                    <div key={fu.id} className={styles.followUpItem}>
                      <div className={styles.followUpDot} data-priority={fu.priority} />
                      <div className={styles.followUpInfo}>
                        <span className={styles.followUpTitle}>{fu.title}</span>
                        <span className={styles.followUpDate}>{formatDate(fu.due_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.section}>
            <div className="section-header">
              <h3 className="section-title">Recent Activity</h3>
            </div>
            <div className="card card-compact">
              {recentActivity.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <Activity size={24} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    No activity yet. Start by adding a property.
                  </p>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {recentActivity.map((entry) => (
                    <div key={entry.id} className={styles.activityItem}>
                      <div className={styles.activityIcon}>
                        {getActivityIcon(entry.action)}
                      </div>
                      <div className={styles.activityInfo}>
                        <span className={styles.activityText}>{getActivityLabel(entry)}</span>
                        <span className={styles.activityTime}>{formatRelativeTime(entry.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Quick Actions</h3>
        <div className={styles.quickActions}>
          <button className={styles.quickAction} onClick={() => router.push('/properties/add')}>
            <Home size={20} />
            <span>Add Property</span>
          </button>
          <button className={styles.quickAction} onClick={() => router.push('/contacts/add')}>
            <Users size={20} />
            <span>Add Contact</span>
          </button>
          <button className={styles.quickAction} onClick={() => router.push('/developments/add')}>
            <Building2 size={20} />
            <span>Add Development</span>
          </button>
          <button className={styles.quickAction} onClick={() => router.push('/documents')}>
            <FileText size={20} />
            <span>Add Document</span>
          </button>
        </div>
      </div>
    </div>
  );
}
