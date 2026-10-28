/**
 * Natural-language replanning.
 *
 * 1. If an LLM is configured it turns the request into a structured command.
 *    (services/llm.js)
 * 2. Otherwise a small transparent rule-based parser handles a fixed set of
 *    commands - and we TELL the user that is what happened.
 * 3. Whatever produced the command, it is applied by services/edits.js and
 *    re-validated before it ever reaches the client.
 */
import { validatePreferences } from './validation.js';
import { refreshDerived } from './generator.js';
import { removeActivity, addAttraction, reduceDay, bad, assertValid } from './edits.js';
import { INTERESTS, getDestination } from '../data/destinations.js';
import { llmConfigured, interpretWithLLM } from './llm.js';
import { parseTime } from '../utils/time.js';

export const EXAMPLE_PROMPTS = [
  'Make Day 2 less busy.',
  'Add more local food experiences.',
  'Reduce the total budget.',
  'Include more nature activities.',
];

const RULES = [
  { intent: 'less_busy', re: /\b(?:less|lighter|free|relax).*?\bday\s*(\d+)\b|\bday\s*(\d+)\b.*\b(?:less|lighter|free|relax)\b/i },
  { intent: 'add_food', re: /\b(food|eat|cuisine|restaurant|culinary|snack)\b/i },
  { intent: 'reduce_budget', re: /\b(budget|cheaper|less\s+money|spend\s+less|cut\s+cost)\b/i },
  { intent: 'add_nature', re: /\b(nature|park|lake|forest|waterfall|mountain|scenic)\b/i },
  { intent: 'add_history', re: /\b(history|historical|fort|palace|museum|heritage|temple|monument)\b/i },
  { intent: 'add_beaches', re: /\b(beach|sea|coast|sand)\b/i },
  { intent: 'add_culture', re: /\b(culture|art|craft|local|tradition|dance)\b/i },
  { intent: 'add_adventure', re: /\b(adventure|trek|hike|rafting|sport|thrill)\b/i },
  { intent: 'add_shopping', re: /\b(shopping|market|bazaar|souvenir|shop)\b/i },
  { intent: 'add_relaxation', re: /\b(relax|spa|rest|slow|quiet)\b/i },
  { intent: 'make_busier', re: /\b(more|busier|busy|fuller|packed)\b/i },
];

function parseWithRules(text) {
  const lower = text.toLowerCase();
  const dayMatch = /day\s*(\d+)/i.exec(text);
  const dayNumber = dayMatch ? Number(dayMatch[1]) : null;
  const amountMatch = /(\d+)\s+(?:more|stops|activities|things)/i.exec(text);
  const amount = amountMatch ? Math.min(3, Number(amountMatch[1])) : 1;

  for (const rule of RULES) {
    const match = rule.re.exec(text);
    if (match) {
      const dayFromRule = match[1] || match[2] ? Number(match[1] || match[2]) : dayNumber;
      return { intent: rule.intent, dayNumber: dayFromRule, amount, reason: 'matched a built-in rule' };
    }
  }
  if (/\b(nature|food|history)\b/i.test(lower)) return { intent: 'unknown', dayNumber, amount, reason: 'no rule matched' };
  return { intent: 'unknown', dayNumber, amount, reason: 'no rule matched' };
}

function categoryForIntent(intent) {
  const map = {
    add_food: 'food',
    add_nature: 'nature',
    add_history: 'history',
    add_beaches: 'beaches',
    add_culture: 'culture',
    add_adventure: 'adventure',
    add_shopping: 'shopping',
    add_relaxation: 'relaxation',
  };
  return map[intent] || null;
}

