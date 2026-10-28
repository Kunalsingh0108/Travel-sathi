import { Router } from 'express';
import {
  generate, replanItinerary, editItinerary, validateItineraryHandler, dayRoute,
} from '../controllers/itinerary.controller.js';

const router = Router();

router.post('/generate', generate);
// Alias: /api/generate mirrors /api/itinerary/generate for client convenience
router.post('/api/generate', generate);
router.post('/itinerary/generate', generate);
router.post('/replan', replanItinerary);
router.post('/edit', editItinerary);
router.post('/validate', validateItineraryHandler);
router.post('/route', dayRoute);

export default router;
