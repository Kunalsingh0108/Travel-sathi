import { Router } from 'express';
import {
  listMine, createTrip, getTripById, updateTrip, shareTrip, duplicateTrip, removeTrip,
} from '../controllers/trips.controller.js';

const router = Router();

router.get('/', listMine);
router.post('/', createTrip);
router.get('/:id', getTripById);
router.put('/:id', updateTrip);
router.post('/:id/share', shareTrip);
router.post('/:id/duplicate', duplicateTrip);
router.delete('/:id', removeTrip);

export default router;
