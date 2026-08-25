'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Users, Phone, Mail, MapPin } from 'lucide-react';
import { CONTACT_ROLES } from '@/lib/utils/constants';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    try {
      const { data } = await supabase.from('contacts').select('*, property_contacts(id)').eq('is_deleted', false).order('created_at', { ascending: false });
      setContacts(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filtered = contacts.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (![c.name, c.company, c.phone, c.email, c.area, c.role].filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
    }
    if (roleFilter && c.role !== roleFilter) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 'var(--content-max-width)' }}>
      <div className="page-header">
        <div><h1 className="page-title">Contacts</h1><p className="page-subtitle">{filtered.length} contacts</p></div>
        <button className="btn btn-primary" onClick={() => router.push('/contacts/add')}><Plus size={16} /> Add Contact</button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Search contacts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {CONTACT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading && <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />}

      {!loading && filtered.length === 0 && (
        <div className="card"><div className="empty-state">
          <Users size={32} className="empty-state-icon" />
          <p className="empty-state-title">{searchQuery || roleFilter ? 'No contacts match' : 'No contacts yet'}</p>
          <p className="empty-state-description">{searchQuery || roleFilter ? 'Try adjusting your search.' : 'Add builders, owners, brokers and other contacts.'}</p>
          {!searchQuery && !roleFilter && <button className="btn btn-primary" onClick={() => router.push('/contacts/add')}><Plus size={16} /> Add Contact</button>}
        </div></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Area</th><th>Properties</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="clickable" onClick={() => router.push(`/contacts/${c.id}`)}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td>{c.role ? <span className="tag">{c.role}</span> : '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.area || '—'}</td>
                  <td>{c.property_contacts?.length || 0}</td>
                  <td><span className={`badge ${c.status === 'Active' ? 'status-active' : c.status === 'Important' ? 'status-reserved' : 'status-inactive'}`}>{c.status || 'Active'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
