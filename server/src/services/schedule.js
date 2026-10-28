import { parseTime, dateRange, weekdayIndex } from '../utils/time.js';
import { getDestination } from '../data/destinations.js';

function issue(severity, message, extra = {}) {
  return { severity, message, ...extra };
}

/**
 * Structural validation of an itinerary.
 * Returns { valid, errors, warnings, issues }.
 * Used by the generator after building, by the API before saving, and by tests.
 */
export function validateItinerary(itinerary) {
  const issues = [];
  if (!itinerary || !Array.isArray(itinerary.days) || itinerary.days.length === 0) {
    return {
      valid: false,
      errors: [issue('error', 'Itinerary has no days.')],
      warnings: [],
      issues: [issue('error', 'Itinerary has no days.')],
    };
  }

  const prefs = itinerary.preferences || {};
  const allowedDates = dateRange(prefs.startDate, prefs.endDate);

  for (const day of itinerary.days) {
    const dayNo = day.dayNumber;
    if (allowedDates.length && !allowedDates.includes(day.date)) {
      issues.push(issue('error', `Day ${dayNo} date ${day.date} is outside the trip dates.`, { day: dayNo }));
    }
    const weekday = weekdayIndex(day.date);
    const activities = [...(day.activities || [])].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

    let previousEnd = null;
    let previousId = null;
    for (const act of activities) {
      const start = parseTime(act.startTime);
      const end = parseTime(act.endTime);

      if (Number.isNaN(start) || Number.isNaN(end)) {
        issues.push(issue('error', `Day ${dayNo} has an activity with an invalid time.`, { day: dayNo, activityId: act.id }));
        continue;
      }
      if (end <= start) {
        issues.push(issue('error', `Day ${dayNo}: "${act.name}" ends before it starts.`, { day: dayNo, activityId: act.id }));
      }
      if (previousEnd !== null && start < previousEnd) {
        issues.push(
          issue('error', `Day ${dayNo}: "${act.name}" overlaps "${previousId}".`, { day: dayNo, activityId: act.id }),
        );
      }
      previousEnd = Math.max(previousEnd || 0, end);
      previousId = act.name;

      if (prefs.dayStart && prefs.dayEnd) {
        const wStart = parseTime(prefs.dayStart);
        const wEnd = parseTime(prefs.dayEnd);
        if (start < wStart) {
          issues.push(issue('warning', `Day ${dayNo}: "${act.name}" starts before your preferred day start (${prefs.dayStart}).`, { day: dayNo, activityId: act.id }));
        }
        if (end > wEnd) {
          issues.push(issue('warning', `Day ${dayNo}: "${act.name}" ends after your preferred day end (${prefs.dayEnd}).`, { day: dayNo, activityId: act.id }));
        }
      }

      if (act.kind !== 'meal' && act.closedDays && act.closedDays.includes(weekday)) {
        issues.push(issue('error', `Day ${dayNo}: "${act.name}" is normally closed on ${day.date}.`, { day: dayNo, activityId: act.id }));
      }
      if (act.openingHours && act.openingHours.close && act.kind !== 'meal') {
        const close = parseTime(act.openingHours.close);
        if (end > close) {
          issues.push(
            issue('warning', `Day ${dayNo}: "${act.name}" may run past its listed closing time (${act.openingHours.close}).`, { day: dayNo, activityId: act.id }),
          );
        }
      }
    }

    if (activities.length === 0) {
      issues.push(issue('warning', `Day ${dayNo} has no activities.`, { day: dayNo }));
    }
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return { valid: errors.length === 0, errors, warnings, issues };
}

/** True when the itinerary can be saved (no hard errors). */
export function isSchedulable(itinerary) {
  return validateItinerary(itinerary).valid;
}

/** Find overlap explanations for a single day (used by the edit UI). */
export function dayConflicts(day, dayStart, dayEnd) {
  const out = [];
  const acts = [...(day.activities || [])].sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  for (let i = 1; i < acts.length; i += 1) {
    if (parseTime(acts[i].startTime) < parseTime(acts[i - 1].endTime)) {
      out.push(`"${acts[i].name}" overlaps "${acts[i - 1].name}".`);
    }
  }
  const start = parseTime(dayStart);
  const end = parseTime(dayEnd);
  if (!Number.isNaN(start) && acts.length && parseTime(acts[0].startTime) < start) {
    out.push(`First activity starts before ${dayStart}.`);
  }
  if (!Number.isNaN(end) && acts.length) {
    const lastEnd = parseTime(acts[acts.length - 1].endTime);
    if (lastEnd > end) out.push(`Last activity ends after ${dayEnd}.`);
  }
  return out;
}

/** Attraction ids that are closed on a given weekday. */
export function isClosedOn(attraction, date) {
  if (!attraction.closedDays || attraction.closedDays.length === 0) return false;
  return attraction.closedDays.includes(weekdayIndex(date));
}

export function destinationExists(destinationId) {
  return Boolean(getDestination(destinationId));
}
