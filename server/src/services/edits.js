/**
 * Structured itinerary edits.
 * Every edit is applied on the server, then re-validated, so the client can
 * never persist an itinerary that fails schedule validation.
 */
import { findAttraction } from '../data/destinations.js';
import { estimateTravelMinutes, haversineKm } from '../utils/geo.js';
import { parseTime, formatTime } from '../utils/time.js';
import { refreshDerived } from './generator.js';
import { PACE_TARGET } from './generator.js';

function clone(itinerary) {
  return JSON.parse(JSON.stringify(itinerary));
}

function findDay(itinerary, dayNumber) {
  return itinerary.days.find((d) => d.dayNumber === Number(dayNumber)) || null;
}

function conflictFree(day) {
  const acts = [...day.activities].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  for (let i = 1; i < acts.length; i += 1) {
    if (parseTime(acts[i].startTime) < parseTime(acts[i - 1].endTime)) return false;
  }
  return true;
}

/** Remove an activity by id. */
export function removeActivity(itinerary, activityId) {
  const copy = clone(itinerary);
  let removed = null;
  for (const day of copy.days) {
    const idx = day.activities.findIndex((a) => a.id === activityId);
    if (idx >= 0) {
      [removed] = day.activities.splice(idx, 1);
      day.attractionCount = day.activities.filter((a) => a.kind === 'attraction').length;
      break;
    }
  }
  if (!removed) throw bad('ACTIVITY_NOT_FOUND', 'That activity is not part of this itinerary.');
  refreshDerived(copy);
  return {
    itinerary: copy,
    message: `Removed "${removed.name}".`,
    changes: [{ type: 'remove', name: removed.name }],
  };
}

/** Change an activity start time; end time follows its duration. */
export function changeTime(itinerary, activityId, startTime) {
  const start = parseTime(startTime);
  if (Number.isNaN(start)) throw bad('BAD_TIME', 'Time must look like HH:MM.');
  const copy = clone(itinerary);
  let target = null;
  for (const day of copy.days) {
    const act = day.activities.find((a) => a.id === activityId);
    if (act) {
      target = { day, act };
      break;
    }
  }
  if (!target) throw bad('ACTIVITY_NOT_FOUND', 'That activity is not part of this itinerary.');
  const previous = { start: target.act.startTime, end: target.act.endTime };
  target.act.startTime = formatTime(start);
  target.act.endTime = formatTime(start + (target.act.durationMin || 60));
  target.act.travelMinutesFromPrev = 0;
  const ok = conflictFree(target.day);
  refreshDerived(copy);
  return {
    itinerary: copy,
    valid: ok,
    message: ok
      ? `Moved "${target.act.name}" to ${previous ? target.act.startTime : startTime}.`
      : `"${target.act.name}" now overlaps another activity - adjust or move it.`,
    conflicts: ok ? [] : [`"${target.act.name}" overlaps another activity on Day ${target.day.dayNumber}.`],
    changes: [{ type: 'time', name: target.act.startTime }],
  };
}

