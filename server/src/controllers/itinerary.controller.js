import { validatePreferences } from '../services/validation.js';
import { generateItinerary, refreshDerived } from '../services/generator.js';
import { replan, EXAMPLE_PROMPTS } from '../services/replan.js';
import { removeActivity, addAttraction, moveActivity, changeTime, bad, assertValid } from '../services/edits.js';
import { validateItinerary } from '../services/schedule.js';
import { computeBudget } from '../services/budget.js';
import { routeForDay } from '../services/routing.js';
import { getDestination } from '../data/destinations.js';
import { asyncHandler, httpError } from '../middleware/error.js';
import { getDisabled } from '../services/storage.js';

function ensureEnabled(destinationId) {
  if (getDisabled().includes(destinationId)) {
    throw httpError(400, 'DESTINATION_DISABLED', 'That destination is currently switched off by an administrator.');
  }
}

export const generate = asyncHandler(async (req, res) => {
  const { values, errors } = validatePreferences(req.body?.preferences ?? req.body);
  if (errors.length) {
    throw httpError(400, 'INVALID_PREFERENCES', 'Please fix the highlighted fields.');
  }
  ensureEnabled(values.destination);
  const itinerary = generateItinerary(values);
  res.json({ itinerary, prompts: EXAMPLE_PROMPTS });
});

export const replanItinerary = asyncHandler(async (req, res) => {
  const { itinerary, request } = req.body || {};
  if (!itinerary?.days?.length) throw httpError(400, 'NO_ITINERARY', 'Generate an itinerary first.');
  const result = await replan(itinerary, request);
  res.json(result);
});

export const editItinerary = asyncHandler(async (req, res) => {
  const { itinerary, action } = req.body || {};
  if (!itinerary?.days?.length) throw httpError(400, 'NO_ITINERARY', 'Generate an itinerary first.');
  if (!action || typeof action.type !== 'string') throw bad('BAD_ACTION', 'Missing edit action.');

  let result;
  switch (action.type) {
    case 'remove':
      result = assertValid(removeActivity(itinerary, action.activityId));
      break;
    case 'add':
      result = assertValid(addAttraction(itinerary, action.attractionId, action.dayNumber));
      break;
    case 'move':
      result = assertValid(moveActivity(itinerary, action.activityId, action.dayNumber));
      break;
    case 'setTime':
      result = assertValid(changeTime(itinerary, action.activityId, action.startTime));
      break;
    case 'recalculate':
      result = { itinerary: refreshDerived(JSON.parse(JSON.stringify(itinerary))), message: 'Totals recalculated.', changes: [] };
      break;
    default:
      throw bad('BAD_ACTION', `Unknown edit action "${action.type}".`);
  }
  res.json({ ...result, validation: result.itinerary.validation, budget: result.itinerary.budget });
});

export const validateItineraryHandler = asyncHandler(async (req, res) => {
  const { itinerary } = req.body || {};
  const validation = validateItinerary(itinerary || null);
  const budget = itinerary ? computeBudget(itinerary, itinerary.preferences) : null;
  res.json({ validation, budget });
});

export const dayRoute = asyncHandler(async (req, res) => {
  const { itinerary, dayNumber, mode } = req.body || {};
  if (!itinerary?.days?.length) throw httpError(400, 'NO_ITINERARY', 'Generate an itinerary first.');
  const day = itinerary.days.find((d) => d.dayNumber === Number(dayNumber));
  if (!day) throw bad('BAD_DAY', 'That day does not exist.');
  const start = itinerary.stayPosition || { lat: getDestination(itinerary.destinationId)?.lat, lng: getDestination(itinerary.destinationId)?.lng, name: 'Stay' };
  const result = await routeForDay(day, { ...start, name: start.name || 'Stay' }, mode || itinerary.preferences?.transport || 'taxi');
  res.json(result);
});
