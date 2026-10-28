import { Router } from 'express';
import { doRegister, doLogin, doLogout, me, authStatus } from '../controllers/auth.controller.js';

const router = Router();

router.get('/status', authStatus);
router.post('/register', doRegister);
router.post('/login', doLogin);
router.post('/logout', doLogout);
router.get('/me', me);

export default router;
