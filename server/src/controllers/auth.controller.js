import { register, login, logout, userFromToken, sessionTokenFromRequest, authConfigured } from '../services/auth.js';
import { asyncHandler, httpError } from '../middleware/error.js';

export const doRegister = asyncHandler(async (req, res) => {
  const result = register(req.body || {});
  res.status(201).json({ user: result.user, token: result.token });
});

export const doLogin = asyncHandler(async (req, res) => {
  const result = login(req.body || {});
  res.json({ user: result.user, token: result.token });
});

export const doLogout = asyncHandler(async (req, res) => {
  const token = sessionTokenFromRequest(req);
  if (token) logout(token);
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const token = sessionTokenFromRequest(req);
  const user = userFromToken(token);
  if (!user) throw httpError(401, 'NOT_SIGNED_IN', 'You are not signed in.');
  res.json({ user });
});

export const authStatus = asyncHandler(async (req, res) => {
  res.json({ mode: authConfigured() ? 'local-accounts' : 'guest-only', configured: authConfigured() });
});