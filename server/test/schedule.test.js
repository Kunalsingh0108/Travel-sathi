import test from 'node:test';
import assert from 'node:assert/strict';
import { validateItinerary, dayConflicts, isClosedOn } from '../src/services/schedule.js';
import { generateItinerary } from '../src/services/generator.js';

const prefs = {
  destination: 'jaipur',
  startDate: '2026-12-01',
  endDate: '2026-12-02',
  tripDays: 2,
  travellers: 2,
  stayLocation: '',
  budget: 30000,
  interests: ['history'],
  pace: 'relaxed',
  transport: 'taxi',
  dayStart: '09:00',
  dayEnd: '20:00',
};

function goodItinerary() {
  return generateItinerary(prefs);
}

test('a generated itinerary passes validation', () => {
  const result = validateItinerary(goodItinerary());
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.deepEqual(result.errors, []);
});

test('detects overlapping activities', () => {
  const it = goodItinerary();
  const day = it.days[0];
  day.activities[0].startTime = '09:00';
  day.activities[0].endTime = '12:00';
  day.activities[1].startTime = '11:00';
  day.activities[1].endTime = '12:00';
  const result = validateItinerary(it);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => /overlaps/i.test(e.message)));
});

test('detects an activity that ends before it starts', () => {
  const it = goodItinerary();
  it.days[0].activities[0].startTime = '14:00';
  it.days[0].activities[0].endTime = '13:00';
  const result = validateItinerary(it);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => /ends before it starts/i.test(e.message)));
});

test('detects days outside the trip date range', () => {
  const it = goodItinerary();
  it.days[1].date = '2027-01-01';
  const result = validateItinerary(it);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => /outside the trip dates/i.test(e.message)));
});

test('warns when a day has no activities', () => {
  const it = goodItinerary();
  it.days[1].activities = [];
  const result = validateItinerary(it);
  assert.ok(result.warnings.some((w) => /no activities/i.test(w.message)));
});

test('warns when something runs past the closing time', () => {
  const it = goodItinerary();
  const day = it.days[0];
  const withHours = day.activities.find((a) => a.openingHours);
  assert.ok(withHours, 'expected an attraction with known hours');
  withHours.endTime = '23:30';
  const result = validateItinerary(it);
  assert.ok(result.warnings.some((w) => /past its listed closing time/i.test(w.message)));
});

test('rejects an empty itinerary', () => {
  const result = validateItinerary({ days: [] });
  assert.equal(result.valid, false);
});

test('dayConflicts reports overlaps and window breaches', () => {
  const day = {
    activities: [
      { name: 'A', startTime: '08:00', endTime: '10:00' },
      { name: 'B', startTime: '09:30', endTime: '11:00' },
      { name: 'C', startTime: '21:30', endTime: '22:30' },
    ],
  };
  const conflicts = dayConflicts(day, '09:00', '21:00');
  assert.ok(conflicts.some((c) => /overlaps/i.test(c)));
  assert.ok(conflicts.some((c) => /before 09:00/i.test(c)));
  assert.ok(conflicts.some((c) => /after 21:00/i.test(c)));
});

test('isClosedOn honours the dataset closing days', () => {
  const taj = { closedDays: [5] };
  assert.equal(isClosedOn(taj, '2026-11-13'), true); // Friday
  assert.equal(isClosedOn(taj, '2026-11-14'), false); // Saturday
  assert.equal(isClosedOn({ closedDays: [] }, '2026-11-13'), false);
});