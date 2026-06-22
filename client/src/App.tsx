import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useApi } from './hooks/useApi';
import { Volunteer } from './types';
import PositionBoard from './components/PositionBoard';
import EscortQueue from './components/EscortQueue';
import VolunteerView from './components/VolunteerView';
import Announcements from './components/Announcements';
import Coverage from './components/Coverage';
import InternPicker from './components/InternPicker';
import ManagePool from './components/ManagePool';
import ManageLocations from './components/ManageLocations';
import ManageInterns from './components/ManageInterns';
import HelpGuide from './components/HelpGuide';

type Role = 'volunteer' | 'intern';
type Tab = 'board' | 'escorts' | 'me' | 'announce' | 'coverage' | 'help';

export default function App() {
  const { state, connected, requestPermission, notificationPermission } = useWebSocket();
  const api = useApi();
  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('fifa-role') as Role) || 'volunteer';
  });
  const [myId, setMyId] = useState<string | null>(() => {
    return localStorage.getItem('fifa-my-id');
  });
  const [internName, setInternName] = useState<string | null>(() => {
    return localStorage.getItem('fifa-intern-name');
  });
  const [tab, setTab] = useState<Tab>('board');
  const [showManagePool, setShowManagePool] = useState(false);
  const [showManageLocations, setShowManageLocations] = useState(false);
  const [showManageInterns, setShowManageInterns] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!state) {
    return (
      <div className="app" style={{ padding: 40, textAlign: 'center' }}>
        <p>Connecting...</p>
      </div>
    );
  }

  const handleRoleChange = (r: Role) => {
    setRole(r);
    localStorage.setItem('fifa-role', r);
  };

  const handleSelectVolunteer = (id: string) => {
    setMyId(id);
    localStorage.setItem('fifa-my-id', id);
  };

  const handleSelectIntern = (name: string) => {
    setInternName(name);
    localStorage.setItem('fifa-intern-name', name);
  };

  const me: Volunteer | undefined = state.volunteers.find(v => v.id === myId);
  const isIdentified = (role === 'volunteer' && !!myId && !!me) || (role === 'intern' && !!internName);

  if (!isIdentified) {
    return (
      <div className="app">
        <div className="header">
          <h1>
            <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} />
            Broadcast Ops - Boston
          </h1>
          <div className="header-sub">FIFA World Cup 2026</div>
        </div>
        <div style={{ padding: '32px 16px 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Who are you?</div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', margin: 0 }}>Tap your name to get started</p>
          </div>
          <div className="role-selector">
            <button
              className={`role-btn ${role === 'volunteer' ? 'active' : ''}`}
              onClick={() => handleRoleChange('volunteer')}
            >
              Volunteer
            </button>
            <button
              className={`role-btn ${role === 'intern' ? 'active' : ''}`}
              onClick={() => handleRoleChange('intern')}
            >
              Intern / Staff
            </button>
          </div>
          {role === 'volunteer' && (
            <div className="card">
              <div className="checkin-grid">
                {state.volunteers.map(vol => (
                  <button key={vol.id} className="checkin-btn" onClick={() => handleSelectVolunteer(vol.id)}>
                    {vol.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {role === 'intern' && (
            <InternPicker interns={state.interns} staff={state.staff} onSelect={handleSelectIntern} />
          )}
        </div>
      </div>
    );
  }
  const pendingEscorts = state.escorts.filter(e => e.status === 'pending').length;

  return (
    <div className="app">
      <div className="header">
        <h1>
          <span className={`connection-dot ${connected ? 'connected' : 'disconnected'}`} />
          Broadcast Ops - Boston
        </h1>
        <div className="header-sub">
          FIFA World Cup 2026
          {role === 'intern' && internName && (
            <span style={{ marginLeft: 8 }}>
              · {internName}
              <button
                style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, border: 'none' }}
                onClick={() => { setInternName(null); localStorage.removeItem('fifa-intern-name'); }}
              >
                switch
              </button>
            </span>
          )}
          {role === 'volunteer' && me && (
            <span style={{ marginLeft: 8 }}>
              · {me.name}
              <button
                style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, border: 'none' }}
                onClick={() => { setMyId(null); localStorage.removeItem('fifa-my-id'); }}
              >
                switch
              </button>
            </span>
          )}
          <button
            className={`notify-btn ${notificationPermission === 'granted' ? 'on' : ''}`}
            onClick={requestPermission}
            title={notificationPermission === 'granted' ? 'Notifications on' : 'Enable notifications'}
          >
            {notificationPermission === 'granted' ? '🔔' : '🔕'}
          </button>
        </div>
      </div>

      <div className="role-selector">
        <button
          className={`role-btn ${role === 'volunteer' ? 'active' : ''}`}
          onClick={() => handleRoleChange('volunteer')}
        >
          Volunteer
        </button>
        <button
          className={`role-btn ${role === 'intern' ? 'active' : ''}`}
          onClick={() => handleRoleChange('intern')}
        >
          Intern / Staff
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'board' ? 'active' : ''}`} onClick={() => setTab('board')}>
          Board
        </button>
        <button className={`tab ${tab === 'announce' ? 'active' : ''}`} onClick={() => setTab('announce')}>
          Chat
        </button>
        <button className={`tab ${tab === 'escorts' ? 'active' : ''}`} onClick={() => setTab('escorts')}>
          Escorts{pendingEscorts > 0 && <span className="badge">{pendingEscorts}</span>}
        </button>
        {role === 'volunteer' && (
          <button className={`tab ${tab === 'me' ? 'active' : ''}`} onClick={() => setTab('me')}>
            My Status
          </button>
        )}
        <button className={`tab ${tab === 'coverage' ? 'active' : ''}`} onClick={() => setTab('coverage')}>
          Coverage
        </button>
        <button className={`tab ${tab === 'help' ? 'active' : ''}`} onClick={() => setTab('help')}>
          Help
        </button>
      </div>

      {role === 'intern' && tab === 'board' && (
        <div style={{ padding: '12px 12px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-secondary" style={{ flex: 1, minWidth: '45%' }} onClick={() => setShowManagePool(true)}>
            Manage Volunteers
          </button>
          <button className="btn-secondary" style={{ flex: 1, minWidth: '45%' }} onClick={() => setShowManageLocations(true)}>
            Manage Locations
          </button>
          <button className="btn-secondary" style={{ flex: 1, minWidth: '45%' }} onClick={() => setShowManageInterns(true)}>
            Manage Interns/Staff
          </button>
          <button className="btn-danger" style={{ flex: 1, minWidth: '45%' }} onClick={() => setShowResetConfirm(true)}>
            Reset Day
          </button>
        </div>
      )}

      {showResetConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Reset Day?</div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 20 }}>
              This will check out all volunteers, clear all chat messages, location history, and escort requests.
              Volunteer names, locations, and intern/staff lists will be kept.
            </p>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 20 }}>
              This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowResetConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                style={{ flex: 1 }}
                onClick={async () => {
                  await api.post('/api/reset-day');
                  setShowResetConfirm(false);
                }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'board' && (
        <PositionBoard
          volunteers={state.volunteers}
          locations={state.locations}
          coverageRules={state.coverageRules}
          role={role}
          api={api}
        />
      )}

      {tab === 'escorts' && (
        <EscortQueue
          escorts={state.escorts}
          volunteers={state.volunteers}
          locations={state.locations}
          role={role}
          myId={myId}
          internName={internName}
          api={api}
        />
      )}

      {tab === 'me' && role === 'volunteer' && (
        <VolunteerView
          volunteers={state.volunteers}
          me={me}
          myId={myId}
          locations={state.locations}
          onSelect={handleSelectVolunteer}
          api={api}
        />
      )}

      {tab === 'announce' && (
        <Announcements
          announcements={state.announcements}
          locationEvents={state.locationEvents ?? []}
          role={role}
          myName={role === 'volunteer' ? (me?.name ?? null) : (internName ?? null)}
          api={api}
        />
      )}

      {tab === 'coverage' && (
        <Coverage
          volunteers={state.volunteers}
          locations={state.locations}
          coverageRules={state.coverageRules}
          role={role}
          api={api}
        />
      )}

      {tab === 'help' && (
        <HelpGuide role={role} />
      )}

      {showManagePool && (
        <ManagePool
          volunteers={state.volunteers}
          api={api}
          onClose={() => setShowManagePool(false)}
        />
      )}

      {showManageLocations && (
        <ManageLocations
          locations={state.locations}
          api={api}
          onClose={() => setShowManageLocations(false)}
        />
      )}

      {showManageInterns && (
        <ManageInterns
          interns={state.interns}
          staff={state.staff}
          api={api}
          onClose={() => setShowManageInterns(false)}
        />
      )}
    </div>
  );
}
