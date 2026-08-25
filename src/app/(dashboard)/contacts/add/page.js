'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';
import { CONTACT_ROLES, CONTACT_STATUSES } from '@/lib/utils/constants';

export default function AddContactPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', alternate_phone: '', email: '', company: '',
    role: '', area: '', address: '', notes: '', follow_up_date: '', status: 'Active',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const contactData = { user_id: user.id };
      Object.entries(form).forEach(([k, v]) => { if (v) contactData[k] = v; });

      const { data, error: err } = await supabase.from('contacts').insert(contactData).select().single();
      if (err) throw err;

      await supabase.from('activity_log').insert({
        user_id: user.id, entity_type: 'contact', entity_id: data.id,
        entity_name: data.name, action: 'created',
      });

      router.push(`/contacts/${data.id}`);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <button className="btn btn-ghost" onClick={() => router.back()}><ArrowLeft size={18} /></button>
        <h1 className="page-title">Add Contact</h1>
      </div>

      {error && <div style={{ padding: 'var(--space-md)', background: 'var(--color-danger-light)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
        <div className="form-group"><label className="form-label">Name *</label><input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Alternate Phone</label><input className="form-input" type="tel" value={form.alternate_phone} onChange={e => setForm({ ...form, alternate_phone: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Role</label><select className="form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option value="">Select role</option>{CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{CONTACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Area</label><input className="form-input" placeholder="Operating area" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Follow-up Date</label><input className="form-input" type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} /></div>
        </div>
        <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--color-divider)' }}>
          <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <><Save size={16} /> Save Contact</>}
          </button>
        </div>
      </form>
    </div>
  );
}
