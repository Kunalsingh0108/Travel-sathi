/**
 * External routing integration.
 *
 * Uses the public OSRM demo server (no API key) to obtain a real distance,
 * duration and polyline for a day's stops. If the service is unreachable,
 * rate-limited or returns nothing, we fall back to a clearly labelled
 * straight-line estimate instead of inventing route data.
 */
import { haversineKm, estimateTravelMinutes, TRANSPORT_LABEL } from '../utils/geo.js';

const OSRM_BASE = process.env.OSRM_URL || 'https://router.project-osrm.org';
const TIMEOUT_MS = 6000;

function withTimeout(ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { controller, timer };
}

async function osrmRequest(coords) {
  const path = coords.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url = `${OSRM_BASE}/route/v1/driving/${path}?overview=full&geometries=geojson&alternatives=false`;
  const { controller, timer } = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes || !json.routes.length) throw new Error('OSRM returned no route');
    const route = json.routes[0];
    return {
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      minutes: Math.max(1, Math.round(route.duration / 60)),
      geometry: route.geometry || null,
    };
  } finally {
    clearTimeout(timer);
  }
}

function estimatedLegs(points) {
  const legs = [];
  for (let i = 1; i < points.length; i += 1) {
    const from = points[i - 1];
    const to = points[i];
    const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
    legs.push({
      from: from.name || `Stop ${i}`,
      to: to.name || `Stop ${i + 1}`,
      distanceKm: Number(km.toFixed(2)),
      minutes: estimateTravelMinutes(from, to, 'taxi'),
      source: 'estimate',
    });
  }
  return legs;
}

/**
 * Returns { source: 'osrm' | 'estimated', totalKm, totalMinutes, legs, geometry, notice }.
 */
export async function routeForDay(day, start, mode = 'taxi') {
  const points = [start, ...day.activities.filter((a) => a.lat).map((a) => ({ lat: a.lat, lng: a.lng, name: a.name }))]
    .filter((p) => p && typeof p.lat === 'number');

  if (points.length < 2) {
    return { source: 'none', totalKm: 0, totalMinutes: 0, legs: [], geometry: null, notice: 'Not enough stops to route.' };
  }

  try {
    const route = await osrmRequest(points.map((p) => [p.lng, p.lat]));
    const raw = [];
    for (let i = 1; i < points.length; i += 1) {
      raw.push({
        from: points[i - 1].name || 'Stay',
        to: points[i].name || `Stop ${i}`,
        km: haversineKm(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng),
      });
    }
    const sumKm = raw.reduce((s, l) => s + l.km, 0) || 1;
    const legs = raw.map((l) => ({
      from: l.from,
      to: l.to,
      distanceKm: Number(((l.km / sumKm) * route.distanceKm).toFixed(2)),
      minutes: Math.max(1, Math.round(((l.km / sumKm) * route.minutes))),
      source: 'osrm-split',
      note: 'Leg split from the real road total (per-leg OSRM calls would be N requests).',
    }));
    return {
      source: 'osrm',
      totalKm: route.distanceKm,
      totalMinutes: route.minutes,
      legs,
      geometry: route.geometry,
      notice: `Actual road route from OSRM (OpenStreetMap data) for ${TRANSPORT_LABEL[mode] || 'driving'}. Per-stop minutes are proportional splits of that total.`,
    };
  } catch (err) {
    const legs = estimatedLegs(points);
    const totalKm = Number(legs.reduce((s, l) => s + l.distanceKm, 0).toFixed(2));
    const totalMinutes = legs.reduce((s, l) => s + l.minutes, 0);
    return {
      source: 'estimated',
      totalKm,
      totalMinutes,
      legs,
      geometry: null,
      notice: 'Routing service unavailable - showing straight-line estimates, not real road distances.',
      error: String(err.message || err),
    };
  }
}

/** Health probe used by the admin page's integration status card. */
export async function routingStatus() {
  try {
    const { controller, timer } = withTimeout(4000);
    const res = await fetch(`${OSRM_BASE}/route/v1/driving/77.20,28.61;77.25,28.63?overview=false`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return { name: 'OSRM routing', ok: res.ok, detail: res.ok ? 'reachable' : `HTTP ${res.status}` };
  } catch (err) {
    return { name: 'OSRM routing', ok: false, detail: `unreachable (${err.message || 'network error'}) - estimates will be used` };
  }
}
