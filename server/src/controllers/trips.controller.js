import { validateItinerary } from '../services/schedule.js';
import { refreshDerived } from '../services/generator.js';
import {
  listTrips, getTrip, saveTrip, deleteTrip, findByShareToken, publicTrip, newId,
} from '../services/storage.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { ownerToken, canAccessTrip } from '../middleware/auth.js';
import { secureToken } from '../utils/ids.js';

function assertSavable(itinerary) {
  const validation = validateItinerary(itinerary);
  if (!validation.valid) {
    const err = httpError(422, 'ITINERARY_INVALID', validation.errors[0]?.message || 'The itinerary has schedule conflicts.');
    err.details = validation.errors.map((e) => e.message);
    throw err;
  }
  return validation;
}

export const listMine = asyncHandler(async (req, res) => {
  const owner = ownerToken(req);
  const userId = req.user?.id || null;
  const trips = listTrips(owner || userId || '__none__');
  res.json({ trips });
});

export const createTrip = asyncHandler(async (req, res) => {
  const { itinerary, title, shared } = req.body || {};
  if (!itinerary?.days?.length) throw httpError(400, 'NO_ITINERARY', 'Nothing to save - generate an itinerary first.');
  const validation = assertSavable(itinerary);
  const refreshed = refreshDerived(itinerary);

  const owner = ownerToken(req) || newId('owner');
  const record = {
    id: newId('trip'),
    ownerToken: owner,
    userId: req.user?.id || null,
    shared: Boolean(shared),
    shareId: null,
    title: String(title || refreshed.title || 'Untitled trip').slice(0, 120),
    destinationId: refreshed.destinationId,
    destinationName: refreshed.destinationName,
    itinerary: refreshed,
    budget: refreshed.budget,
    validation,
    createdAt: new Date().toISOString(),
  };
  if (record.shared) record.shareId = secureToken(12);

  const saved = saveTrip(record);
  res.status(201).json({ trip: publicTrip(saved), ownerToken: saved.ownerToken });
});

export const getTripById = asyncHandler(async (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) throw httpError(404, 'TRIP_NOT_FOUND', 'That trip does not exist.');

  if (canAccessTrip(req, trip)) {
    const { ownerToken: _omit, ...rest } = trip;
    return res.json({ trip: rest, access: 'owner' });
  }

  const shareToken = String(req.query.share || '').trim();
  if (shareToken && trip.shareId && trip.shareId === shareToken && trip.shared) {
    const { ownerToken: _omit, ...rest } = trip;
    return res.json({ trip: rest, access: 'shared' });
  }

  throw httpError(403, 'NOT_OWNER', 'This trip is private. Ask the owner for a share link.');
});

export const updateTrip = asyncHandler(async (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) throw httpError(404, 'TRIP_NOT_FOUND', 'That trip does not exist.');
  if (!canAccessTrip(req, trip)) throw httpError(403, 'NOT_OWNER', 'This trip belongs to someone else.');

  const { itinerary, title } = req.body || {};
  if (!itinerary?.days?.length) throw httpError(400, 'NO_ITINERARY', 'No itinerary supplied.');
  assertSavable(itinerary);
  const refreshed = refreshDerived(itinerary);

  const updated = saveTrip({
    ...trip,
    itinerary: refreshed,
    budget: refreshed.budget,
    title: String(title || trip.title).slice(0, 120),
  });
  const { ownerToken: _omit, ...rest } = updated;
  res.json({ trip: rest, access: 'owner' });
});

export const shareTrip = asyncHandler(async (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) throw httpError(404, 'TRIP_NOT_FOUND', 'That trip does not exist.');
  if (!canAccessTrip(req, trip)) throw httpError(403, 'NOT_OWNER', 'This trip belongs to someone else.');

  const enable = Boolean(req.body?.shared);
  const updated = saveTrip({
    ...trip,
    shared: enable,
    shareId: enable ? trip.shareId || secureToken(12) : trip.shareId,
  });
  res.json({ shared: updated.shared, shareId: updated.shared ? updated.shareId : null });
});

export const duplicateTrip = asyncHandler(async (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) throw httpError(404, 'TRIP_NOT_FOUND', 'That trip does not exist.');
  if (!canAccessTrip(req, trip)) throw httpError(403, 'NOT_OWNER', 'This trip belongs to someone else.');

  const owner = ownerToken(req) || newId('owner');
  const copy = {
    ...trip,
    id: newId('trip'),
    ownerToken: owner,
    userId: req.user?.id || trip.userId || null,
    shared: false,
    shareId: null,
    title: `${trip.title} (copy)`.slice(0, 120),
    itinerary: JSON.parse(JSON.stringify(trip.itinerary)),
    createdAt: new Date().toISOString(),
  };
  copy.itinerary.id = newId('itin');
  const saved = saveTrip(copy);
  res.status(201).json({ trip: publicTrip(saved), ownerToken: saved.ownerToken });
});

export const removeTrip = asyncHandler(async (req, res) => {
  const trip = getTrip(req.params.id);
  if (!trip) throw httpError(404, 'TRIP_NOT_FOUND', 'That trip does not exist.');
  if (!canAccessTrip(req, trip)) throw httpError(403, 'NOT_OWNER', 'This trip belongs to someone else.');
  deleteTrip(trip.id);
  res.json({ deleted: true });
});
