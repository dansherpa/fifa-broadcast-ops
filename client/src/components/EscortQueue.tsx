import { useState } from 'react';
import { EscortTask, Volunteer } from '../types';

interface Props {
  escorts: EscortTask[];
  volunteers: Volunteer[];
  locations: string[];
  role: string;
  myId: string | null;
  myName?: string | null;
  api: { post: (url: string, body?: object) => Promise<unknown> };
}

export default function EscortQueue({ escorts, volunteers, locations, role, myId, myName, api }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [mp, setMp] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [from, setFrom] = useState('Media Center');
  const [to, setTo] = useState('BIO');

  const pending = escorts.filter(e => e.status === 'pending');
  const active = escorts.filter(e => e.status === 'claimed');
  const completed = escorts.filter(e => e.status === 'completed').slice(0, 5);

  async function handleCreate() {
    if (!mp.trim()) return;
    await api.post('/api/escorts', {
      mediaPartner: mp,
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      from,
      to,
      createdBy: myName || (role === 'intern' ? 'Intern' : 'Volunteer'),
    });
    setMp('');
    setCompany('');
    setPhone('');
    setShowForm(false);
  }

  async function handleClaim(escortId: string) {
    if (!myId) {
      alert('Select yourself in "My Status" tab first');
      return;
    }
    await api.post(`/api/escorts/${escortId}/claim`, { volunteerId: myId });
  }

  async function handleComplete(escortId: string) {
    await api.post(`/api/escorts/${escortId}/complete`, {});
  }

  function getVolunteerName(id?: string) {
    if (!id) return '';
    return volunteers.find(v => v.id === id)?.name || 'Unknown';
  }

  function saveVCard(e: EscortTask) {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${e.mediaPartner}`,
      e.company ? `ORG:${e.company}` : '',
      e.phone ? `TEL;TYPE=CELL:${e.phone}` : '',
      'END:VCARD',
    ].filter(Boolean).join('\r\n');
    const blob = new Blob([lines], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${e.mediaPartner.replace(/\s+/g, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function timeAgo(ts: number) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <div>
      <div style={{ padding: 12 }}>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + New Escort Request
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-title">New Escort Request</div>
          <div className="form-row">
            <label>Media Partner Name *</label>
            <input
              type="text"
              placeholder="e.g. Johan Lindström"
              value={mp}
              onChange={e => setMp(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-row">
            <label>Company</label>
            <input
              type="text"
              placeholder="e.g. SVT, CCTV, ITV Sport"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Phone (with country code)</label>
            <input
              type="tel"
              placeholder="e.g. +46 70 123 4567"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>From</label>
            <select value={from} onChange={e => setFrom(e.target.value)}>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>To</label>
            <select value={to} onChange={e => setTo(e.target.value)}>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleCreate}>Submit</button>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="card">
          <div className="card-title">Pending ({pending.length})</div>
          {pending.map(e => (
            <div key={e.id} className="escort-item pending">
              <div className="escort-mp">{e.mediaPartner}</div>
              {(e.company || e.phone) && (
                <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 2 }}>
                  {e.company && <span>{e.company}</span>}
                  {e.company && e.phone && <span> · </span>}
                  {e.phone && <a href={`tel:${e.phone}`} style={{ color: 'var(--blue)' }}>{e.phone}</a>}
                </div>
              )}
              <div className="escort-route">{e.from} → {e.to}</div>
              <div className="time-ago">{timeAgo(e.createdAt)} · via {e.createdBy}</div>
              <div className="escort-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {e.phone && (
                  <button className="btn-secondary" style={{ flex: '0 0 auto' }} onClick={() => saveVCard(e)}>
                    Save Contact
                  </button>
                )}
                {role === 'volunteer' && (
                  <button className="btn-claim" style={{ flex: 1 }} onClick={() => handleClaim(e.id)}>
                    Claim This Escort
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="card">
          <div className="card-title">In Progress ({active.length})</div>
          {active.map(e => (
            <div key={e.id} className="escort-item claimed">
              <div className="escort-mp">{e.mediaPartner}</div>
              {(e.company || e.phone) && (
                <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 2 }}>
                  {e.company && <span>{e.company}</span>}
                  {e.company && e.phone && <span> · </span>}
                  {e.phone && <a href={`tel:${e.phone}`} style={{ color: 'var(--blue)' }}>{e.phone}</a>}
                </div>
              )}
              <div className="escort-route">{e.from} → {e.to}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Escort: <strong>{getVolunteerName(e.assignedTo)}</strong>
              </div>
              <div className="escort-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {e.phone && (
                  <button className="btn-secondary" style={{ flex: '0 0 auto' }} onClick={() => saveVCard(e)}>
                    Save Contact
                  </button>
                )}
                {(e.assignedTo === myId || role === 'intern') && (
                  <button className="btn-complete" style={{ flex: 1 }} onClick={() => handleComplete(e.id)}>
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="card">
          <div className="card-title">Recently Completed</div>
          {completed.map(e => (
            <div key={e.id} className="escort-item completed">
              <div className="escort-mp">{e.mediaPartner}</div>
              {e.company && <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{e.company}</div>}
              <div className="escort-route">{e.from} → {e.to}</div>
              <div style={{ fontSize: 12 }}>
                By {getVolunteerName(e.assignedTo)} · {timeAgo(e.completedAt || e.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {pending.length === 0 && active.length === 0 && (
        <div className="card">
          <div className="empty-state">No escort requests right now</div>
        </div>
      )}
    </div>
  );
}
