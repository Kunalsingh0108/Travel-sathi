import { DESTINATIONS, getDestination } from '../data/destinations.js';
import { tripStats, getMetrics, getDisabled, setDisabled } from '../services/storage.js';
import { routingStatus } from '../services/routing.js';
import { llmStatus } from '../services/llm.js';
import { asyncHandler, httpError } from '../middleware/error.js';

/** GET /api/admin/overview - metrics + integration status, no secrets. */
export const overview = asyncHandler(async (req, res) => {
  const trips = tripStats();
  const metrics = getMetrics();
  const integrations = [routingStatus(), llmStatus(), {
    name: 'File-backed store',
    ok: true,
    detail: 'server/data/store/*.json (equivalent simple backend database)',
  }];

  res.json({
    metrics: {
      trips: trips.trips,
      sharedTrips: trips.shared,
      destinationsUsed: trips.destinations,
      trackedErrors: metrics.errorCount,
      datasetDestinations: DESTINATIONS.length,
      datasetAttractions: DESTINATIONS.reduce((sum, d) => sum + d.attractions.length, 0),
    },
    recentErrors: metrics.errors,
    integrations,
    adminConfigured: Boolean(process.env.ADMIN_TOKEN),
    llm: llmStatus().detail,
  });
});

/** GET /api/admin/destinations - dataset inventory. */
export const destinations = asyncHandler(async (req, res) => {
  const disabled = getDisabled();
  res.json({
    destinations: DESTINATIONS.map((d) => ({
      id: d.id,
      name: d.name,
      region: d.region,
      attractions: d.attractions.length,
      categories: [...new Set(d.attractions.map((a) => a.category))],
      perNight: d.costs.perNight,
      foodPerDay: d.costs.foodPerDay,
      enabled: !disabled.includes(d.id),
    })),
  });
});

/** PATCH /api/admin/destinations/:id - enable or disable a destination. */
export const setDestinationEnabled = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const enabled = Boolean(req.body?.enabled);
  if (!getDestination(id)) throw httpError(404, 'DESTINATION_NOT_FOUND', 'No such destination.');
  const disabled = getDisabled();
  const next = enabled ? disabled.filter((x) => x !== id) : [...new Set([...disabled, id])];
  setDisabled(next);
  res.json({ id, enabled: !next.includes(id), disabled: next });
});