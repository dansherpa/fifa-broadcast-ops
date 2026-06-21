import { Volunteer } from '../types';

interface Props {
  volunteers: Volunteer[];
  me: Volunteer | undefined;
  myId: string | null;
  locations: string[];
  onSelect: (id: string) => void;
  api: { post: (url: string, body?: object) => Promise<unknown> };
}

export default function VolunteerView({ volunteers, me, myId, locations, onSelect, api }: Props) {
  if (!myId || !me) {
    return (
      <div className="card">
        <div className="card-title">Who are you?</div>
        <p style={{ fontSize: 14, marginBottom: 12, color: 'var(--gray-600)' }}>
          Tap your name to get started
        </p>
        <div className="checkin-grid">
          {volunteers.map(vol => (
            <button
              key={vol.id}
              className={`checkin-btn ${vol.checkedIn ? 'checked-in' : ''}`}
              onClick={() => onSelect(vol.id)}
            >
              {vol.name}
              {vol.checkedIn && <div style={{ fontSize: 11, marginTop: 4 }}>Active</div>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Hello, {me.name}</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span className={`status-badge status-${me.status}`}>{me.status}</span>
          {me.location && <span style={{ fontSize: 13, color: 'var(--gray-600)' }}>@ {me.location}</span>}
        </div>

        {!me.checkedIn ? (
          <button
            className="btn-primary"
            onClick={() => api.post(`/api/volunteers/${me.id}/checkin`, { location: 'Volunteer Center' })}
          >
            Check In
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {me.status !== 'on-break' ? (
              <button
                className="btn-warning"
                style={{ flex: 1 }}
                onClick={() => api.post(`/api/volunteers/${me.id}/status`, { status: 'on-break' })}
              >
                Go On Break
              </button>
            ) : (
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => api.post(`/api/volunteers/${me.id}/status`, { status: 'available' })}
              >
                Back from Break
              </button>
            )}
            <button
              className="btn-danger"
              style={{ flex: 1 }}
              onClick={() => api.post(`/api/volunteers/${me.id}/checkout`)}
            >
              Check Out
            </button>
          </div>
        )}
      </div>

      {me.checkedIn && (
        <div className="card">
          <div className="card-title">Update My Location</div>
          <div className="location-grid">
            {locations.map(loc => (
              <button
                key={loc}
                className={`location-btn ${me.location === loc ? 'active' : ''}`}
                onClick={() => api.post(`/api/volunteers/${me.id}/location`, { location: loc })}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: 12 }}>
        <button
          className="btn-secondary"
          style={{ width: '100%' }}
          onClick={() => {
            localStorage.removeItem('fifa-my-id');
            onSelect('');
          }}
        >
          Switch Person
        </button>
      </div>
    </div>
  );
}
