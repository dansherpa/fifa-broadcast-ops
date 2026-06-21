import { Volunteer, CoverageRule } from '../types';

interface Props {
  volunteers: Volunteer[];
  locations: string[];
  coverageRules: CoverageRule[];
  role: string;
  api: { post: (url: string, body?: object) => Promise<unknown> };
}

export default function PositionBoard({ volunteers, locations, coverageRules, role, api }: Props) {
  const checkedIn = volunteers.filter(v => v.checkedIn);
  const onBreak = checkedIn.filter(v => v.status === 'on-break');
  const escorting = checkedIn.filter(v => v.status === 'escorting');

  function getVolunteersAt(location: string) {
    return checkedIn.filter(v => v.location === location && v.status !== 'on-break');
  }

  function getCoverageRule(location: string) {
    return coverageRules.find(r => r.location === location);
  }

  function timeAgo(ts: number) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Active Volunteers ({checkedIn.length})</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span className="status-badge status-available">{checkedIn.length - onBreak.length - escorting.length} Available</span>
          <span className="status-badge status-on-break">{onBreak.length} On Break</span>
          <span className="status-badge status-escorting">{escorting.length} Escorting</span>
        </div>
      </div>

      {locations.map(location => {
        const vols = getVolunteersAt(location);
        const rule = getCoverageRule(location);
        const understaffed = rule && vols.length < rule.minRequired;

        if (vols.length === 0 && !rule) return null;

        return (
          <div key={location} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title" style={{ margin: 0 }}>{location}</div>
              {rule && (
                <span className={`coverage-count ${understaffed ? 'coverage-warn' : 'coverage-ok'}`}>
                  {vols.length}/{rule.minRequired}
                </span>
              )}
            </div>
            {understaffed && (
              <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                Needs {rule.minRequired - vols.length} more!
              </div>
            )}
            {vols.length === 0 && rule && (
              <div className="empty-state" style={{ padding: 12 }}>No one here</div>
            )}
            {vols.map(vol => (
              <div key={vol.id} className="vol-item">
                <div className="vol-info">
                  <div className="vol-name">{vol.name}</div>
                  <div className="time-ago">Updated {timeAgo(vol.lastUpdate)}</div>
                </div>
                <span className={`status-badge status-${vol.status}`}>{vol.status}</span>
              </div>
            ))}
          </div>
        );
      })}

      {onBreak.length > 0 && (
        <div className="card">
          <div className="card-title">On Break</div>
          {onBreak.map(vol => (
            <div key={vol.id} className="vol-item">
              <div className="vol-info">
                <div className="vol-name">{vol.name}</div>
                <div className="time-ago">Since {timeAgo(vol.lastUpdate)}</div>
              </div>
              {role === 'intern' && (
                <button
                  className="btn-small btn-secondary"
                  onClick={() => api.post(`/api/volunteers/${vol.id}/status`, { status: 'available' })}
                >
                  End Break
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
