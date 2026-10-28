import { Router } from 'express';
import { appMeta } from '../controllers/meta.controller.js';

const router = Router();

router.get('/app', appMeta);

export default router;
