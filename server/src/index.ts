import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import webpush from 'web-push';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

// --- Push Notifications ---

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:broadcast-ops@example.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const pushSubscriptions: PushSubscription[] = [];

function sendPushToAll(title: string, body: string, tag: string) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const payload = JSON.stringify({ title, body, tag });
  const stale: number[] = [];
  pushSubscriptions.forEach((sub, i) => {
    webpush.sendNotification(sub as any, payload).catch(() => {
      stale.push(i);
    });
  });
  // Clean up stale subscriptions after a short delay
  if (stale.length > 0) {
    setTimeout(() => {
      for (let i = stale.length - 1; i >= 0; i--) {
        pushSubscriptions.splice(stale[i], 1);
      }
    }, 1000);
  }
}

// --- Persistence ---

const DATA_DIR = process.env.DATA_DIR || path.join(path.dirname(new URL(import.meta.url).pathname), '../../data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveState() {
  ensureDataDir();
  const data = JSON.stringify({
    volunteers: VOLUNTEER_POOL,
    escorts,
    announcements,
    locationEvents: locationEvents.slice(-200),
    interns: INTERNS,
    staff: STAFF,
    locations: LOCATIONS,
    coverageRules,
    pushSubscriptions,
  }, null, 2);
  fs.writeFileSync(STATE_FILE, data, 'utf-8');
}

function loadState(): boolean {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.volunteers) { VOLUNTEER_POOL.length = 0; VOLUNTEER_POOL.push(...data.volunteers); }
      if (data.escorts) { escorts.length = 0; escorts.push(...data.escorts); }
      if (data.announcements) { announcements.length = 0; announcements.push(...data.announcements.map((a: Announcement) => ({ createdByRole: 'intern', reactions: { onIt: [], question: [] }, replies: [], ...a }))); }
      if (data.interns) { INTERNS.length = 0; INTERNS.push(...data.interns); }
      if (data.staff) { STAFF.length = 0; STAFF.push(...data.staff); }
      if (data.locations) { LOCATIONS.length = 0; LOCATIONS.push(...data.locations); }
      if (data.coverageRules) { coverageRules.length = 0; coverageRules.push(...data.coverageRules); }
      if (data.locationEvents) { locationEvents.length = 0; locationEvents.push(...data.locationEvents); }
      if (data.pushSubscriptions) { pushSubscriptions.length = 0; pushSubscriptions.push(...data.pushSubscriptions); }
      console.log('State loaded from', STATE_FILE);
      return true;
    }
  } catch (err) {
    console.error('Failed to load state, using defaults:', err);
  }
  return false;
}

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
  company?: string;
  phone?: string;
  from: string;
  to: string;
  status: 'pending' | 'claimed' | 'completed';
  assignedTo?: string;
  createdAt: number;
  createdBy: string;
  completedAt?: number;
}

interface AnnouncementReply {
  id: string;
  message: string;
  createdBy: string;
  createdAt: number;
}

interface Announcement {
  id: string;
  message: string;
  createdAt: number;
  createdBy: string;
  createdByRole: 'volunteer' | 'intern';
  reactions: { onIt: string[]; question: string[] };
  replies: AnnouncementReply[];
}

interface LocationEvent {
  id: string;
  volunteerName: string;
  eventType: 'checkin' | 'checkout' | 'location';
  location: string;
  timestamp: number;
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
let locationEvents: LocationEvent[] = [];

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

// Load persisted state (overrides defaults if file exists)
loadState();

// --- WebSocket ---

const clients = new Set<WebSocket>();

function broadcast(data: object) {
  saveState();
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
    locationEvents: locationEvents.slice(-200),
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
  locationEvents.push({ id: uuid(), volunteerName: vol.name, eventType: 'checkin', location: vol.location, timestamp: Date.now() });
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
  locationEvents.push({ id: uuid(), volunteerName: vol.name, eventType: 'checkout', location: '', timestamp: Date.now() });
  broadcast({ type: 'state', data: getState() });
  res.json(vol);
});