/** Move an activity to another day (re-appended before the daily end time). */
export function moveActivity(itinerary, activityId, targetDayNumber) {
  const copy = clone(itinerary);
  let moved = null;
  let fromDay = null;
  for (const day of copy.days) {
    const idx = day.activities.findIndex((a) => a.id === activityId);
    if (idx >= 0) {
      [moved] = day.activities.splice(idx, 1);
      fromDay = day;
      break;
    }
  }
  if (!moved) throw bad('ACTIVITY_NOT_FOUND', 'That activity is not part of this itinerary.');
  const target = findDay(copy, targetDayNumber);
  if (!target) throw bad('BAD_DAY', 'Target day does not exist.');

  const windowEnd = parseTime(copy.preferences.dayEnd || '21:00');
  const lastEnd = target.activities.reduce((max, a) => Math.max(max, parseTime(a.endTime)), parseTime(copy.preferences.dayStart || '09:00'));
  const start = Math.max(lastEnd, 0);
  if (start + (moved.durationMin || 60) > windowEnd) {
    throw bad('NO_SPACE', `Day ${target.dayNumber} has no room left before ${copy.preferences.dayEnd}.`);
  }
  moved.startTime = formatTime(start);
  moved.endTime = formatTime(start + (moved.durationMin || 60));
  moved.travelMinutesFromPrev = 0;
  moved.travelKm = 0;
  moved.explanation = `Moved here by you from Day ${fromDay.dayNumber}.`;
  target.activities.push(moved);
  target.activities.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

  fromDay.attractionCount = fromDay.activities.filter((a) => a.kind === 'attraction').length;
  target.attractionCount = target.activities.filter((a) => a.kind === 'attraction').length;

  refreshDerived(copy);
  return {
    itinerary: copy,
    message: `Moved "${moved.name}" from Day ${fromDay.dayNumber} to Day ${target.dayNumber}.`,
    changes: [{ type: 'move', name: moved.name, from: fromDay.dayNumber, to: target.dayNumber }],
  };
}

/** Add a supported attraction of this destination into a day. */
export function addAttraction(itinerary, attractionId, dayNumber) {
  const copy = clone(itinerary);
  const attraction = findAttraction(copy.destinationId, attractionId);
  if (!attraction) throw bad('UNKNOWN_ATTRACTION', 'That attraction is not in the dataset for this destination.');
  const target = findDay(copy, dayNumber) || copy.days[0];

  const already = copy.days.some((d) => d.activities.some((a) => a.attractionId === attractionId));
  if (already) throw bad('DUPLICATE', `${attraction.name} is already on this itinerary.`);

  const prefs = copy.preferences;
  const windowStart = parseTime(prefs.dayStart || '09:00');
  const windowEnd = parseTime(prefs.dayEnd || '21:00');
  const travellers = prefs.travellers;

  // Place it after the last activity if there is still room, otherwise try a gap.
  const lastEnd = target.activities.reduce((max, a) => Math.max(max, parseTime(a.endTime)), windowStart);
  const open = attraction.hours ? parseTime(attraction.hours.open) : null;
  const close = attraction.hours ? parseTime(attraction.hours.close) : null;
  const windowLabel = `${copy.preferences.dayStart || '09:00'}\u2013${copy.preferences.dayEnd || '21:00'}`;
  let start = Math.max(lastEnd, open ?? 0);
  if (start + attraction.durationMin > windowEnd || (close !== null && start + attraction.durationMin > close)) {
    const gap = findGap(target, attraction, windowStart, windowEnd);
    if (!gap) {
      const hours = `${Math.floor(attraction.durationMin / 60)}h${attraction.durationMin % 60 ? ` ${attraction.durationMin % 60}m` : ''}`;
      throw bad('NO_SPACE', `Day ${target.dayNumber} has no free slot of ${hours} between ${windowLabel}. Try another day or remove something first.`);
    }
    start = gap;
  }

  const prev = target.activities[target.activities.length - 1];
  const travelMinutes = prev
    ? estimateTravelMinutes({ lat: prev.lat, lng: prev.lng }, attraction, prefs.transport || 'taxi')
    : estimateTravelMinutes(copy.stayPosition, attraction, prefs.transport || 'taxi');
  const fromPoint = prev ? { lat: prev.lat, lng: prev.lng } : copy.stayPosition;

  const act = {
    id: `act_${Math.random().toString(36).slice(2, 10)}`,
    kind: 'attraction',
    attractionId: attraction.id,
    name: attraction.name,
    description: attraction.description,
    category: attraction.category,
    lat: attraction.lat,
    lng: attraction.lng,
    district: attraction.district,
    startTime: formatTime(start),
    endTime: formatTime(start + attraction.durationMin),
    durationMin: attraction.durationMin,
    openingHours: attraction.hours,
    hoursNote: attraction.hoursNote || null,
    closedDays: attraction.closedDays || [],
    costPerPerson: attraction.costPerPerson,
    cost: attraction.costPerPerson * travellers,
    costIncludedIn: null,
    travellers,
    travelMinutesFromPrev: travelMinutes,
    travelKm: Number(haversineKm(fromPoint.lat, fromPoint.lng, attraction.lat, attraction.lng).toFixed(1)),
    dataStatus: attraction.dataStatus || 'sample',
    note: attraction.note || null,
    popularity: attraction.popularity,
    tags: attraction.tags || [],
    explanation: 'Added by you. Estimated cost and timings shown from sample data.',
  };

  target.activities.push(act);
  target.activities.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  target.attractionCount = target.activities.filter((a) => a.kind === 'attraction').length;

  const ok = conflictFree(target);
  refreshDerived(copy);
  return {
    itinerary: copy,
    valid: ok,
    message: `Added "${attraction.name}" to Day ${target.dayNumber}.`,
    conflicts: ok ? [] : [`"${attraction.name}" overlaps another activity on Day ${target.dayNumber}.`],
    changes: [{ type: 'add', name: attraction.name, day: target.dayNumber }],
  };
}

