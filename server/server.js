// Simple WebSocket signaling server for CrossDrop
// - Keeps a registry of connected clients
// - Routes offers/answers/ICE candidates between peers
// - Provides device discovery listing

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');

const { PORT, HEARTBEAT_MS, CLIENT_TIMEOUT_MS } = require('./config');
const registry = require('./registry');
const { generateToken, verifyToken } = require('./auth');

const app = express();
app.enable('trust proxy'); // Important for cloud deployments (Heroku, Render, etc.)
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('web'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Map clientId -> { ws, id }
const clients = new Map();

function broadcastDeviceList() {
  const list = registry.list().map(d => ({ id: d.id, name: d.name, info: d.info, lastSeen: d.lastSeen }));
  const payload = JSON.stringify({ type: 'device-list', devices: list });
  for (const entry of clients.values()) {
    if (entry.ws.readyState === WebSocket.OPEN) entry.ws.send(payload);
  }
}

function routeMessage(targetId, message) {
  const entry = clients.get(targetId);
  if (entry && entry.ws.readyState === WebSocket.OPEN) {
    entry.ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// REST: health, pair, token
app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/pair', (req, res) => {
  // pairing: sender requests pairing to targetId, server forwards pairing request
  const { fromId, toId, message } = req.body;
  if (!fromId || !toId) return res.status(400).json({ error: 'invalid' });
  const routed = routeMessage(toId, { type: 'pair-request', from: fromId, message });
  return res.json({ routed });
});

// New REST endpoint: create a signed pair request token and forward to target
app.post('/pair/request', (req, res) => {
  const { fromId, toId, message } = req.body;
  if (!fromId || !toId) return res.status(400).json({ error: 'missing' });
  // verify devices exist
  const from = registry.get(fromId);
  const to = registry.get(toId);
  if (!from || !to) return res.status(404).json({ error: 'device-not-found' });
  // generate short-lived pairing token
  const token = generateToken({ type: 'pair', fromId, toId, nonce: crypto.randomBytes(6).toString('hex') }, { expiresIn: '10m' });
  // forward to target via WS
  const ok = routeMessage(toId, { type: 'pair-request', from: fromId, name: from.name, message: message || '', token });
  if (!ok) return res.status(503).json({ error: 'target-unavailable' });
  return res.json({ ok: true });
});

app.post('/token', (req, res) => {
  const { id, name } = req.body;
  if (!id) return res.status(400).json({ error: 'missing id' });
  const token = generateToken({ id, name });
  registry.register({ id, name, info: req.body.info || {}, token });
  broadcastDeviceList();
  res.json({ token });
});

wss.on('connection', function connection(ws, req) {
  const id = crypto.randomBytes(8).toString('hex');
  clients.set(id, { ws, id });

  ws.send(JSON.stringify({ type: 'welcome', id }));

  ws.on('message', function incoming(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }

    // If register with token or device info
    if (msg.type === 'register') {
      const token = msg.token;
      if (token) {
        const payload = verifyToken(token);
        if (payload && payload.id) {
          registry.update(payload.id, { name: payload.name || msg.name, info: msg.info || {} });
          clients.set(payload.id, { ws, id: payload.id });
          ws.send(JSON.stringify({ type: 'registered', id: payload.id }));
          broadcastDeviceList();
          return;
        }
      }
      // fallback: register ephemeral
      const device = registry.register({ name: msg.name || 'unknown', info: msg.info || {} });
      clients.set(device.id, { ws, id: device.id });
      ws.send(JSON.stringify({ type: 'registered', id: device.id }));
      broadcastDeviceList();
      return;
    }

    // update lastSeen if known
    if (msg.from && registry.get(msg.from)) registry.update(msg.from, {});

    switch (msg.type) {
      case 'list':
        ws.send(JSON.stringify({ type: 'device-list', devices: registry.list() }));
        break;
      case 'offer':
      case 'answer':
      case 'candidate':
      case 'signal':
        if (msg.target && !routeMessage(msg.target, { ...msg, from: msg.from || id })) {
          ws.send(JSON.stringify({ type: 'error', message: 'target-unavailable' }));
        }
        break;
      case 'pair-request':
        // forward pairing request to target
        if (msg.target && !routeMessage(msg.target, { type: 'pair-request', from: msg.from, name: msg.name, message: msg.message })) {
          ws.send(JSON.stringify({ type: 'error', message: 'target-unavailable' }));
        }
        break;
      case 'pair-response':
        // forwarded response (accepted/rejected)
        if (msg.target) {
          // verify token if provided
          const token = msg.token;
          let valid = true;
          if (token) {
            const payload = verifyToken(token);
            valid = payload && payload.type === 'pair' && payload.fromId === msg.target && payload.toId === msg.from;
          }
          if (!valid) {
            ws.send(JSON.stringify({ type: 'error', message: 'invalid-pair-token' }));
            break;
          }
          // if accepted, add trusted relationship
          if (msg.accepted) {
            registry.addTrusted(msg.from, msg.target);
          }
          if (!routeMessage(msg.target, { type: 'pair-response', from: msg.from, accepted: msg.accepted })) {
            ws.send(JSON.stringify({ type: 'error', message: 'target-unavailable' }));
          }
        }
        break;
      case 'heartbeat':
        // noop - registry updated above
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    // remove client mapping
    for (const [k, v] of clients.entries()) {
      if (v.ws === ws) clients.delete(k);
    }
    broadcastDeviceList();
  });
});

// Periodic cleanup of stale registry entries
setInterval(() => {
  const now = Date.now();
  let removed = false;
  for (const d of registry.list()) {
    if (now - d.lastSeen > CLIENT_TIMEOUT_MS) {
      registry.remove(d.id);
      removed = true;
    }
  }
  if (removed) broadcastDeviceList();
}, HEARTBEAT_MS);

// Only start listening if this file is run directly (not required by tests)
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`CrossDrop signaling server listening on http://0.0.0.0:${PORT}`);
  });
}

module.exports = { app, server, registry };

