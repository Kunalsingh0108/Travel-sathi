import { getDestination, allAttractions, findAttraction } from '../data/destinations.js';
import { estimateTravelMinutes, haversineKm, TRANSPORT_LABEL } from '../utils/geo.js';
import {
  parseTime, formatTime, dateRange, weekdayOf, formatDate, addMinutes,
} from '../utils/time.js';
import { rankAttractions } from './scoring.js';
import { validateItinerary, isClosedOn } from './schedule.js';
import { computeBudget } from './budget.js';
import { shortId } from '../utils/ids.js';

export const PACE_TARGET = { relaxed: 3, balanced: 4, packed: 6 };
export const PACE_LABEL = { relaxed: 'Relaxed', balanced: 'Balanced', packed: 'Packed' };

const MEAL = {
  lunch: { name: 'Lunch break', kind: 'meal', start: 13 * 60 + 0, durationMin: 45, endTime: '13:45' },
  dinner: { name: 'Dinner break', kind: 'meal', start: 19 * 60 + 30, durationMin: 60, endTime: '20:30' },
};

/** Map the free-text stay location onto real coordinates when we can. */
function stayPosition(dest, stayLocation) {
  const text = String(stayLocation || '').trim().toLowerCase();
  if (text.length > 1) {
    const match = dest.attractions.find(
      (a) => a.district && a.district.toLowerCase().includes(text),
    );
    if (match) return { lat: match.lat, lng: match.lng, source: `matched "${match.district}" in sample data` };
  }
  return { lat: dest.lat, lng: dest.lng, source: 'destination centre (sample data)' };
}

function explain(activity, preferences, travelFrom) {
  const interests = preferences.interests || [];
  const matched = (activity.tags || []).filter((t) => interests.includes(t));
  const parts = [];

  if (matched.length) {
    parts.push(`matches your interest in ${matched.map((m) => m).join(' and ')}`);
  } else if (activity.popularity >= 4) {
    parts.push('one of the highest-rated places in the sample dataset');
  } else {
    parts.push('a good fit for your chosen pace');
  }

  if (travelFrom && travelFrom.km < 3) {
    parts.push(`only ${travelFrom.km.toFixed(1)} km from the previous stop`);
  }

  const hours = activity.openingHours;
  if (hours && hours.close && parseTime(hours.close) - parseTime(activity.endTime) <= 60) {
    parts.push(`closes at ${hours.close}, so it is slotted early`);
  }

  if (activity.costPerPerson === 0) parts.push('free entry');
  else if (activity.costPerPerson > 0) parts.push(`entry around ₹${activity.costPerPerson} per person`);

  return `Chosen because it ${parts.join('; ')}.`;
}

function mealActivity(type, timeMinutes, travellers) {
  const m = MEAL[type];
  const perPerson = type === 'lunch' ? 450 : 600;
  return {
    id: shortId('act'),
    kind: 'meal',
    attractionId: null,
    name: m.name,
    description: type === 'lunch'
      ? 'Suggested sit-down lunch break (cost covered by the food budget).'
      : 'Suggested dinner break (cost covered by the food budget).',
    startTime: formatTime(timeMinutes),
    endTime: formatTime(timeMinutes + m.durationMin),
    durationMin: m.durationMin,
    cost: 0,
    costPerPerson: 0,
    costIncludedIn: 'food',
    perPersonEstimate: perPerson,
    travellers,
    travelMinutesFromPrev: 0,
    travelKm: 0,
    explanation: 'Meal break inserted to keep the day realistic.',
    dataStatus: 'estimate',
    tags: ['food'],
  };
}

/**
 * Fill one day with attractions in chronological order.
 * Greedy: at each step pick the highest scoring candidate that still fits the
 * day window, opening hours and the pace target.
 */
