import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { v4 as uuid } from 'uuid';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// --- Types ---

interface Volunteer {
  id: string;
  name: string;
  location: string;
  status: 'available' | 'on-break' | 'escorting' | 'off-duty';
  checkedIn: boolean;
  lastUpdate: number;
}

interface EscortTask {
  id: string;
  mediaPartner: string;
  from: string;
  to: string;
  status: 'pending' | 'claimed' | 'completed';
  assignedTo?: string;
  createdAt: number;
  createdBy: string;
  completedAt?: number;
}

interface Announcement {
  id: string;
  message: string;
  createdAt: number;
  createdBy: string;
}

interface CoverageRule {
  location: string;
  minRequired: number;
}

// --- State ---

const LOCATIONS = [
  'Media Center',
  'BIO',
  'Commentary',
  'Press Box (Red)',
  'Press Box (Blue)',
  'Pitch',
  'Presentation 1',
  'Presentation 3',
  'Announce Platform',
  'En Route',
  'Volunteer Center',
];

const VOLUNTEER_POOL: Volunteer[] = [
  { id: '1', name: 'Tonia', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '2', name: 'Judith', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '3', name: 'Dan', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '4', name: 'Michael', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '5', name: 'Alicia', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '6', name: 'Calvert', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '7', name: 'Rahil', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '8', name: 'Cobi', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '9', name: 'Volunteer 9', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '10', name: 'Volunteer 10', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '11', name: 'Volunteer 11', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '12', name: 'Volunteer 12', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '13', name: 'Volunteer 13', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '14', name: 'Volunteer 14', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '15', name: 'Volunteer 15', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '16', name: 'Volunteer 16', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '17', name: 'Volunteer 17', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '18', name: 'Volunteer 18', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '19', name: 'Volunteer 19', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
  { id: '20', name: 'Volunteer 20', location: '', status: 'off-duty', checkedIn: false, lastUpdate: Date.now() },
];

let escorts: EscortTask[] = [];
let announcements: Announcement[] = [];

const INTERNS: string[] = [
  'Stella', 'Kira', 'Isabelle', 'Cobi', 'Diyah',
  'Intern 6', 'Intern 7', 'Intern 8',
];

const STAFF: string[] = [
  'Staff 1', 'Staff 2', 'Staff 3', 'Staff 4', 'Staff 5', 'Staff 6',
];

const coverageRules: CoverageRule[] = [
  { location: 'Media Center', minRequired: 2 },
  { location: 'BIO', minRequired: 1 },
];

// --- WebSocket ---

const clients = new Set<WebSocket>();

function broadcast(data: object) {
  const msg = JSON.stringify(data);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function isGenericName(name: string) {
  return /^(Volunteer|Intern|Staff)\s+\d+$/i.test(name);
}

function sortedLocations() {
  return [...LOCATIONS].sort((a, b) => a.localeCompare(b));
}

function sortedVolunteers() {
  return [...VOLUNTEER_POOL].sort((a, b) => {
    const aGeneric = isGenericName(a.name);
    const bGeneric = isGenericName(b.name);
    if (aGeneric && !bGeneric) return 1;
    if (!aGeneric && bGeneric) return -1;
    return a.name.localeCompare(b.name);
  });
}

function isGenericInternName(name: string) {
  return /^(Intern|Staff)\s+\d+$/i.test(name);
}

function sortedInterns() {
  return [...INTERNS].sort((a, b) => {
    const aGeneric = isGenericInternName(a);
    const bGeneric = isGenericInternName(b);
    if (aGeneric && !bGeneric) return 1;
    if (!aGeneric && bGeneric) return -1;
    return a.localeCompare(b);
  });
}

function sortedStaff() {
  return [...STAFF].sort((a, b) => {
    const aGeneric = isGenericInternName(a);
    const bGeneric = isGenericInternName(b);
    if (aGeneric && !bGeneric) return 1;
    if (!aGeneric && bGeneric) return -1;
    return a.localeCompare(b);
  });
}

function getState() {
  return {
    volunteers: sortedVolunteers(),
    escorts,
    announcements: announcements.slice(-20),
    locations: sortedLocations(),
    interns: sortedInterns(),
    staff: sortedStaff(),
    coverageRules,
  };
}

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'state', data: getState() }));
  ws.on('close', () => clients.delete(ws));
});

// --- API Routes ---

// Get full state
app.get('/api/state', (_req, res) => {
  res.json(getState());
});

// Volunteer check-in
app.post('/api/volunteers/:id/checkin', (req, res) => {
  const vol = VOLUNTEER_POOL.find(v => v.id === req.params.id);
  if (!vol) return res.status(404).json({ error: 'Not found' });
  vol.checkedIn = true;
  vol.status = 'available';
  vol.location = req.body.location || 'Volunteer Center';
  vol.lastUpdate = Date.now();
  broadcast({ type: 'state', data: getState() });
  res.json(vol);
});

// Volunteer check-out
app.post('/api/volunteers/:id/checkout', (req, res) => {
  const vol = VOLUNTEER_POOL.find(v => v.id === req.params.id);
  if (!vol) return res.status(404).json({ error: 'Not found' });
  vol.checkedIn = false;
  vol.status = 'off-duty';
  vol.location = '';
  vol.lastUpdate = Date.now();
  broadcast({ type: 'state', data: getState() });
  res.json(vol);
});

// Update volunteer location
app.post('/api/volunteers/:id/location', (req, res) => {
  const vol = VOLUNTEER_POOL.find(v => v.id === req.params.id);
  if (!vol) return res.status(404).json({ error: 'Not found' });
  vol.location = req.body.location;
  vol.lastUpdate = Date.now();
  broadcast({ type: 'state', data: getState() });
  res.json(vol);
});

