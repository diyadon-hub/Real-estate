'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Plus, FileText, Download, Trash2, Eye, CheckCircle2, AlertCircle, Minus, Upload } from 'lucide-react';
import { DOCUMENT_CATEGORIES } from '@/lib/utils/constants';
import { formatDate, formatFileSize } from '@/lib/utils/formatting';

const REQUIRED_DOCS = ['Sale Deed', 'RTC', 'Khata', 'EC', 'Layout Approval'];

export default function PropertyDocumentsPage() {
  const { propertyId } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [property, setProperty] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', category: '', description: '', expiry_date: '' });
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => { loadData(); }, [propertyId]);

  const loadData = async () => {
    try {
      const { data: prop } = await supabase.from('properties').select('id, title, display_id').eq('id', propertyId).single();
      setProperty(prop);
      const { data: docs } = await supabase.from('documents').select('*').eq('property_id', propertyId).eq('is_deleted', false).order('created_at', { ascending: false });
      setDocuments(docs || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = uploadFile.name.split('.').pop();
      const filePath = `${user.id}/${propertyId}/${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage.from('documents').upload(filePath, uploadFile);
      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

      await supabase.from('documents').insert({
        property_id: propertyId, user_id: user.id, file_url: publicUrl, storage_path: filePath,
        file_name: uploadFile.name, file_type: uploadFile.type, file_size: uploadFile.size,
        name: uploadForm.name || uploadFile.name, category: uploadForm.category || null,
        description: uploadForm.description || null, expiry_date: uploadForm.expiry_date || null,
      });

      await supabase.from('activity_log').insert({
        user_id: user.id, entity_type: 'document', entity_id: propertyId,
        entity_name: property?.title || 'Property', action: 'document_uploaded',
        details: { document_name: uploadForm.name || uploadFile.name },
      });

      setShowUpload(false);
      setUploadForm({ name: '', category: '', description: '', expiry_date: '' });
      setUploadFile(null);
      loadData();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload document. Please try again.');
    } finally { setUploading(false); }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;
    await supabase.from('documents').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', docId);
    loadData();
  };

  const existingCategories = documents.map(d => d.category).filter(Boolean);
  const completeness = REQUIRED_DOCS.map(name => ({
    name,
    status: existingCategories.includes(name) ? 'complete' : 'missing',
  }));
  const completeCount = completeness.filter(c => c.status === 'complete').length;

  if (loading) return <div style={{ maxWidth: 800 }}><div className="skeleton" style={{ height: 300, borderRadius: 12 }} /></div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <button className="btn btn-ghost" onClick={() => router.push('/documents')}><ArrowLeft size={18} /></button>
        <div>
          <h1 className="page-title">{property?.title || 'Untitled Property'}</h1>
          <p className="page-subtitle">{property?.display_id} · Documents</p>
        </div>
      </div>

      {/* Document Completeness */}
      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="section-header">
          <h3 className="section-title">Document Completeness</h3>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, color: completeCount === REQUIRED_DOCS.length ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {completeCount} / {REQUIRED_DOCS.length} documents
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'var(--space-sm)' }}>
          {completeness.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '4px 0', fontSize: 'var(--font-size-base)' }}>
              {c.status === 'complete' ? <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} /> : <Minus size={16} style={{ color: 'var(--color-text-tertiary)' }} />}
              <span style={{ color: c.status === 'complete' ? 'var(--color-text)' : 'var(--color-text-tertiary)' }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
        <button className="btn btn-primary" onClick={() => setShowUpload(true)}><Plus size={16} /> Add Document</button>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Document</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowUpload(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
                <div className="form-group">
                  <label className="form-label">File *</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setUploadFile(e.target.files[0])} required style={{ fontSize: 'var(--font-size-sm)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Document Name</label>
                  <input className="form-input" placeholder="e.g., Sale Deed Copy" value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
                    <option value="">Select category</option>
                    {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={2} value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiry / Review Date</label>
                  <input className="form-input" type="date" value={uploadForm.expiry_date} onChange={e => setUploadForm({ ...uploadForm, expiry_date: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !uploadFile}>
                  {uploading ? <span className="spinner" /> : <><Upload size={16} /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="card"><div className="empty-state">
          <FileText size={32} className="empty-state-icon" />
          <p className="empty-state-title">No documents uploaded</p>
          <p className="empty-state-description">Upload documents like sale deeds, RTC, EC, and more.</p>
        </div></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Document</th><th>Category</th><th>Uploaded</th><th>Size</th><th>Actions</th></tr></thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 500 }}>{doc.name || doc.file_name}</td>
                  <td>{doc.category ? <span className="tag">{doc.category}</span> : '—'}</td>
                  <td>{formatDate(doc.created_at)}</td>
                  <td>{formatFileSize(doc.file_size)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></a>
                      <a href={doc.file_url} download className="btn btn-ghost btn-icon btn-sm"><Download size={14} /></a>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(doc.id)} style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
