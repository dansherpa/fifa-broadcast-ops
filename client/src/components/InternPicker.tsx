import { useState } from 'react';

interface Props {
  interns: string[];
  staff: string[];
  onSelect: (name: string) => void;
}

export default function InternPicker({ interns, staff, onSelect }: Props) {
  const [custom, setCustom] = useState('');

  return (
    <div className="card">
      <div className="card-title">Who are you?</div>
      <p style={{ fontSize: 14, marginBottom: 16, color: 'var(--gray-600)' }}>
        Tap your name so actions are attributed to you
      </p>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>INTERNS</div>
      <div className="checkin-grid" style={{ marginBottom: 16 }}>
        {interns.map(name => (
          <button key={name} className="checkin-btn" onClick={() => onSelect(name)}>
            {name}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 8 }}>STAFF</div>
      <div className="checkin-grid" style={{ marginBottom: 16 }}>
        {staff.map(name => (
          <button key={name} className="checkin-btn" onClick={() => onSelect(name)}>
            {name}
          </button>
        ))}
      </div>

      <div className="form-row">
        <label>Or type your name</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Your name"
            value={custom}
            onChange={e => setCustom(e.target.value)}
          />
          <button
            className="btn-primary"
            style={{ width: 'auto', whiteSpace: 'nowrap' }}
            onClick={() => custom.trim() && onSelect(custom.trim())}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}
