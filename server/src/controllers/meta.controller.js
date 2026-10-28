import { DESTINATIONS, INTEREST_LABELS } from '../data/destinations.js';
import { getDisabled } from '../services/storage.js';
import { TRANSPORT_LABEL } from '../utils/geo.js';
import { TRANSPORT_MODES, PACES } from '../services/validation.js';
import { EXAMPLE_PROMPTS } from '../services/replan.js';
import { llmStatus } from '../services/llm.js';
import { asyncHandler } from '../middleware/error.js';

/** Public app metadata consumed by the form and the plan page. */
export const appMeta = asyncHandler(async (req, res) => {
  const disabled = getDisabled();
  res.json({
    destinations: DESTINATIONS
      .filter((d) => !disabled.includes(d.id))
      .map((d) => ({
        id: d.id,
        name: d.name,
        region: d.region,
        lat: d.lat,
        lng: d.lng,
        blurb: d.blurb,
        bestSeason: d.bestSeason,
        attractionCount: d.attractions.length,
        attractions: d.attractions.map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          district: a.district,
          costPerPerson: a.costPerPerson,
          durationMin: a.durationMin,
        })),
      })),
    interests: Object.entries(INTEREST_LABELS).map(([id, label]) => ({ id, label })),
    paces: PACES,
    transport: TRANSPORT_MODES.map((id) => ({ id, label: TRANSPORT_LABEL[id] })),
    replanExamples: EXAMPLE_PROMPTS,
    aiMode: llmStatus().detail,
    dataNotice: 'Attraction details come from a curated sample dataset, not a live source.',
  });
});