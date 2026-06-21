import { useState } from 'react';
import { Announcement } from '../types';

interface Props {
  announcements: Announcement[];
  role: string;
  internName?: string | null;
  api: {
    post: (url: string, body?: object) => Promise<unknown>;
    del: (url: string) => Promise<unknown>;
  };
}

export default function Announcements({ announcements, role, internName, api }: Props) {
  const [message, setMessage] = useState('');

  async function handlePost() {
    if (!message.trim()) return;
    await api.post('/api/announcements', { message, createdBy: internName || 'Staff' });
    setMessage('');
  }

  function timeAgo(ts: number) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <div>
      {role === 'intern' && (
        <div className="card">
          <div className="card-title">Post Announcement</div>
          <div className="form-row">
            <textarea
              rows={2}
              placeholder="e.g. Please take your lunches when prompted!"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={handlePost}>
            Broadcast to All
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-title">Announcements</div>
        {announcements.length === 0 && (
          <div className="empty-state">No announcements yet</div>
        )}
        {[...announcements].reverse().map(ann => (
          <div key={ann.id} className="announcement">
            <div className="announcement-text">{ann.message}</div>
            <div className="announcement-meta">
              {ann.createdBy} · {timeAgo(ann.createdAt)}
              {role === 'intern' && (
                <button
                  style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', background: 'var(--gray-200)', color: 'var(--gray-600)' }}
                  onClick={() => api.del(`/api/announcements/${ann.id}`)}
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
