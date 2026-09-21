'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, Edit, Trash2, MapPin, Ruler, Compass,
  DollarSign, FileText, Users, Activity, Image as ImageIcon,
  Calendar, Tag, Building2, ExternalLink, Lock, ChevronDown, ChevronUp
} from 'lucide-react';
import { formatCurrency, formatCurrencyFull, formatArea, formatDimensions, formatRate, formatDate, formatRelativeTime } from '@/lib/utils/formatting';
import styles from './detail.module.css';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [property, setProperty] = useState(null);
  const [images, setImages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showConfidential, setShowConfidential] = useState(false);

  useEffect(() => { loadProperty(); }, [id]);

  const loadProperty = async () => {
    try {
      const { data: prop } = await supabase.from('properties').select('*').eq('id', id).single();
      if (!prop) { router.push('/properties'); return; }
      setProperty(prop);

      const { data: imgs } = await supabase.from('property_images').select('*').eq('property_id', id).order('sort_order');
      setImages(imgs || []);

      const { data: pContacts } = await supabase.from('property_contacts').select('*, contacts(*)').eq('property_id', id);
      setContacts(pContacts || []);

      const { data: docs } = await supabase.from('documents').select('*').eq('property_id', id).eq('is_deleted', false);
      setDocuments(docs || []);

      const { data: acts } = await supabase.from('activity_log').select('*').eq('entity_id', id).order('created_at', { ascending: false }).limit(10);
      setActivity(acts || []);
    } catch (err) {
      console.error('Error loading property:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await supabase.from('properties').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          user_id: user.id, entity_type: 'property', entity_id: id,
          entity_name: property.title || 'Untitled', action: 'deleted',
        });
      }
      router.push('/properties');
    } catch (err) {
      console.error('Error deleting property:', err);
    }
  };

  if (loading) {
    return <div className={styles.page}><div className="skeleton" style={{ height: 400, borderRadius: 12 }} /></div>;
  }

  if (!property) return null;

  const p = property;
  const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className="btn btn-ghost" onClick={() => router.push('/properties')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className={styles.headerMeta}>
              <span className={styles.displayId}>{p.display_id}</span>
              {p.status && <span className={`badge ${p.status === 'Available' ? 'status-available' : p.status === 'Sold' ? 'status-sold' : p.status === 'Reserved' ? 'status-reserved' : 'status-default'}`}>{p.status}</span>}
              {p.property_type && <span className="tag">{p.property_type}</span>}
            </div>
            <h1 className={styles.title}>{p.title || 'Untitled Property'}</h1>
            {(p.area_name || p.city) && (
              <p className={styles.location}><MapPin size={14} /> {[p.area_name, p.city].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => router.push(`/properties/${id}/edit`)}>
            <Edit size={16} /> Edit
          </button>
          <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(true)} style={{ color: 'var(--color-danger)' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Left Column */}
        <div className={styles.leftCol}>
          {/* Overview */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Overview</h3>
            <div className={styles.detailGrid}>
              {p.total_area && <div className={styles.detailItem}><Ruler size={14} /><span className={styles.detailLabel}>Area</span><span className={styles.detailValue}>{formatArea(p.total_area, p.area_unit)}</span></div>}
              {(p.length && p.width) && <div className={styles.detailItem}><Ruler size={14} /><span className={styles.detailLabel}>Dimensions</span><span className={styles.detailValue}>{formatDimensions(p.length, p.width)}</span></div>}
              {p.facing && <div className={styles.detailItem}><Compass size={14} /><span className={styles.detailLabel}>Facing</span><span className={styles.detailValue}>{p.facing}</span></div>}
              {p.road_width && <div className={styles.detailItem}><span className={styles.detailLabel}>Road Width</span><span className={styles.detailValue}>{p.road_width}</span></div>}
              {p.is_corner && <div className={styles.detailItem}><span className={styles.detailLabel}>Corner</span><span className={styles.detailValue}>Yes</span></div>}
              {p.number_of_floors !== null && p.number_of_floors !== undefined && <div className={styles.detailItem}><Building2 size={14} /><span className={styles.detailLabel}>Floors</span><span className={styles.detailValue}>{p.number_of_floors}</span></div>}
              {p.plot_number && <div className={styles.detailItem}><span className={styles.detailLabel}>Plot No.</span><span className={styles.detailValue}>{p.plot_number}</span></div>}
              {p.survey_number && <div className={styles.detailItem}><span className={styles.detailLabel}>Survey No.</span><span className={styles.detailValue}>{p.survey_number}</span></div>}
              {p.address && <div className={styles.detailItem}><MapPin size={14} /><span className={styles.detailLabel}>Address</span><span className={styles.detailValue}>{p.address}</span></div>}
              {p.nearby_landmark && <div className={styles.detailItem}><span className={styles.detailLabel}>Landmark</span><span className={styles.detailValue}>{p.nearby_landmark}</span></div>}
            </div>
          </div>

          {/* Gallery */}
          {images.length > 0 && (
            <div className="card">
              <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Gallery</h3>
              <div className={styles.gallery}>
                {images.map((img) => (
                  <div key={img.id} className={styles.galleryImage} onClick={() => setSelectedImage(img.url)}>
                    <img src={img.url} alt="Property" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          {(p.latitude && p.longitude) || p.google_maps_link ? (
            <div className="card">
              <div className="section-header">
                <h3 className="section-title">Location</h3>
                {p.latitude && p.longitude && (
                  <a href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                    <ExternalLink size={14} /> Open in Maps
                  </a>
                )}
              </div>
              
              {p.latitude && p.longitude ? (
                <div className={styles.mapEmbedContainer}>
                   <iframe
                      width="100%"
                      height="300"
                      style={{ border: 0, borderRadius: 'var(--radius-md)' }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps/embed/v1/place?key=${mapApiKey || ''}&q=${p.latitude},${p.longitude}&zoom=15`}
                      allowFullScreen
                    />
                </div>
              ) : p.google_maps_link ? (
                 <div className={styles.mapPlaceholder}>
                   <MapPin size={24} />
                   <p>Location linked</p>
                    <a href={p.google_maps_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                      <ExternalLink size={14} /> View on Google Maps
                    </a>
                 </div>
              ) : null}
            </div>
          ) : null}

          {/* Description */}
          {p.description && (
            <div className="card">
              <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Description</h3>
              <p style={{ lineHeight: 'var(--line-height-relaxed)', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>{p.description}</p>
            </div>
          )}

          {/* Internal Notes */}
          {p.internal_notes && (
            <div className="card" style={{ background: 'var(--color-warning-light)', borderColor: 'transparent' }}>
              <h3 className="section-title" style={{ marginBottom: 'var(--space-sm)' }}>Internal Notes</h3>
              <p style={{ lineHeight: 'var(--line-height-relaxed)', fontSize: 'var(--font-size-base)', whiteSpace: 'pre-wrap' }}>{p.internal_notes}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          {/* Pricing */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>
              <DollarSign size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Pricing
            </h3>
            <div className={styles.financeList}>
              {p.price_per_unit && <div className={styles.financeRow}><span>Price per {p.area_unit === 'sq.m' ? 'sq m' : p.area_unit === 'sq.ft' ? 'sq ft' : p.area_unit}</span><strong>{formatRate(p.price_per_unit, p.area_unit)}</strong></div>}
              {p.total_estimated_value && <div className={styles.financeRow}><span>Estimated Value</span><strong>{formatCurrencyFull(p.total_estimated_value)}</strong></div>}
              {p.is_negotiable !== null && p.is_negotiable !== undefined && (
                <div className={styles.financeRow}><span>Negotiable</span><span>{p.is_negotiable ? 'Yes' : 'No'}</span></div>
              )}
              {p.asking_price && <div className={styles.financeRow}><span>Asking Price</span><span>{formatCurrencyFull(p.asking_price)}</span></div>}
              {p.previous_price && <div className={styles.financeRow}><span>Previous Price</span><span>{formatCurrencyFull(p.previous_price)}</span></div>}
              {p.purchase_price && <div className={styles.financeRow}><span>Purchase Price</span><span>{formatCurrencyFull(p.purchase_price)}</span></div>}
              {p.expected_selling_price && <div className={styles.financeRow}><span>Expected Selling</span><span>{formatCurrencyFull(p.expected_selling_price)}</span></div>}
              
              {!p.price_per_unit && !p.total_estimated_value && !p.asking_price && (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)' }}>No pricing information added</p>
              )}
            </div>
          </div>
          
          {/* Confidential Details (Owner/Agent) */}
          {(p.owner_name || p.agent_name) && (
            <div className={`card ${styles.confidentialCard}`}>
               <div className={styles.confidentialHeader} onClick={() => setShowConfidential(!showConfidential)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Lock size={16} className={styles.lockIcon} />
                     <h3 className="section-title" style={{ margin: 0, color: 'var(--color-text)' }}>Confidential Details</h3>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm">
                     {showConfidential ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
               </div>
               
               {showConfidential && (
                 <div className={styles.confidentialBody}>
                    <div className={styles.financeList}>
                      {p.owner_name && <div className={styles.financeRow}><span>Owner</span><strong>{p.owner_name}</strong></div>}
                      {p.agent_name && <div className={styles.financeRow}><span>Agent</span><strong>{p.agent_name}</strong></div>}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* Contacts */}
          <div className="card">
            <div className="section-header">
              <h3 className="section-title"><Users size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Linked Contacts</h3>
            </div>
            {contacts.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', marginTop: 8 }}>No contacts linked</p>
            ) : (
              <div className={styles.contactList}>
                {contacts.map(pc => (
                  <div key={pc.id} className={styles.contactItem} onClick={() => router.push(`/contacts/${pc.contact_id}`)}>
                    <div className={styles.contactAvatar}>{pc.contacts?.name?.[0] || '?'}</div>
                    <div>
                      <span className={styles.contactName}>{pc.contacts?.name}</span>
                      <span className={styles.contactRole}>{pc.relationship_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="card">
            <div className="section-header">
              <h3 className="section-title"><FileText size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Documents</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/documents/${id}`)}>View All</button>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 8 }}>
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </p>
            {documents.length > 0 && (
              <div className={styles.docList}>
                {documents.slice(0, 5).map(doc => (
                  <div key={doc.id} className={styles.docItem}>
                    <FileText size={14} />
                    <span>{doc.name || doc.category || doc.file_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="card">
            <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>
              <Activity size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> Activity
            </h3>
            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <Calendar size={12} /> Created {formatDate(p.created_at)}
              </div>
              {p.updated_at !== p.created_at && (
                <div className={styles.activityItem}>
                  <Calendar size={12} /> Updated {formatRelativeTime(p.updated_at)}
                </div>
              )}
              {activity.map(a => (
                <div key={a.id} className={styles.activityItem}>
                  <Activity size={12} /> {a.action.replace('_', ' ')} — {formatRelativeTime(a.created_at)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Property</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{p.title || 'this property'}</strong>? This action can be undone from settings.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Property</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Property" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
