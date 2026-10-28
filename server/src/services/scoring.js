import { haversineKm } from '../utils/geo.js';

/**
 * Simple transparent ranking score in [0, 1].
 *
 * Components (weights are deliberately small in number so the algorithm stays
 * explainable in a college project report):
 *   0.40 interest match
 *   0.20 popularity (sample data rating)
 *   0.15 budget fit (cheap = better)
 *   0.15 proximity to the current position
 *   0.10 duration fit for the chosen pace / remaining window
 */
export function scoreAttraction(attraction, preferences, context = {}) {
  const interests = preferences.interests || [];
  const { position = null, remainingMinutes = Infinity } = context;

  const tags = attraction.tags || [];
  const hits = tags.filter((t) => interests.includes(t)).length;
  const interestScore = interests.length === 0
    ? (attraction.popularity || 3) / 10 + 0.4
    : Math.min(1, hits / Math.max(1, Math.min(2, interests.length)));

  const popularityScore = (attraction.popularity || 3) / 5;

  const budget = Number(preferences.budget) || 0;
  const travellers = Number(preferences.travellers) || 1;
  const days = Number(preferences.tripDays) || 1;
  let budgetScore = 0.7;
  if (budget > 0) {
    const perPersonDayBudget = budget / (travellers * days);
    const cost = attraction.costPerPerson || 0;
    if (cost === 0) budgetScore = 1;
    else if (cost <= perPersonDayBudget * 0.25) budgetScore = 0.9;
    else if (cost <= perPersonDayBudget * 0.6) budgetScore = 0.6;
    else budgetScore = 0.25;
  }

  let proximityScore = 0.7;
  if (position) {
    const km = haversineKm(position.lat, position.lng, attraction.lat, attraction.lng);
    proximityScore = 1 / (1 + km / 6);
  }

  const duration = attraction.durationMin || 60;
  let durationScore = 0.7;
  if (Number.isFinite(remainingMinutes)) {
    if (duration <= remainingMinutes) durationScore = 1;
    else if (duration <= remainingMinutes * 1.25) durationScore = 0.4;
    else durationScore = 0.05;
  }

  const total =
    0.4 * interestScore +
    0.2 * popularityScore +
    0.15 * budgetScore +
    0.15 * proximityScore +
    0.1 * durationScore;

  return {
    score: Number(total.toFixed(4)),
    parts: {
      interestScore: Number(interestScore.toFixed(2)),
      popularityScore: Number(popularityScore.toFixed(2)),
      budgetScore: Number(budgetScore.toFixed(2)),
      proximityScore: Number(proximityScore.toFixed(2)),
      durationScore: Number(durationScore.toFixed(2)),
    },
  };
}

export function rankAttractions(attractions, preferences, context) {
  return attractions
    .map((a) => ({ attraction: a, ...scoreAttraction(a, preferences, context) }))
    .sort((x, y) => y.score - x.score);
}
