/** Small geo helpers: distance, travel-time estimation, point formatting. */

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Average operating speed in km/h per transport mode (estimate only). */
export const TRANSPORT_SPEED = {
  walk: 4.5,
  public: 20,
  scooter: 24,
  taxi: 30,
  'self-drive': 32,
};

export const TRANSPORT_LABEL = {
  walk: 'Walking',
  public: 'Local public transport',
  scooter: 'Scooter / bike',
  taxi: 'Taxi / cab',
  'self-drive': 'Self-drive',
};

/**
 * Estimated travel time in whole minutes between two points.
 * Straight-line distance only - clearly labelled as an estimate in the UI.
 */
export function estimateTravelMinutes(from, to, mode = 'taxi') {
  if (!from || !to) return 0;
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const speed = TRANSPORT_SPEED[mode] || 30;
  const minutes = (km / speed) * 60 + 5; // +5 min for stop/boarding overhead
  return Math.max(5, Math.round(minutes / 5) * 5);
}