// Update volunteer location
app.post('/api/volunteers/:id/location', (req, res) => {
  const vol = VOLUNTEER_POOL.find(v => v.id === req.params.id);
  if (!vol) return res.status(404).json({ error: 'Not found' });
  vol.location = req.body.location;
  vol.lastUpdate = Date.now();
  locationEvents.push({ id: uuid(), volunteerName: vol.name, eventType: 'location', location: vol.location, timestamp: Date.now() });
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
    company: req.body.company || undefined,
    phone: req.body.phone || undefined,
    from: req.body.from,
    to: req.body.to,
    status: 'pending',
    createdAt: Date.now(),
    createdBy: req.body.createdBy || 'Volunteer',
  };
  escorts.unshift(task);
  broadcast({ type: 'state', data: getState() });
  sendPushToAll('Escort Needed', `${task.mediaPartner}: ${task.from} → ${task.to}`, `escort-${task.id}`);
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
    createdByRole: req.body.createdByRole === 'volunteer' ? 'volunteer' : 'intern',
    reactions: { onIt: [], question: [] },
    replies: [],
  };
  announcements.push(ann);
  broadcast({ type: 'state', data: getState() });
  sendPushToAll('New Alert', ann.message, `announce-${ann.id}`);
  res.json(ann);
});

// React to announcement
app.post('/api/announcements/:id/react', (req, res) => {
  const ann = announcements.find(a => a.id === req.params.id);
  if (!ann) return res.status(404).json({ error: 'Not found' });
  const { reaction, name } = req.body as { reaction: 'onIt' | 'question'; name: string };
  if (!reaction || !name) return res.status(400).json({ error: 'Missing reaction or name' });
  if (!ann.reactions) ann.reactions = { onIt: [], question: [] };
  // Toggle: remove from both first, then add if not already present
  ann.reactions.onIt = ann.reactions.onIt.filter(n => n !== name);
  ann.reactions.question = ann.reactions.question.filter(n => n !== name);
  const previous = reaction === 'onIt' ? ann.reactions.onIt : ann.reactions.question;
  if (!previous.includes(name)) previous.push(name);
  broadcast({ type: 'state', data: getState() });
  saveState();
  res.json(ann);
});

// Reply to announcement
app.post('/api/announcements/:id/reply', (req, res) => {
  const ann = announcements.find(a => a.id === req.params.id);
  if (!ann) return res.status(404).json({ error: 'Not found' });
  const { message, createdBy } = req.body as { message: string; createdBy: string };
  if (!message || !createdBy) return res.status(400).json({ error: 'Missing message or createdBy' });
  if (!ann.replies) ann.replies = [];
  const reply: AnnouncementReply = { id: uuid(), message, createdBy, createdAt: Date.now() };
  ann.replies.push(reply);
  broadcast({ type: 'state', data: getState() });
  saveState();
  res.json(reply);
});

// Delete announcement
app.delete('/api/announcements/:id', (req, res) => {
  announcements = announcements.filter(a => a.id !== req.params.id);
  broadcast({ type: 'state', data: getState() });
  res.json({ ok: true });
});

// Reset day — clears volatile state, preserves config
app.post('/api/reset-day', (req, res) => {
  VOLUNTEER_POOL.forEach(v => {
    v.checkedIn = false;
    v.status = 'off-duty';
    v.location = '';
    v.lastUpdate = Date.now();
  });
  escorts.length = 0;
  announcements.length = 0;
  locationEvents.length = 0;
  broadcast({ type: 'state', data: getState() });
  saveState();
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

// Push VAPID public key endpoint
app.get('/api/push/vapid-key', (_req, res) => {
  res.json({ key: VAPID_PUBLIC_KEY || null });
});

// Push subscription endpoint
app.post('/api/push/subscribe', (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  const exists = pushSubscriptions.some(s => s.endpoint === sub.endpoint);
  if (!exists) {
    pushSubscriptions.push(sub);
    saveState();
  }
  res.json({ ok: true });
});

// Serve static files in production
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 3456;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
