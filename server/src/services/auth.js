/**
 * Local account auth (the project's "equivalent simple backend").
 * scrypt-hashed passwords + opaque session tokens, no external service.
 * Swap for Supabase later without touching route handlers.
 */
import crypto from 'node:crypto';
import { findUserByEmail, findUserById, saveUser, createSession, getSession, deleteSession } from './storage.js';
import { sha256, shortId } from '../utils/ids.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function authConfigured() {
  return true; // local accounts always available
}

export function register({ email, password, name }) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) throw Object.assign(new Error('Enter a valid email address.'), { status: 400, code: 'BAD_EMAIL' });
  if (!password || String(password).length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { status: 400, code: 'WEAK_PASSWORD' });
  }
  if (findUserByEmail(normalized)) {
    throw Object.assign(new Error('An account with that email already exists.'), { status: 409, code: 'EMAIL_TAKEN' });
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const user = {
    id: shortId('user'),
    email: normalized,
    name: String(name || '').trim().slice(0, 60),
    salt,
    passwordHash: hashPassword(String(password), salt),
    role: 'user',
    createdAt: new Date().toISOString(),
  };
  saveUser(user);
  const token = createSession(user.id);
  return { user: safeUser(user), token };
}

export function login({ email, password }) {
  const normalized = String(email || '').trim().toLowerCase();
  const user = findUserByEmail(normalized);
  const salt = user ? user.salt : 'decoy';
  const candidate = hashPassword(String(password || ''), salt);
  const ok = user && crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.passwordHash, 'hex'));
  if (!ok) throw Object.assign(new Error('Email or password is incorrect.'), { status: 401, code: 'BAD_CREDENTIALS' });
  const token = createSession(user.id);
  return { user: safeUser(user), token };
}

export function logout(token) {
  return deleteSession(token);
}

export function userFromToken(token) {
  const session = getSession(token);
  if (!session) return null;
  const user = findUserById(session.userId);
  return user ? safeUser(user) : null;
}

export function sessionTokenFromRequest(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return String(req.headers['x-session-token'] || '').trim() || null;
}

export function isAdminRequest(req) {
  const configured = process.env.ADMIN_TOKEN;
  const provided = String(req.headers['x-admin-token'] || '').trim();
  if (!configured) return false;
  if (!provided) return false;
  if (configured.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(configured), Buffer.from(provided));
}

export function adminConfigured() {
  return Boolean(process.env.ADMIN_TOKEN);
}

export function safeUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
}
