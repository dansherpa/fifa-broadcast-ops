import { useState } from 'react';

interface Props {
  locations: string[];
  api: { post: (url: string, body?: object) => Promise<unknown> };
  onClose: () => void;
}

export default function ManageLocations({ locations, api, onClose }: Props) {
  const [editing, setEditing] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [addName, setAddName] = useState('');

  async function handleRename(index: number) {
    if (!newName.trim()) return;
    await api.post('/api/locations/rename', { oldName: locations[index], newName: newName.trim() });
    setEditing(null);
    setNewName('');
  }

  async function handleAdd() {
    if (!addName.trim()) return;
    await api.post('/api/locations', { name: addName.trim() });
    setAddName('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Manage Locations</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              placeholder="Add new location..."
              style={{ flex: 1, padding: 12, border: '2px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 16 }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleAdd}>
              + Add
            </button>
          </div>
        </div>

        {locations.map((loc, i) => (
          <div key={i} className="vol-item">
            {editing === i ? (
              <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder={loc}
                  autoFocus
                  style={{ flex: 1, padding: 8, border: '2px solid var(--primary)', borderRadius: 8, fontSize: 16 }}
                  onKeyDown={e => e.key === 'Enter' && handleRename(i)}
                />
                <button className="btn-small btn-primary" style={{ width: 'auto' }} onClick={() => handleRename(i)}>
                  Save
                </button>
                <button className="btn-small btn-secondary" onClick={() => setEditing(null)}>
                  X
                </button>
              </div>
            ) : (
              <>
                <div className="vol-info">
                  <div className="vol-name">{loc}</div>
                </div>
                <button
                  className="btn-small btn-secondary"
                  onClick={() => { setEditing(i); setNewName(loc); }}
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