function findGap(day, attraction, windowStart, windowEnd) {
  const acts = [...day.activities].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  const close = attraction.hours ? parseTime(attraction.hours.close) : windowEnd;
  const open = attraction.hours ? parseTime(attraction.hours.open) : windowStart;
  let cursor = Math.max(windowStart, open);
  for (const act of acts) {
    const gap = parseTime(act.startTime) - cursor;
    if (gap >= attraction.durationMin) return cursor;
    cursor = Math.max(cursor, parseTime(act.endTime));
  }
  if (windowEnd - cursor >= attraction.durationMin && cursor < close) return cursor;
  return null;
}

/** Trim a day down to a target number of attractions (used by "less busy"). */
export function reduceDay(itinerary, dayNumber, targetCount) {
  const copy = clone(itinerary);
  const day = findDay(copy, dayNumber);
  if (!day) throw bad('BAD_DAY', 'That day does not exist.');
  const attractions = day.activities.filter((a) => a.kind === 'attraction');
  const keep = targetCount ?? Math.max(2, Math.floor((PACE_TARGET[copy.preferences.pace] || 4) / 2));

  const removed = [];
  while (attractions.length > keep) {
    // Drop the least popular / longest item first to free the most time.
    attractions.sort((a, b) => (a.popularity || 3) - (b.popularity || 3) || b.durationMin - a.durationMin);
    const victim = attractions.shift();
    const idx = day.activities.findIndex((a) => a.id === victim.id);
    if (idx >= 0) day.activities.splice(idx, 1);
    removed.push(victim.name);
  }
  day.attractionCount = day.activities.filter((a) => a.kind === 'attraction').length;
  refreshDerived(copy);
  if (!removed.length) {
    return {
      itinerary: copy,
      message: `Day ${day.dayNumber} is already as light as it gets at this pace (${attractions.length} stop${attractions.length === 1 ? '' : 's'}). Try another day, or remove an activity yourself.`,
      changes: [],
    };
  }
  return {
    itinerary: copy,
    message: `Day ${day.dayNumber} is now lighter: removed ${removed.length} stop${removed.length === 1 ? '' : 's'} (${removed.join(', ')}).`,
    changes: removed.map((name) => ({ type: 'remove', name, day: day.dayNumber })),
  };
}

export function bad(code, message) {
  return Object.assign(new Error(message), { status: 400, code });
}

/** Validate after every mutation and throw if the result has hard errors. */
export function assertValid(result) {
  const validation = result.itinerary.validation;
  if (validation && !validation.valid) {
    throw bad('INVALID_RESULT', validation.errors.map((e) => e.message).join(' '));
  }
  return result;
}
