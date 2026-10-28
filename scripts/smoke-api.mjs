/**
 * API smoke test: generate -> replan -> edit -> save -> share -> reload.
 * Run with the server up:  node scripts/smoke-api.mjs
 */
const BASE = process.env.API_URL || 'http://localhost:4000';

const ownerToken = `owner_smoke_${Date.now()}`;
const headers = { 'content-type': 'application/json', 'x-owner-token': ownerToken };

const asJson = async (res) => {
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
};

const step = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` - ${extra}` : ''}`);
  if (!ok) process.exitCode = 1;
};

const main = async () => {
  const health = await asJson(await fetch(`${BASE}/api/health`));
  step('health', health.status === 200 && health.body.ok === true);

  // 1. generate
  const gen = await asJson(await fetch(`${BASE}/api/itinerary/generate`, {
    method: 'POST', headers,
    body: JSON.stringify({
      preferences: {
        destination: 'goa', startDate: '2026-11-10', endDate: '2026-11-12',
        travellers: 2, stayLocation: 'Calangute', budget: 30000, interests: ['beaches', 'food'],
        pace: 'balanced', transport: 'scooter', dayStart: '09:00', dayEnd: '21:00',
      },
    }),
  }));
  step('generate itinerary', gen.status === 200 && gen.body.itinerary?.days?.length === 3);
  let itinerary = gen.body.itinerary;

  // 2. replan (rule-based fallback)
  const replan = await asJson(await fetch(`${BASE}/api/itinerary/replan`, {
    method: 'POST', headers,
    body: JSON.stringify({ itinerary, request: 'Make Day 1 less busy.' }),
  }));
  step('replan: make day less busy', replan.status === 200 && replan.body.mode === 'rule-based',
    replan.body.message || replan.body.error?.message);
  step('replan is honest about not being AI', replan.body.llmConfigured === false && /rule/i.test(replan.body.reason));
  itinerary = replan.body.itinerary || itinerary;

  // 3. add a supported attraction (tries candidates until one fits a free slot)
  const dest = await asJson(await fetch(`${BASE}/api/meta/app`));
  const goa = dest.body.destinations.find((d) => d.id === 'goa');
  const onTrip = new Set(itinerary.days.flatMap((d) => d.activities.map((a) => a.attractionId)));
  const candidates = goa.attractions.filter((a) => !onTrip.has(a.id));
  let added = null;
  for (const candidate of candidates) {
    const res = await asJson(await fetch(`${BASE}/api/itinerary/edit`, {
      method: 'POST', headers,
      body: JSON.stringify({ itinerary, action: { type: 'add', attractionId: candidate.id, dayNumber: 2 } }),
    }));
    if (res.status === 200) { added = { res, candidate }; break; }
  }
  step('add a supported attraction', Boolean(added),
    added ? added.res.body.message : 'every candidate reported NO_SPACE');
  if (added?.res.body.itinerary) itinerary = added.res.body.itinerary;

  // 4. remove an activity
  const firstAct = itinerary.days[0].activities.find((a) => a.kind === 'attraction');
  const remove = await asJson(await fetch(`${BASE}/api/itinerary/edit`, {
    method: 'POST', headers,
    body: JSON.stringify({ itinerary, action: { type: 'remove', activityId: firstAct.id } }),
  }));
  step('remove activity', remove.status === 200, remove.body.message || remove.body.error?.message);
  if (remove.body.itinerary) itinerary = remove.body.itinerary;

  // 5. routing (OSRM online -> real route, offline -> labelled estimate)
  const route = await asJson(await fetch(`${BASE}/api/itinerary/route`, {
    method: 'POST', headers,
    body: JSON.stringify({ itinerary, dayNumber: 2, mode: 'scooter' }),
  }));
  step('day route returned with a source label', route.status === 200 && ['osrm', 'estimated'].includes(route.body.source),
    `source=${route.body.source}, ${route.body.totalKm} km, ${route.body.totalMinutes} min`);

  // 6. save trip
  const save = await asJson(await fetch(`${BASE}/api/trips`, {
    method: 'POST', headers,
    body: JSON.stringify({ itinerary, title: 'Smoke test trip' }),
  }));
  step('save trip', save.status === 201, save.body.trip?.id || save.body.error?.message);
  const tripId = save.body.trip?.id;
  if (!tripId) return;

  // 7. owner can list and read it
  const list = await asJson(await fetch(`${BASE}/api/trips`, { headers }));
  step('owner lists own trips', list.status === 200 && list.body.trips.some((t) => t.id === tripId));
  const read = await asJson(await fetch(`${BASE}/api/trips/${tripId}`, { headers }));
  step('owner reads trip', read.status === 200 && read.body.access === 'owner');

  // 8. a stranger cannot read it
  const stranger = await asJson(await fetch(`${BASE}/api/trips/${tripId}`, {
    headers: { ...headers, 'x-owner-token': 'owner_someone_else' },
  }));
  step('stranger denied without share link', stranger.status === 403);

  // 9. enable sharing, then a read-only visitor can read it
  const share = await asJson(await fetch(`${BASE}/api/trips/${tripId}/share`, {
    method: 'POST', headers, body: JSON.stringify({ shared: true }),
  }));
  step('share link created', share.status === 200 && Boolean(share.body.shareId));
  const sharedRead = await asJson(await fetch(`${BASE}/api/trips/${tripId}?share=${share.body.shareId}`));
  step('share link reads trip', sharedRead.status === 200 && sharedRead.body.access === 'shared');

  // 10. duplicate + revoke
  const dup = await asJson(await fetch(`${BASE}/api/trips/${tripId}/duplicate`, { method: 'POST', headers }));
  step('duplicate trip', dup.status === 201 && dup.body.trip?.title?.includes('(copy)'));
  const revoke = await asJson(await fetch(`${BASE}/api/trips/${tripId}/share`, {
    method: 'POST', headers, body: JSON.stringify({ shared: false }),
  }));
  const afterRevoke = await asJson(await fetch(`${BASE}/api/trips/${tripId}?share=${share.body.shareId}`));
  step('revoked share link no longer works', revoke.status === 200 && afterRevoke.status === 403);

  // 11. rejected invalid inputs
  const bad = await asJson(await fetch(`${BASE}/api/itinerary/generate`, {
    method: 'POST', headers, body: JSON.stringify({ preferences: { destination: 'nowhere', travellers: -3 } }),
  }));
  step('invalid preferences rejected', bad.status === 400 && bad.body.error?.code === 'INVALID_PREFERENCES');

  // 12. admin API is protected
  const adminNoToken = await asJson(await fetch(`${BASE}/api/admin/overview`));
  step('admin protected without token', adminNoToken.status === 401 || adminNoToken.status === 503,
    `status=${adminNoToken.status}`);
};

main().catch((err) => {
  console.error('FAIL  smoke run crashed:', err);
  process.exitCode = 1;
});