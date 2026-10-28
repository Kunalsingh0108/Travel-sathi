/** Request authentication: guest owner tokens, sessions and the admin token. */
import { httpError } from './error.js';
import { userFromToken, sessionTokenFromRequest, isAdminRequest } from '../services/auth.js';

export function ownerToken(req) {
  return String(req.headers['x-owner-token'] || '').trim() || null;
}

/** Optional: attaches req.user when a valid session token is present. */
export function attachUser(req, res, next) {
  const token = sessionTokenFromRequest(req);
  const user = userFromToken(token);
  if (user) {
    req.user = user;
    req.sessionToken = token;
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!process.env.ADMIN_TOKEN) {
    return next(httpError(503, 'ADMIN_NOT_CONFIGURED',
      'ADMIN_TOKEN is not set on the server, so the admin API is disabled.'));
  }
  if (!isAdminRequest(req)) {
    return next(httpError(401, 'ADMIN_REQUIRED', 'A valid admin token is required.'));
  }
  next();
}

/**
 * Trip ownership: the guest owner token that created the trip, or the
 * signed-in account that owns it. Shared read-only links are handled in the
 * controller because they are a separate, revocable permission.
 */
export function canAccessTrip(req, trip) {
  if (!trip) return false;
  const owner = ownerToken(req);
  if (owner && trip.ownerToken && trip.ownerToken === owner) return true;
  if (req.user && trip.userId && trip.userId === req.user.id) return true;
  return false;
}

export function requireTripOwner(getTripFn) {
  return (req, res, next) => {
    const trip = getTripFn(req.params.id);
    if (!trip) return next(httpError(404, 'TRIP_NOT_FOUND', 'That trip does not exist.'));
    if (!canAccessTrip(req, trip)) {
      return next(httpError(403, 'NOT_OWNER', 'This trip belongs to someone else.'));
    }
    req.trip = trip;
    next();
  };
}
