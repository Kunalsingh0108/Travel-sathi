import { TRANSPORT_LABEL } from '../utils/geo.js';

/** Per-person per-day local transport estimates (INR). */
export const TRANSPORT_DAY_RATE = {
  walk: 0,
  public: 250,
  scooter: 300,
  taxi: 900,
  'self-drive': 900,
};

const OTHER_RATE = 0.1; // 10% contingency on the subtotal

const round = (n) => Math.round(n);

/**
 * Budget calculation.
 * Accommodation, food and local transport are derived consistently from
 * party size and trip length; attraction/activity costs are summed from the
 * actual itinerary so totals update when activities change.
 * Every number returned is an ESTIMATE.
 */
export function computeBudget(itinerary, preferences) {
  const prefs = preferences || itinerary?.preferences || {};
  const travellers = Math.max(1, Number(prefs.travellers) || 1);
  const days = Math.max(1, (itinerary?.days || []).length || Number(prefs.tripDays) || 1);
  const nights = Math.max(0, days - 1);
  const rooms = Math.ceil(travellers / 2);

  const destinationId = prefs.destination;
  const perNight = Number(prefs.perNightRate) || 0;
  const foodPerDay = Number(prefs.foodPerDay) || 0;

  const accommodation = round(rooms * nights * perNight);
  const food = round(days * travellers * foodPerDay);
  const transportRate = TRANSPORT_DAY_RATE[prefs.transport] ?? TRANSPORT_DAY_RATE.taxi;
  const localTransport = round(days * travellers * transportRate);

  let attractions = 0;
  let otherActivities = 0;
  let mealsIncluded = 0;
  for (const day of itinerary?.days || []) {
    for (const act of day.activities || []) {
      if (act.costIncludedIn === 'food') {
        mealsIncluded += 1;
        continue;
      }
      const cost = Number(act.cost) || 0;
      if (act.kind === 'attraction') attractions += cost;
      else otherActivities += cost;
    }
  }

  const subtotal = accommodation + food + localTransport + attractions + otherActivities;
  const other = round(subtotal * OTHER_RATE);
  const total = subtotal + other;

  const budgetLimit = Number(prefs.budget) || null;
  const remaining = budgetLimit === null ? null : budgetLimit - total;
  const overBudget = remaining !== null && remaining < 0;

  return {
    currency: 'INR',
    estimate: true,
    estimateNote: 'All costs are estimates generated from sample data, not live prices.',
    travellers,
    days,
    nights,
    rooms,
    lines: [
      { key: 'accommodation', label: `Accommodation (${nights} night${nights === 1 ? '' : 's'}, ${rooms} room${rooms === 1 ? '' : 's'})`, amount: accommodation },
      { key: 'food', label: `Food (${days} day${days === 1 ? '' : 's'} x ${travellers} traveller${travellers === 1 ? '' : 's'})`, amount: food, note: `${mealsIncluded} planned meal breaks included` },
      { key: 'localTransport', label: `Local transport (${TRANSPORT_LABEL[prefs.transport] || 'Taxi'})`, amount: localTransport },
      { key: 'attractions', label: 'Attractions & activities', amount: attractions },
      { key: 'other', label: 'Other / contingency (10%)', amount: other },
    ],
    otherActivities,
    accommodation,
    food,
    localTransport,
    attractions,
    other,
    subtotal,
    total,
    perPerson: round(total / travellers),
    budgetLimit,
    remaining,
    overBudget,
    flexible: Boolean(prefs.budgetFlexible),
  };
}
