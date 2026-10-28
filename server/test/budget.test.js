import test from 'node:test';
import assert from 'node:assert/strict';
import { computeBudget, TRANSPORT_DAY_RATE } from '../src/services/budget.js';
import { generateItinerary, refreshDerived } from '../src/services/generator.js';

const prefs = {
  destination: 'goa',
  startDate: '2026-11-10',
  endDate: '2026-11-12',
  tripDays: 3,
  travellers: 4,
  stayLocation: '',
  budget: 60000,
  budgetFlexible: false,
  interests: ['beaches'],
  pace: 'balanced',
  transport: 'scooter',
  dayStart: '09:00',
  dayEnd: '21:00',
};

test('accommodation, food and transport scale with party size and duration', () => {
  const itinerary = generateItinerary(prefs);
  const budget = itinerary.budget;

  assert.equal(budget.days, 3);
  assert.equal(budget.nights, 2);
  assert.equal(budget.rooms, 2); // ceil(4 / 2)

  const expectedAccommodation = 2 * 2 * 3400; // rooms * nights * Goa per-night
  assert.equal(budget.accommodation, expectedAccommodation);
  assert.equal(budget.food, 3 * 4 * 1300); // days * travellers * food per day
  assert.equal(budget.localTransport, 3 * 4 * TRANSPORT_DAY_RATE.scooter);

  assert.equal(budget.currency, 'INR');
  assert.equal(budget.estimate, true);
});

test('total is the sum of its parts including the 10% contingency', () => {
  const itinerary = generateItinerary(prefs);
  const b = itinerary.budget;
  const lineSum = b.accommodation + b.food + b.localTransport + b.attractions + b.other;
  assert.equal(b.total, lineSum);
  assert.equal(b.other, Math.round(b.subtotal * 0.1));
  assert.equal(b.perPerson, Math.round(b.total / 4));
});

test('attraction costs come from the itinerary, so edits change the total', () => {
  const itinerary = generateItinerary({ ...prefs, destination: 'jaipur', interests: ['history'] });
  const before = itinerary.budget.total;
  const firstAttraction = itinerary.days
    .flatMap((d) => d.activities)
    .find((a) => a.kind === 'attraction' && a.cost > 0);
  assert.ok(firstAttraction, 'expected a paid attraction');

  const edited = JSON.parse(JSON.stringify(itinerary));
  const day = edited.days.find((d) => d.activities.some((a) => a.id === firstAttraction.id));
  day.activities = day.activities.filter((a) => a.id !== firstAttraction.id);
  refreshDerived(edited);

  assert.ok(edited.budget.total < before, 'removing a paid stop must lower the total');
  assert.equal(edited.budget.attractions,
    itinerary.budget.attractions - firstAttraction.cost);
});

test('flags an over-budget trip and computes the remaining amount', () => {
  const cheap = generateItinerary({ ...prefs, budget: 60000 });
  assert.equal(cheap.budget.overBudget, false);
  assert.ok(cheap.budget.remaining > 0);

  const tiny = generateItinerary({ ...prefs, budget: 1000 });
  assert.equal(tiny.budget.overBudget, true);
  assert.ok(tiny.budget.remaining < 0);
  assert.equal(tiny.budget.remaining, 1000 - tiny.budget.total);
});

test('a trip with no budget limit reports null remaining, not a fake number', () => {
  const itinerary = generateItinerary({ ...prefs, budget: null });
  assert.equal(itinerary.budget.budgetLimit, null);
  assert.equal(itinerary.budget.remaining, null);
  assert.equal(itinerary.budget.overBudget, false);
});

test('every budget line is labelled as an estimate', () => {
  const itinerary = generateItinerary(prefs);
  assert.match(itinerary.budget.estimateNote, /estimates/i);
  assert.ok(itinerary.budget.lines.length >= 5);
  for (const line of itinerary.budget.lines) {
    assert.ok(typeof line.amount === 'number' && !Number.isNaN(line.amount));
  }
});