function planDay({ dest, preferences, date, position, used, travellers, tripDayIndex, maxCount }) {
  const windowStart = parseTime(preferences.dayStart || '09:00');
  const windowEnd = parseTime(preferences.dayEnd || '21:00');
  const paceTarget = PACE_TARGET[preferences.pace] || 4;
  // Never spend more of the dataset in one day than can be shared across the
  // days that remain, so a 4-day trip does not empty out on the last day.
  const target = Math.max(1, Math.min(paceTarget, maxCount ?? paceTarget));
  const weekday = weekdayOf(date);

  const activities = [];
  let cursor = windowStart;
  let lunchPlaced = false;
  let dinnerPlaced = false;
  const skipped = [];

  // Recomputed on every pass so stops already placed on this day are excluded.
  const rankedFor = () => {
    const remaining = windowEnd - cursor;
    const candidates = dest.attractions
      .filter((a) => !used.has(a.id))
      .filter((a) => !isClosedOn(a, date));
    return rankAttractions(candidates, preferences, { position, remainingMinutes: remaining });
  };

  let guard = 0;
  while (activities.filter((a) => a.kind === 'attraction').length < target && guard < 40) {
    guard += 1;
    const ranked = rankedFor();
    if (!ranked.length) break;

    let placed = false;
    let rejection = null;
    for (const candidate of ranked) {
      const a = candidate.attraction;
      const travelMinutes = estimateTravelMinutes(position, a, preferences.transport || 'taxi');
      const travelKm = haversineKm(position.lat, position.lng, a.lat, a.lng);
      const open = a.hours ? parseTime(a.hours.open) : null;
      const close = a.hours ? parseTime(a.hours.close) : null;

      // --- simulate first: travel, any meal break that falls inside this span,
      //     then the visit itself. Nothing is committed unless it all fits. ---
      let simCursor = cursor;
      let simStart = Math.max(simCursor + travelMinutes, open ?? 0);
      const pendingMeals = [];
      for (const [key, meal] of [['lunch', MEAL.lunch], ['dinner', MEAL.dinner]]) {
        if (key === 'lunch' ? lunchPlaced : dinnerPlaced) continue;
        if (simCursor >= meal.start) continue; // meal time already passed today
        if (windowEnd < meal.start + meal.durationMin) continue;
        if (simStart + a.durationMin <= meal.start) continue; // visit ends before it
        pendingMeals.push({ key, meal });
        simCursor = meal.start + meal.durationMin;
        simStart = Math.max(simCursor + travelMinutes, open ?? 0);
      }
      const simEnd = simStart + a.durationMin;

      if (close !== null && simEnd > close) {
        rejection = { name: a.name, reason: `it closes at ${a.hours.close} and needs ${a.durationMin} min` };
        continue;
      }
      if (simEnd > windowEnd) {
        rejection = {
          name: a.name,
          reason: `it needs ${a.durationMin} min but only ${Math.max(0, windowEnd - simStart)} min remain before ${formatTime(windowEnd)}`,
        };
        continue;
      }

      // --- commit: meals first, then the visit. ---
      for (const pending of pendingMeals) {
        activities.push(mealActivity(pending.key, pending.meal.start, travellers));
        if (pending.key === 'lunch') lunchPlaced = true;
        else dinnerPlaced = true;
      }
      const start = simStart;
      const end = simEnd;

      const act = {
        id: shortId('act'),
        kind: 'attraction',
        attractionId: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        lat: a.lat,
        lng: a.lng,
        district: a.district,
        startTime: formatTime(start),
        endTime: formatTime(end),
        durationMin: a.durationMin,
        openingHours: a.hours,
        hoursNote: a.hoursNote || null,
        closedDays: a.closedDays || [],
        costPerPerson: a.costPerPerson,
        cost: a.costPerPerson * travellers,
        costIncludedIn: null,
        travellers,
        travelMinutesFromPrev: travelMinutes,
        travelKm: Number(travelKm.toFixed(1)),
        dataStatus: a.dataStatus || 'sample',
        note: a.note || null,
        popularity: a.popularity,
        tags: a.tags || [],
        explanation: '',
      };
      act.explanation = explain(act, preferences, { km: travelKm });

      activities.push(act);
      used.add(a.id);
      position = { lat: a.lat, lng: a.lng };
      cursor = end;
      placed = true;
      break;
    }
    if (!placed) {
      if (rejection) skipped.push(rejection);
      break;
    }
  }

  // Offer a dinner break when the day has at least one stop and ends before it.
  if (windowEnd >= MEAL.dinner.start + MEAL.dinner.durationMin && !dinnerPlaced
    && activities.some((a) => a.kind === 'attraction') && cursor <= MEAL.dinner.start
    && cursor >= windowStart) {
    activities.push(mealActivity('dinner', MEAL.dinner.start, travellers));
    dinnerPlaced = true;
  }

  return { activities, skipped, position };
}

