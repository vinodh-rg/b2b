// Simple in-memory registry for devices. Replace with DB for production.
const { v4: uuidv4 } = require('uuid');

class Registry {
  constructor() {
    this.devices = new Map(); // id -> { id, name, lastSeen, info, token }
    this.trusted = new Map(); // id -> Set of trusted ids
  }

  register(info) {
    const id = info.id || uuidv4();
    const device = Object.assign({ id, lastSeen: Date.now() }, info);
    this.devices.set(id, device);
    return device;
  }

  update(id, patch) {
    const d = this.devices.get(id);
    if (!d) return null;
    Object.assign(d, patch, { lastSeen: Date.now() });
    this.devices.set(id, d);
    return d;
  }

  remove(id) { this.devices.delete(id); }

  // Trust management
  addTrusted(fromId, toId) {
    console.log(`Trust established between ${fromId} and ${toId}`);
    if (!this.trusted.has(fromId)) this.trusted.set(fromId, new Set());
    if (!this.trusted.has(toId)) this.trusted.set(toId, new Set());
    this.trusted.get(fromId).add(toId);
    this.trusted.get(toId).add(fromId);
  }

  getTrusted(id) {
    const s = this.trusted.get(id);
    return s ? Array.from(s) : [];
  }

  list() {
    return Array.from(this.devices.values());
  }

  get(id) { return this.devices.get(id); }
}

module.exports = new Registry();
