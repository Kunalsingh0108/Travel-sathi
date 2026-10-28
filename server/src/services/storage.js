/**
 * Tiny file-backed data store (the project's "simple backend database").
 *
 * Everything lives in server/data/store/*.json so trips survive a restart
 * without requiring an external service. Swap this module for Supabase later:
 * the public API (list/save/get/remove) is deliberately small.
 *
 * Access rules enforced here:
 *   - a trip is private to its ownerToken (and to the signed-in user id)
 *   - sharing is explicit: only a trip with shared=true is readable by its
 *     share token, and sharing can be switched off again
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shortId, sha256 } from '../utils/ids.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_DIR = process.env.STORE_DIR || path.join(__dirname, '..', '..', 'data', 'store');

const files = {
  trips: path.join(STORE_DIR, 'trips.json'),
  users: path.join(STORE_DIR, 'users.json'),
  sessions: path.join(STORE_DIR, 'sessions.json'),
  metrics: path.join(STORE_DIR, 'metrics.json'),
  settings: path.join(STORE_DIR, 'settings.json'),
};

function ensure() {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
  for (const file of Object.values(files)) {
    if (!fs.existsSync(file)) fs.writeFileSync(file, '{}', 'utf8');
  }
}

function read(file) {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function write(file, data) {
  ensure();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

/* ------------------------------- trips ------------------------------- */

export function listTrips(owner) {
  const all = read(files.trips);
  return Object.values(all)
    .filter((t) => t.ownerToken === owner || (owner && t.userId === owner))
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .map(publicTrip);
}

export function getTrip(id) {
  return read(files.trips)[id] || null;
}

export function saveTrip(trip) {
  const all = read(files.trips);
  const now = new Date().toISOString();
  const record = { ...trip, updatedAt: now, createdAt: trip.createdAt || now };
  all[record.id] = record;
  write(files.trips, all);
  return record;
}

export function deleteTrip(id) {
  const all = read(files.trips);
  if (!all[id]) return false;
  delete all[id];
  write(files.trips, all);
  return true;
}

export function findByShareToken(token) {
  if (!token) return null;
  const all = read(files.trips);
  return Object.values(all).find((t) => t.shareId === token && t.shared) || null;
}

/** Strip tokens and full payloads from API responses. */
export function publicTrip(trip) {
  if (!trip) return null;
  const { ownerToken, ...rest } = trip;
  return {
    ...rest,
    title: trip.title || 'Untitled trip',
    dayCount: trip.itinerary?.days?.length || 0,
    destinationName: trip.itinerary?.destinationName || trip.destinationName || '',
    totalCost: trip.itinerary?.budget?.total || 0,
  };
}

export function tripStats() {
  const all = Object.values(read(files.trips));
  return {
    trips: all.length,
    shared: all.filter((t) => t.shared).length,
    destinations: [...new Set(all.map((t) => t.itinerary?.destinationId).filter(Boolean))],
  };
}

/* ------------------------------- users ------------------------------- */

export function findUserByEmail(email) {
  const all = read(files.users);
  return Object.values(all).find((u) => u.email === String(email).toLowerCase()) || null;
}

export function findUserById(id) {
  return read(files.users)[id] || null;
}

export function saveUser(user) {
  const all = read(files.users);
  all[user.id] = user;
  write(files.users, all);
  return user;
}

/* ----------------------------- sessions ------------------------------ */

export function createSession(userId) {
  const all = read(files.sessions);
  const token = sha256(`${userId}:${Date.now()}:${Math.random()}`);
  all[token] = { userId, createdAt: new Date().toISOString() };
  write(files.sessions, all);
  return token;
}

export function getSession(token) {
  if (!token) return null;
  return read(files.sessions)[token] || null;
}

export function deleteSession(token) {
  const all = read(files.sessions);
  if (!all[token]) return false;
  delete all[token];
  write(files.sessions, all);
  return true;
}

/* ------------------------------ metrics ------------------------------ */

const REQUEST_LOG_LIMIT = 50;

export function recordMetric(entry) {
  const all = read(files.metrics);
  all.errors = (all.errors || []).slice(-REQUEST_LOG_LIMIT);
  all.errors.push({ ...entry, at: new Date().toISOString() });
  write(files.metrics, all);
}

export function getMetrics() {
  const all = read(files.metrics);
  return {
    errors: (all.errors || []).slice().reverse().slice(0, 20),
    errorCount: (all.errors || []).length,
    since: all.errors?.[0]?.at || null,
  };
}

export function newId(prefix) {
  return shortId(prefix);
}

/* ---------------------- admin: destination flags ---------------------- */

export function getDisabled() {
  return read(files.settings).disabledDestinations || [];
}

export function setDisabled(ids) {
  const current = read(files.settings);
  current.disabledDestinations = Array.isArray(ids) ? ids : [];
  write(files.settings, current);
  return current.disabledDestinations;
}