/**
 * Build a full structured itinerary from validated preferences.
 * Returns an object (never prose) so the UI, PDF export and tests all work
 * from the same data.
 */
export function generateItinerary(preferences) {
  const dest = getDestination(preferences.destination);
  if (!dest) throw Object.assign(new Error('Unknown destination.'), { status: 400, code: 'UNKNOWN_DESTINATION' });

  const dates = dateRange(preferences.startDate, preferences.endDate);
  if (!dates.length) throw Object.assign(new Error('Invalid trip date range.'), { status: 400, code: 'BAD_DATES' });

  const travellers = preferences.travellers;
  const used = new Set();
  const position = stayPosition(dest, preferences.stayLocation);
  const unscheduledNotes = [];

  const days = dates.map((date, index) => {
    // Each day starts from the stay location, as a real trip does.
    const remainingDays = dates.length - index;
    const poolLeft = dest.attractions.length - used.size;
    const evenShare = Math.ceil(poolLeft / Math.max(1, remainingDays));
    const paceTarget = PACE_TARGET[preferences.pace] || 4;
    const maxCount = Math.max(1, Math.min(paceTarget, Math.max(evenShare, Math.ceil(paceTarget / 2))));
    const result = planDay({ dest, preferences, date, position, used, travellers, tripDayIndex: index, maxCount });
    const attractions = result.activities.filter((a) => a.kind === 'attraction');
    const dayCost = attractions.reduce((sum, a) => sum + (a.cost || 0), 0);
    const travelTotal = attractions.reduce((sum, a) => sum + (a.travelMinutesFromPrev || 0), 0);
    if (result.skipped.length) {
      unscheduledNotes.push(
        ...result.skipped.map((s) => `Day ${index + 1}: skipped ${s.name} - ${s.reason}.`),
      );
    }
    return {
      dayNumber: index + 1,
      date,
      weekday: weekdayOf(date),
      label: `Day ${index + 1}`,
      dateLabel: formatDate(date, { long: true }),
      activities: result.activities,
      attractionCount: attractions.length,
      start: result.activities[0]?.startTime || preferences.dayStart,
      end: result.activities[result.activities.length - 1]?.endTime || preferences.dayEnd,
      travelMinutes: travelTotal,
      estimatedCost: dayCost,
      scheduleStatus: attractions.length >= (PACE_TARGET[preferences.pace] || 4) ? 'full' : 'light',
    };
  });

  const itinerary = {
    id: shortId('itin'),
    title: `${dest.name} — ${formatDate(dates[0])} to ${formatDate(dates[dates.length - 1])}`,
    destinationId: dest.id,
    destinationName: dest.name,
    destinationRegion: dest.region,
    preferences,
    stayPosition: position,
    days,
    generation: {
      method: 'deterministic scoring + greedy scheduling',
      dataset: 'curated sample dataset (server/src/data/destinations.js)',
      verifiedLive: false,
      notice: 'Attraction details, costs and opening hours are sample estimates. They are not verified against a live source.',
      pace: PACE_LABEL[preferences.pace] || 'Balanced',
      unscheduledNotes,
    },
    createdAt: new Date().toISOString(),
  };

  const budget = computeBudget(itinerary, {
    ...preferences,
    perNightRate: dest.costs.perNight,
    foodPerDay: dest.costs.foodPerDay,
    tripDays: dates.length,
  });
  itinerary.budget = budget;

  const validation = validateItinerary(itinerary);
  itinerary.validation = validation;

  return itinerary;
}

/** Recompute budget + validation after the user edits an itinerary. */
export function refreshDerived(itinerary) {
  const dest = getDestination(itinerary.destinationId);
  const prefs = itinerary.preferences || {};
  itinerary.budget = computeBudget(itinerary, {
    ...prefs,
    perNightRate: dest?.costs.perNight || 0,
    foodPerDay: dest?.costs.foodPerDay || 0,
    tripDays: itinerary.days.length,
  });
  itinerary.validation = validateItinerary(itinerary);
  return itinerary;
}

export { findAttraction, allAttractions, TRANSPORT_LABEL };