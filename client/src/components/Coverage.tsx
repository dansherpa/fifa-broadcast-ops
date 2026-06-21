import { Volunteer, CoverageRule } from '../types';

interface Props {
  volunteers: Volunteer[];
  locations: string[];
  coverageRules: CoverageRule[];
  role: string;
  api: { put: (url: string, body?: object) => Promise<unknown> };
}

export default function Coverage({ volunteers, locations, coverageRules, role, api }: Props) {
  const checkedIn = volunteers.filter(v => v.checkedIn && v.status !== 'on-break');

  function getCount(location: string) {
    return checkedIn.filter(v => v.location === location).length;
  }

  function getRule(location: string) {
    return coverageRules.find(r => r.location === location);
  }

  function getNames(location: string) {
    return checkedIn.filter(v => v.location === location).map(v => v.name);
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Location Coverage</div>
        {locations.map(loc => {
          const count = getCount(loc);
          const rule = getRule(loc);
          const understaffed = rule && count < rule.minRequired;
          const names = getNames(loc);

          return (
            <div key={loc} className="coverage-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="coverage-location">{loc}</div>
                  {names.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>
                      {names.join(', ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`coverage-count ${understaffed ? 'coverage-warn' : count > 0 ? 'coverage-ok' : ''}`}>
                    {count}{rule ? `/${rule.minRequired}` : ''}
                  </span>
                  {role === 'intern' && (
                    <select
                      style={{ fontSize: 12, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--gray-300)' }}
                      value={rule?.minRequired || 0}
                      onChange={e => api.put('/api/coverage', { location: loc, minRequired: parseInt(e.target.value) })}
                    >
                      <option value={0}>No min</option>
                      <option value={1}>Min 1</option>
                      <option value={2}>Min 2</option>
                      <option value={3}>Min 3</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-title">Summary</div>
        <div style={{ fontSize: 14 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{checkedIn.length}</strong> volunteers active
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>{volunteers.filter(v => v.status === 'on-break').length}</strong> on break
          </div>
          <div>
            <strong>{volunteers.filter(v => v.status === 'escorting').length}</strong> escorting
          </div>
        </div>
      </div>
    </div>
  );
}
