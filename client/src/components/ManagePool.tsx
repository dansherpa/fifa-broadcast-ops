import { useState } from 'react';
import { Volunteer } from '../types';

interface Props {
  volunteers: Volunteer[];
  api: { put: (url: string, body?: object) => Promise<unknown> };
  onClose: () => void;
}

export default function ManagePool({ volunteers, api, onClose }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  async function handleRename(id: string) {
    if (!newName.trim()) return;
    await api.put(`/api/volunteers/${id}`, { name: newName.trim() });
    setEditing(null);
    setNewName('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Manage Volunteer Pool</div>
        <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
          Tap a name to rename it. Pool stays at 20 slots.
        </p>

        {volunteers.map(vol => (
          <div key={vol.id} className="vol-item">
            {editing === vol.id ? (
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={vol.name}
                  autoFocus
                  style={{ flex: 1, padding: 8, border: '2px solid var(--primary)', borderRadius: 8, fontSize: 16 }}
                  onKeyDown={e => e.key === 'Enter' && handleRename(vol.id)}
                />
                <button className="btn-small btn-primary" style={{ width: 'auto' }} onClick={() => handleRename(vol.id)}>
                  Save
                </button>
                <button className="btn-small btn-secondary" onClick={() => setEditing(null)}>
                  X
                </button>
              </div>
            ) : (
              <>
                <div className="vol-info">
                  <div className="vol-name">{vol.name}</div>
                  {vol.checkedIn && <span className="status-badge status-available" style={{ marginTop: 4 }}>Active</span>}
                </div>
                <button
                  className="btn-small btn-secondary"
                  onClick={() => { setEditing(vol.id); setNewName(vol.name); }}
                >
                  Rename
                </button>
              </>
            )}
          </div>
        ))}

        <button className="modal-close" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
