import { Router } from 'express';
import { overview, destinations, setDestinationEnabled } from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(requireAdmin);
router.get('/overview', overview);
router.get('/destinations', destinations);
router.patch('/destinations/:id', setDestinationEnabled);

export default router;