function freeAttractions(itinerary, category) {
  const used = new Set(itinerary.days.flatMap((d) => d.activities.map((a) => a.attractionId).filter(Boolean)));
  const dest = getDestination(itinerary.destinationId);
  if (!dest) return [];
  return dest.attractions
    .filter((a) => !used.has(a.id))
    .filter((a) => (category ? a.category === category || (a.tags || []).includes(category) : true))
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

function addByCategory(itinerary, category, amount) {
  const pool = freeAttractions(itinerary, category);
  if (!pool.length) {
    return { itinerary, message: `No unused ${category} spots left in the dataset for ${itinerary.destinationName}. Try removing something first.`, changes: [] };
  }
  const changes = [];
  let working = itinerary;
  const wanted = Math.max(1, amount);
  for (let i = 0; i < Math.min(wanted, pool.length); i += 1) {
    const candidate = pool[i];
    // Prefer the day with the fewest activities.
    const target = [...working.days].sort((a, b) => a.attractionCount - b.attractionCount)[0];
    try {
      const result = assertValid(addAttraction(working, candidate.id, target.dayNumber));
      working = result.itinerary;
      changes.push(...result.changes);
    } catch (err) {
      if (err.code === 'NO_SPACE') continue;
      throw err;
    }
  }
  if (!changes.length) {
    return { itinerary, message: 'No free time slots left to add anything without creating a conflict.', changes: [] };
  }
  return {
    itinerary: working,
    message: `Added ${changes.length} ${category} stop${changes.length === 1 ? '' : 's'}: ${changes.map((c) => c.name).join(', ')}.`,
    changes,
  };
}

function applyBudgetReduction(itinerary) {
  const budget = itinerary.budget || {};
  if (!budget.budgetLimit) {
    const target = Math.round(budget.total * 0.85);
    let working = itinerary;
    let guard = 0;
    const changes = [];
    while (working.budget.total > target && guard < 6) {
      guard += 1;
      const priciest = working.days
        .flatMap((d) => d.activities.filter((a) => a.kind === 'attraction'))
        .sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];
      if (!priciest || !priciest.cost) break;
      const result = assertValid(removeActivity(working, priciest.id));
      working = result.itinerary;
      changes.push({ type: 'remove', name: priciest.name, reason: `costs about ₹${priciest.cost}` });
    }
    return {
      itinerary: working,
      message: changes.length
        ? `No budget limit was set, so trimmed the priciest stops to cut roughly 15%: ${changes.map((c) => c.name).join(', ')}.`
        : 'Nothing expensive left to remove.',
      changes,
    };
  }

  let working = itinerary;
  const changes = [];
  let guard = 0;
  while (working.budget.overBudget && guard < 8) {
    guard += 1;
    const priciest = working.days
      .flatMap((d) => d.activities.filter((a) => a.kind === 'attraction'))
      .sort((a, b) => (b.cost || 0) - (a.cost || 0))[0];
    if (!priciest || !priciest.cost) break;
    const result = assertValid(removeActivity(working, priciest.id));
    working = result.itinerary;
    changes.push({ type: 'remove', name: priciest.name, reason: `saves about ₹${priciest.cost}` });
  }
  if (!changes.length) {
    return {
      itinerary,
      message: working.budget.overBudget
        ? 'The plan is already down to free/low-cost stops; reduce accommodation class or dates to go lower.'
        : 'You are already within budget - no changes needed.',
      changes: [],
    };
  }
  return {
    itinerary: working,
    message: `Removed ${changes.length} paid stop${changes.length === 1 ? '' : 's'} (${changes.map((c) => c.name).join(', ')}) to fit the budget. Now ${working.budget.overBudget ? 'still over by ₹' + Math.abs(working.budget.remaining) : 'under budget by ₹' + working.budget.remaining}.`,
    changes,
  };
}

function applyCommand(itinerary, command) {
  const { intent, dayNumber, amount } = command;

  if (intent === 'unknown') {
    throw bad('UNSUPPORTED_REQUEST',
      'I could not map that to an action I can perform. Try one of the example requests.');
  }

  if (intent === 'less_busy') {
    const day = dayNumber || 1;
    if (!itinerary.days.some((d) => d.dayNumber === day)) throw bad('BAD_DAY', `Day ${day} does not exist.`);
    const result = assertValid(reduceDay(itinerary, day));
    return { ...result, intent };
  }

  if (intent === 'reduce_budget') {
    const result = applyBudgetReduction(itinerary);
    return { ...result, intent };
  }

  if (intent === 'make_busier') {
    const category = null;
    const result = addByCategory(itinerary, category, amount || 1);
    return { ...result, intent };
  }

  const category = categoryForIntent(intent);
  if (category) {
    const result = addByCategory(itinerary, category, amount || 1);
    return { ...result, intent };
  }

  throw bad('UNSUPPORTED_REQUEST', 'That request is not supported by the fallback planner.');
}

/**
 * Entry point for POST /api/itinerary/replan.
 * @returns {Promise<{itinerary, message, changes, mode, intent, reason}>}
 */
export async function replan(itinerary, requestText) {
  const text = String(requestText || '').trim();
  if (!text) throw bad('EMPTY_REQUEST', 'Type a replanning request first.');
  if (text.length > 400) throw bad('TOO_LONG', 'Keep the request under 400 characters.');

  let command = null;
  let mode = 'rule-based';
  let reason = 'Parsed by the built-in rule parser (no LLM key configured).';

  if (llmConfigured()) {
    command = await interpretWithLLM(text);
    if (command) {
      mode = 'llm-interpreted';
      reason = 'Interpreted by the configured LLM, then validated and applied by the server.';
    } else {
      reason = 'LLM is configured but the request could not be interpreted, so the rule parser was used.';
    }
  }
  if (!command) command = parseWithRules(text);

  if (command.intent === 'less_busy' && !command.dayNumber) command.dayNumber = 1;
  if (!command.intent.startsWith('add_') && !['less_busy', 'reduce_budget', 'make_busier', 'unknown'].includes(command.intent)) {
    command.intent = 'unknown';
  }

  const result = applyCommand(itinerary, command);
  refreshDerived(result.itinerary);

  return {
    itinerary: result.itinerary,
    message: result.message,
    changes: result.changes || [],
    mode,
    intent: command.intent,
    reason,
    llmConfigured: llmConfigured(),
    validation: result.itinerary.validation,
  };
}

export { parseWithRules, INTERESTS, validatePreferences, parseTime };
