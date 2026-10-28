import { DESTINATIONS, INTERESTS } from '../data/destinations.js';
import { isValidDate, parseTime, diffDays } from '../utils/time.js';

export const TRANSPORT_MODES = ['walk', 'public', 'scooter', 'taxi', 'self-drive'];
export const PACES = ['relaxed', 'balanced', 'packed'];
export const MAX_TRIP_DAYS = 21;

function fail(field, message) {
  return { field, message };
}

/**
 * Validates and normalises raw form input.
 * Returns { values, errors }. Never trusts the client: everything used by the
 * generator comes out of here.
 */
export function validatePreferences(raw = {}) {
  const errors = [];
  const input = typeof raw === 'object' && raw !== null ? raw : {};

  const destination = String(input.destination || '').trim();
  const dest = DESTINATIONS.find((d) => d.id === destination);
  if (!dest) errors.push(fail('destination', 'Choose a supported destination.'));

  const startDate = String(input.startDate || '').trim();
  const endDate = String(input.endDate || '').trim();
  if (!isValidDate(startDate)) errors.push(fail('startDate', 'Start date must be a valid date (YYYY-MM-DD).'));
  if (!isValidDate(endDate)) errors.push(fail('endDate', 'End date must be a valid date (YYYY-MM-DD).'));

  let tripDays = 0;
  if (isValidDate(startDate) && isValidDate(endDate)) {
    tripDays = diffDays(startDate, endDate) + 1;
    if (tripDays < 1) errors.push(fail('endDate', 'End date must be on or after the start date.'));
    else if (tripDays > MAX_TRIP_DAYS) errors.push(fail('endDate', `Trips are limited to ${MAX_TRIP_DAYS} days in this demo.`));
  }

  const travellersRaw = Number(input.travellers);
  if (!Number.isInteger(travellersRaw) || travellersRaw < 1 || travellersRaw > 20) {
    errors.push(fail('travellers', 'Number of travellers must be a whole number between 1 and 20.'));
  }

  const stayLocation = String(input.stayLocation || '').trim().slice(0, 80);

  let budget = null;
  if (input.budget !== undefined && input.budget !== null && String(input.budget).trim() !== '') {
    budget = Number(input.budget);
    if (!Number.isFinite(budget) || budget <= 0) {
      errors.push(fail('budget', 'Budget must be a positive number in INR.'));
    } else if (budget > 5000000) {
      errors.push(fail('budget', 'Budget looks too large (max ₹50,00,000).'));
    } else {
      budget = Math.round(budget);
    }
  }
  const budgetFlexible = Boolean(input.budgetFlexible);

  const interests = Array.isArray(input.interests)
    ? [...new Set(input.interests.map((i) => String(i)))].filter((i) => INTERESTS.includes(i))
    : [];
  if (interests.length > 8) errors.push(fail('interests', 'Select at most 8 interests.'));

  const pace = String(input.pace || 'balanced');
  if (!PACES.includes(pace)) errors.push(fail('pace', 'Pace must be Relaxed, Balanced or Packed.'));

  const transport = String(input.transport || 'taxi');
  if (!TRANSPORT_MODES.includes(transport)) errors.push(fail('transport', 'Choose a supported transport preference.'));

  const dayStart = String(input.dayStart || '09:00');
  const dayEnd = String(input.dayEnd || '21:00');
  const startMin = parseTime(dayStart);
  const endMin = parseTime(dayEnd);
  if (Number.isNaN(startMin)) errors.push(fail('dayStart', 'Start time must look like HH:MM.'));
  if (Number.isNaN(endMin)) errors.push(fail('dayEnd', 'End time must look like HH:MM.'));
  if (!Number.isNaN(startMin) && !Number.isNaN(endMin) && endMin <= startMin) {
    errors.push(fail('dayEnd', 'Daily end time must be after the start time.'));
  }

  let mustVisit = [];
  if (input.mustVisit !== undefined && input.mustVisit !== null) {
    const rawList = Array.isArray(input.mustVisit)
      ? input.mustVisit
      : String(input.mustVisit).split(',').map((s) => s.trim()).filter(Boolean);
    mustVisit = rawList.map((s) => String(s).slice(0, 80)).slice(0, 10);
  }

  const values = {
    destination,
    destinationName: dest ? dest.name : destination,
    startDate,
    endDate,
    tripDays,
    travellers: travellersRaw,
    stayLocation,
    budget,
    budgetFlexible,
    interests,
    pace,
    transport,
    dayStart,
    dayEnd,
    mustVisit,
  };

  return { values, errors };
}