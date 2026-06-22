import { useState } from 'react';
import { Announcement } from '../types';

interface Props {
  announcements: Announcement[];
  role: string;
  myName?: string | null;
  api: {
    post: (url: string, body?: object) => Promise<unknown>;
    del: (url: string) => Promise<unknown>;
  };
}

export default function Announcements({ announcements, role, myName, api }: Props) {
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showReply, setShowReply] = useState<Record<string, boolean>>({});

  async function handlePost() {
    if (!message.trim() || !myName) return;
    await api.post('/api/announcements', { message, createdBy: myName, createdByRole: role === 'intern' ? 'intern' : 'volunteer' });
    setMessage('');
  }

  async function handleReact(annId: string, reaction: 'onIt' | 'question') {
    if (!myName) return;
    await api.post(`/api/announcements/${annId}/react`, { reaction, name: myName });
  }

  async function handleReply(annId: string) {
    const text = replyText[annId]?.trim();
    if (!text || !myName) return;
    await api.post(`/api/announcements/${annId}/reply`, { message: text, createdBy: myName });
    setReplyText(r => ({ ...r, [annId]: '' }));
    setShowReply(s => ({ ...s, [annId]: false }));
  }

  function timeAgo(ts: number) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }

  return (
    <div>
      {myName && (
        <div className="card">
          <div className="card-title">{role === 'intern' ? 'Post Announcement' : 'Send a Message'}</div>
          <div className="form-row">
            <textarea
              rows={2}
              placeholder={role === 'intern' ? 'e.g. Please take your lunches when prompted!' : 'e.g. Can someone cover Media Center?'}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={handlePost}>
            {role === 'intern' ? 'Broadcast to All' : 'Send'}
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-title">Announcements</div>
        {announcements.length === 0 && (
          <div className="empty-state">No announcements yet</div>
        )}
        {[...announcements].reverse().map(ann => {
          const myReaction = myName
            ? ann.reactions?.onIt?.includes(myName) ? 'onIt'
            : ann.reactions?.question?.includes(myName) ? 'question'
            : null
            : null;

          return (
            <div key={ann.id} className="announcement">
              <div className="announcement-text" style={ann.createdByRole === 'intern' ? { fontWeight: 700 } : undefined}>{ann.message}</div>
              <div className="announcement-meta">
                {ann.createdBy} · {timeAgo(ann.createdAt)}
                {role === 'intern' && (
                  <button
                    style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', background: 'var(--gray-200)', color: 'var(--gray-600)', borderRadius: 4, border: 'none' }}
                    onClick={() => api.del(`/api/announcements/${ann.id}`)}
                  >
                    Dismiss
                  </button>
                )}
              </div>

              {/* Reactions summary */}
              {((ann.reactions?.onIt?.length ?? 0) > 0 || (ann.reactions?.question?.length ?? 0) > 0) && (
                <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 6 }}>
                  {(ann.reactions?.onIt?.length ?? 0) > 0 && (
                    <span style={{ marginRight: 10 }}>✅ On it: {ann.reactions.onIt.join(', ')}</span>
                  )}
                  {(ann.reactions?.question?.length ?? 0) > 0 && (
                    <span>❓ Question: {ann.reactions.question.join(', ')}</span>
                  )}
                </div>
              )}

              {/* Replies */}
              {(ann.replies?.length ?? 0) > 0 && (
                <div style={{ marginTop: 8, borderLeft: '2px solid var(--gray-200)', paddingLeft: 10 }}>
                  {ann.replies.map(r => (
                    <div key={r.id} style={{ fontSize: 13, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{r.createdBy}:</span> {r.message}
                      <span style={{ fontSize: 11, color: 'var(--gray-500)', marginLeft: 6 }}>{timeAgo(r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {myName && (
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    style={{
                      fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid',
                      borderColor: myReaction === 'onIt' ? 'var(--green)' : 'var(--gray-300)',
                      background: myReaction === 'onIt' ? 'var(--green)' : 'transparent',
                      color: myReaction === 'onIt' ? 'white' : 'var(--gray-700)',
                    }}
                    onClick={() => handleReact(ann.id, 'onIt')}
                  >
                    ✅ On it
                  </button>
                  <button
                    style={{
                      fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid',
                      borderColor: myReaction === 'question' ? 'var(--orange)' : 'var(--gray-300)',
                      background: myReaction === 'question' ? 'var(--orange)' : 'transparent',
                      color: myReaction === 'question' ? 'white' : 'var(--gray-700)',
                    }}
                    onClick={() => handleReact(ann.id, 'question')}
                  >
                    ❓ Question
                  </button>
                  <button
                    style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--gray-300)', background: 'transparent', color: 'var(--gray-700)' }}
                    onClick={() => setShowReply(s => ({ ...s, [ann.id]: !s[ann.id] }))}
                  >
                    💬 Reply
                  </button>
                </div>
              )}

              {showReply[ann.id] && (
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    type="text"
                    placeholder="Type a reply…"
                    value={replyText[ann.id] ?? ''}
                    onChange={e => setReplyText(r => ({ ...r, [ann.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleReply(ann.id)}
                    style={{ flex: 1, fontSize: 13 }}
                  />
                  <button className="btn-primary" style={{ width: 'auto', padding: '0 12px', fontSize: 13 }} onClick={() => handleReply(ann.id)}>
                    Send
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
