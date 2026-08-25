'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Building2, Home, Calendar, Trash2, Save, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils/formatting';
import { CONTACT_ROLES, CONTACT_STATUSES, RELATIONSHIP_TYPES } from '@/lib/utils/constants';

export default function ContactDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [contact, setContact] = useState(null);
  const [linkedProperties, setLinkedProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showLink, setShowLink] = useState(false);
  const [linkPropId, setLinkPropId] = useState('');
  const [linkRole, setLinkRole] = useState('');

  useEffect(() => { loadContact(); }, [id]);

  const loadContact = async () => {
    try {
      const { data: c } = await supabase.from('contacts').select('*').eq('id', id).single();
      if (!c) { router.push('/contacts'); return; }
      setContact(c);
      setEditForm(c);

      const { data: pc } = await supabase.from('property_contacts').select('*, properties(id, title, display_id, status, area_name)').eq('contact_id', id);
      setLinkedProperties(pc || []);

      const { data: props } = await supabase.from('properties').select('id, title, display_id').eq('is_deleted', false).order('title');
      setAllProperties(props || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase.from('contacts').update({
        name: editForm.name, phone: editForm.phone, alternate_phone: editForm.alternate_phone,
        email: editForm.email, company: editForm.company, role: editForm.role,
        area: editForm.area, address: editForm.address, notes: editForm.notes,
        follow_up_date: editForm.follow_up_date || null, status: editForm.status,
      }).eq('id', id);
      if (error) throw error;
      setEditing(false);
      loadContact();
    } catch (err) { console.error(err); }
  };

  const handleLinkProperty = async () => {
    if (!linkPropId) return;
    try {
      await supabase.from('property_contacts').insert({
        property_id: linkPropId, contact_id: id, relationship_type: linkRole || null,
      });
      setShowLink(false); setLinkPropId(''); setLinkRole('');
      loadContact();
    } catch (err) { console.error(err); }
  };

  const handleUnlink = async (pcId) => {
    if (!confirm('Remove this property link?')) return;
    await supabase.from('property_contacts').delete().eq('id', pcId);
    loadContact();
  };

  const handleDelete = async () => {
    if (!confirm('Delete this contact?')) return;
    await supabase.from('contacts').update({ is_deleted: true }).eq('id', id);
    router.push('/contacts');
  };

  if (loading) return <div style={{ maxWidth: 700 }}><div className="skeleton" style={{ height: 300, borderRadius: 12 }} /></div>;
  if (!contact) return null;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <button className="btn btn-ghost" onClick={() => router.push('/contacts')}><ArrowLeft size={18} /></button>
          <div>
            <h1 className="page-title">{contact.name}</h1>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 4 }}>
              {contact.role && <span className="tag">{contact.role}</span>}
              <span className={`badge ${contact.status === 'Active' ? 'status-active' : 'status-inactive'}`}>{contact.status}</span>
            </div>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setEditing(!editing)}><Edit size={16} /> {editing ? 'Cancel' : 'Edit'}</button>
          <button className="btn btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={handleDelete}><Trash2 size={16} /></button>
        </div>
      </div>

      {editing ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
          <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={editForm.company || ''} onChange={e => setEditForm({ ...editForm, company: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={editForm.role || ''} onChange={e => setEditForm({ ...editForm, role: e.target.value })}><option value="">Select</option>{CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Area</label><input className="form-input" value={editForm.area || ''} onChange={e => setEditForm({ ...editForm, area: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={editForm.status || 'Active'} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>{CONTACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" rows={3} value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" onClick={handleSaveEdit}><Save size={16} /> Save</button></div>
        </div>
      ) : (
        <>
          {/* Contact Info */}
          <div className="card" style={{ marginBottom: 'var(--space-base)' }}>
            <h3 className="section-title" style={{ marginBottom: 'var(--space-base)' }}>Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              {contact.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><Phone size={14} /> {contact.phone}</div>}
              {contact.alternate_phone && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><Phone size={14} /> {contact.alternate_phone}</div>}
              {contact.email && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><Mail size={14} /> {contact.email}</div>}
              {contact.company && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><Building2 size={14} /> {contact.company}</div>}
              {contact.area && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><MapPin size={14} /> {contact.area}</div>}
              {contact.follow_up_date && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--font-size-base)' }}><Calendar size={14} /> Follow-up: {formatDate(contact.follow_up_date)}</div>}
            </div>
            {contact.notes && <div style={{ marginTop: 'var(--space-base)', padding: 'var(--space-md)', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-base)', whiteSpace: 'pre-wrap' }}>{contact.notes}</div>}
          </div>

          {/* Linked Properties */}
          <div className="card">
            <div className="section-header">
              <h3 className="section-title">Associated Properties ({linkedProperties.length})</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLink(true)}><Plus size={14} /> Link</button>
            </div>
            {linkedProperties.length === 0 ? (
              <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-sm)', marginTop: 8 }}>No properties linked</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--space-sm)' }}>
                {linkedProperties.map(pc => (
                  <div key={pc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                    onClick={() => router.push(`/properties/${pc.property_id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <Home size={14} />
                      <span style={{ fontWeight: 500, fontSize: 'var(--font-size-base)' }}>{pc.properties?.title || pc.properties?.display_id}</span>
                      {pc.relationship_type && <span className="tag">{pc.relationship_type}</span>}
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleUnlink(pc.id); }} style={{ color: 'var(--color-text-tertiary)' }}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Link Property Modal */}
      {showLink && (
        <div className="modal-overlay" onClick={() => setShowLink(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Link Property</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowLink(false)}>✕</button></div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
              <div className="form-group"><label className="form-label">Property</label><select className="form-select" value={linkPropId} onChange={e => setLinkPropId(e.target.value)}><option value="">Select property</option>{allProperties.map(p => <option key={p.id} value={p.id}>{p.display_id} — {p.title || 'Untitled'}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Relationship</label><select className="form-select" value={linkRole} onChange={e => setLinkRole(e.target.value)}><option value="">Select role</option>{RELATIONSHIP_TYPES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowLink(false)}>Cancel</button><button className="btn btn-primary" onClick={handleLinkProperty} disabled={!linkPropId}>Link</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
