import test from 'node:test';
import assert from 'node:assert/strict';
import { generateItinerary } from '../src/services/generator.js';
import { getDestination } from '../src/data/destinations.js';
import { parseTime } from '../src/utils/time.js';

const basePrefs = {
  destination: 'goa',
  startDate: '2026-11-10',
  endDate: '2026-11-13',
  tripDays: 4,
  travellers: 2,
  stayLocation: 'Calangute',
  budget: 40000,
  budgetFlexible: false,
  interests: ['beaches', 'food'],
  pace: 'balanced',
  transport: 'taxi',
  dayStart: '09:00',
  dayEnd: '21:00',
  mustVisit: [],
};

test('generates one day per trip date in chronological order', () => {
  const itinerary = generateItinerary(basePrefs);
  assert.equal(itinerary.days.length, 4);
  assert.deepEqual(itinerary.days.map((d) => d.date), [
    '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13',
  ]);
  assert.deepEqual(itinerary.days.map((d) => d.dayNumber), [1, 2, 3, 4]);
  assert.equal(itinerary.destinationId, 'goa');
});

test('every day has activities sorted by start time with no overlaps', () => {
  const itinerary = generateItinerary(basePrefs);
  for (const day of itinerary.days) {
    assert.ok(day.activities.length >= 2, `Day ${day.dayNumber} should have activities`);
    const times = day.activities.map((a) => parseTime(a.startTime));
    for (let i = 1; i < day.activities.length; i += 1) {
      assert.ok(times[i] >= parseTime(day.activities[i - 1].endTime),
        `Day ${day.dayNumber}: ${day.activities[i].name} starts before the previous activity ends`);
    }
    assert.deepEqual(times, [...times].sort((a, b) => a - b));
  }
});

test('activities stay inside the requested day window', () => {
  const itinerary = generateItinerary({ ...basePrefs, dayStart: '08:30', dayEnd: '20:00' });
  for (const day of itinerary.days) {
    for (const act of day.activities) {
      assert.ok(parseTime(act.startTime) >= parseTime('08:30'), `${act.name} starts too early`);
      assert.ok(parseTime(act.endTime) <= parseTime('20:00'), `${act.name} ends too late`);
    }
  }
});

test('meal breaks are inserted and marked as food-budget items', () => {
  const itinerary = generateItinerary(basePrefs);
  const meals = itinerary.days.flatMap((d) => d.activities.filter((a) => a.kind === 'meal'));
  assert.ok(meals.length >= 4, 'expected at least one meal break per day');
  for (const meal of meals) {
    assert.equal(meal.costIncludedIn, 'food');
    assert.equal(meal.cost, 0);
  }
});

test('an attraction is never scheduled twice', () => {
  const itinerary = generateItinerary({ ...basePrefs, pace: 'packed' });
  const ids = itinerary.days.flatMap((d) => d.activities.map((a) => a.attractionId).filter(Boolean));
  assert.equal(ids.length, new Set(ids).size, 'duplicate attraction scheduled');
});

test('only attractions from the selected destination appear', () => {
  const itinerary = generateItinerary(basePrefs);
  const allowed = new Set(getDestination('goa').attractions.map((a) => a.id));
  for (const act of itinerary.days.flatMap((d) => d.activities)) {
    if (act.attractionId) assert.ok(allowed.has(act.attractionId), `${act.name} is not in Goa`);
  }
});

test('pace controls how many stops a day gets', () => {
  const single = { ...basePrefs, destination: 'jaipur', startDate: '2026-12-01', endDate: '2026-12-01', tripDays: 1 };
  const relaxed = generateItinerary({ ...single, pace: 'relaxed' });
  const packed = generateItinerary({ ...single, pace: 'packed' });
  assert.equal(relaxed.days[0].attractionCount, 3);
  assert.ok(packed.days[0].attractionCount > relaxed.days[0].attractionCount,
    'packed must fit more stops than relaxed');
  // A packed day can still stop short of the target when the window is full -
  // the generator must never schedule past the day end.
  for (const act of packed.days[0].activities) {
    assert.ok(parseTime(act.endTime) <= parseTime('21:00'), `${act.name} runs past the day end`);
  }
});

test('interests bias the selection toward matching categories', () => {
  const nature = generateItinerary({ ...basePrefs, destination: 'manali', interests: ['nature'] });
  const tags = nature.days.flatMap((d) => d.activities.flatMap((a) => a.tags || []));
  assert.ok(tags.includes('nature'), 'expected nature-tagged activities');
});

test('destinations closed on a day are skipped', () => {
  // 2026-11-13 is a Friday; the Taj Mahal is closed on Fridays in the dataset.
  const itinerary = generateItinerary({
    ...basePrefs, destination: 'agra', startDate: '2026-11-13', endDate: '2026-11-13', tripDays: 1,
  });
  const day = itinerary.days[0];
  const taj = day.activities.find((a) => a.attractionId === 'agra-taj');
  assert.equal(taj, undefined, 'Taj Mahal must not be scheduled on a Friday');
});

test('generation labels its output as sample, unverified data', () => {
  const itinerary = generateItinerary(basePrefs);
  assert.equal(itinerary.generation.verifiedLive, false);
  assert.match(itinerary.generation.notice, /not verified/i);
});

test('rejects an unknown destination', () => {
  assert.throws(() => generateItinerary({ ...basePrefs, destination: 'atlantis' }), /Unknown destination/);
});