// Update volunteer status
app.post('/api/volunteers/:id/status', (req, res) => {
  const vol = VOLUNTEER_POOL.find(v => v.id === req.params.id);
  if (!vol) return res.status(404).json({ error: 'Not found' });
  vol.status = req.body.status;
  if (req.body.location) vol.location = req.body.location;
  vol.lastUpdate = Date.now();
  broadcast({ type: 'state', data: getState() });
  res.json(vol);
});

// Update volunteer name
app.put('/api/volunteers/:id', (req, res) => {
  const vol = VOLUNTEER_POOL.find(v => v.id === req.params.id);
  if (!vol) return res.status(404).json({ error: 'Not found' });
  if (req.body.name) vol.name = req.body.name;
  vol.lastUpdate = Date.now();
  broadcast({ type: 'state', data: getState() });
  res.json(vol);
});

// Create escort task
app.post('/api/escorts', (req, res) => {
  const task: EscortTask = {
    id: uuid(),
    mediaPartner: req.body.mediaPartner,
    from: req.body.from,
    to: req.body.to,
    status: 'pending',
    createdAt: Date.now(),
    createdBy: req.body.createdBy || 'Intern',
  };
  escorts.unshift(task);
  broadcast({ type: 'state', data: getState() });
  res.json(task);
});

// Claim escort task
app.post('/api/escorts/:id/claim', (req, res) => {
  const task = escorts.find(e => e.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  task.status = 'claimed';
  task.assignedTo = req.body.volunteerId;
  const vol = VOLUNTEER_POOL.find(v => v.id === req.body.volunteerId);
  if (vol) {
    vol.status = 'escorting';
    vol.location = 'En Route';
    vol.lastUpdate = Date.now();
  }
  broadcast({ type: 'state', data: getState() });
  res.json(task);
});

// Complete escort task
app.post('/api/escorts/:id/complete', (req, res) => {
  const task = escorts.find(e => e.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });
  task.status = 'completed';
  task.completedAt = Date.now();
  if (task.assignedTo) {
    const vol = VOLUNTEER_POOL.find(v => v.id === task.assignedTo);
    if (vol) {
      vol.status = 'available';
      vol.location = task.to;
      vol.lastUpdate = Date.now();
    }
  }
  broadcast({ type: 'state', data: getState() });
  res.json(task);
});

// Post announcement
app.post('/api/announcements', (req, res) => {
  const ann: Announcement = {
    id: uuid(),
    message: req.body.message,
    createdAt: Date.now(),
    createdBy: req.body.createdBy || 'Staff',
  };
  announcements.push(ann);
  broadcast({ type: 'state', data: getState() });
  res.json(ann);
});

// Delete announcement
app.delete('/api/announcements/:id', (req, res) => {
  announcements = announcements.filter(a => a.id !== req.params.id);
  broadcast({ type: 'state', data: getState() });
  res.json({ ok: true });
});

// Add intern
app.post('/api/interns', (req, res) => {
  const { name } = req.body;
  if (!name || INTERNS.includes(name)) return res.status(400).json({ error: 'Invalid or duplicate' });
  INTERNS.push(name);
  broadcast({ type: 'state', data: getState() });
  res.json({ interns: INTERNS });
});

// Rename intern
app.post('/api/interns/rename', (req, res) => {
  const { oldName, newName } = req.body;
  const idx = INTERNS.indexOf(oldName);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  INTERNS[idx] = newName;
  broadcast({ type: 'state', data: getState() });
  res.json({ interns: INTERNS });
});

// Add staff
app.post('/api/staff', (req, res) => {
  const { name } = req.body;
  if (!name || STAFF.includes(name)) return res.status(400).json({ error: 'Invalid or duplicate' });
  STAFF.push(name);
  broadcast({ type: 'state', data: getState() });
  res.json({ staff: STAFF });
});

// Rename staff
app.post('/api/staff/rename', (req, res) => {
  const { oldName, newName } = req.body;
  const idx = STAFF.indexOf(oldName);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  STAFF[idx] = newName;
  broadcast({ type: 'state', data: getState() });
  res.json({ staff: STAFF });
});

// Add location
app.post('/api/locations', (req, res) => {
  const { name } = req.body;
  if (!name || LOCATIONS.includes(name)) return res.status(400).json({ error: 'Invalid or duplicate' });
  LOCATIONS.push(name);
  broadcast({ type: 'state', data: getState() });
  res.json({ locations: LOCATIONS });
});

// Rename location
app.post('/api/locations/rename', (req, res) => {
  const { oldName, newName } = req.body;
  const idx = LOCATIONS.indexOf(oldName);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  LOCATIONS[idx] = newName;
  VOLUNTEER_POOL.forEach(v => {
    if (v.location === oldName) v.location = newName;
  });
  coverageRules.forEach(r => {
    if (r.location === oldName) r.location = newName;
  });
  escorts.forEach(e => {
    if (e.from === oldName) e.from = newName;
    if (e.to === oldName) e.to = newName;
  });
  broadcast({ type: 'state', data: getState() });
  res.json({ locations: LOCATIONS });
});

// Update coverage rules
app.put('/api/coverage', (req, res) => {
  const { location, minRequired } = req.body;
  const existing = coverageRules.find(r => r.location === location);
  if (existing) {
    existing.minRequired = minRequired;
  } else {
    coverageRules.push({ location, minRequired });
  }
  broadcast({ type: 'state', data: getState() });
  res.json(coverageRules);
});

// Serve static files in production
const clientDist = path.join(import.meta.dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3456;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
