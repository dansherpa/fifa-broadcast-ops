import { useState } from 'react';

interface Props {
  interns: string[];
  staff: string[];
  api: { post: (url: string, body?: object) => Promise<unknown> };
  onClose: () => void;
}

export default function ManageInterns({ interns, staff, api, onClose }: Props) {
  const [editingType, setEditingType] = useState<'intern' | 'staff' | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [addIntern, setAddIntern] = useState('');
  const [addStaff, setAddStaff] = useState('');

  async function handleRename(type: 'intern' | 'staff', oldName: string) {
    if (!newName.trim()) return;
    const endpoint = type === 'intern' ? '/api/interns/rename' : '/api/staff/rename';
    await api.post(endpoint, { oldName, newName: newName.trim() });
    setEditingType(null);
    setEditingIdx(null);
    setNewName('');
  }

  async function handleAddIntern() {
    if (!addIntern.trim()) return;
    await api.post('/api/interns', { name: addIntern.trim() });
    setAddIntern('');
  }

  async function handleAddStaff() {
    if (!addStaff.trim()) return;
    await api.post('/api/staff', { name: addStaff.trim() });
    setAddStaff('');
  }

  function renderList(items: string[], type: 'intern' | 'staff') {
    return items.map((name, i) => (
      <div key={`${type}-${i}`} className="vol-item">
        {editingType === type && editingIdx === i ? (
          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={name}
              autoFocus
              style={{ flex: 1, padding: 8, border: '2px solid var(--primary)', borderRadius: 8, fontSize: 16 }}
              onKeyDown={e => e.key === 'Enter' && handleRename(type, name)}
            />
            <button className="btn-small btn-primary" style={{ width: 'auto' }} onClick={() => handleRename(type, name)}>
              Save
            </button>
            <button className="btn-small btn-secondary" onClick={() => { setEditingType(null); setEditingIdx(null); }}>
              X
            </button>
          </div>
        ) : (
          <>
            <div className="vol-info">
              <div className="vol-name">{name}</div>
            </div>
            <button
              className="btn-small btn-secondary"
              onClick={() => { setEditingType(type); setEditingIdx(i); setNewName(name); }}
            >
              Rename
            </button>
          </>
        )}
      </div>
    ));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Manage Interns & Staff</div>

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>INTERNS</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={addIntern}
            onChange={e => setAddIntern(e.target.value)}
            placeholder="Add intern..."
            style={{ flex: 1, padding: 10, border: '2px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 16 }}
            onKeyDown={e => e.key === 'Enter' && handleAddIntern()}
          />
          <button className="btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleAddIntern}>
            + Add
          </button>
        </div>
        {renderList(interns, 'intern')}

        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8, marginTop: 20 }}>STAFF</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={addStaff}
            onChange={e => setAddStaff(e.target.value)}
            placeholder="Add staff..."
            style={{ flex: 1, padding: 10, border: '2px solid var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 16 }}
            onKeyDown={e => e.key === 'Enter' && handleAddStaff()}
          />
          <button className="btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }} onClick={handleAddStaff}>
            + Add
          </button>
        </div>
        {renderList(staff, 'staff')}

        <button className="modal-close" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
