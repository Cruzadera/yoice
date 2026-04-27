import { Router } from 'express';
import {
	standaloneLoginHandler,
	startEmailLoginHandler,
	verifyEmailLoginHandler,
	autologinHandler
} from '../controllers/authController';

const router = Router();

router.get('/autologin', autologinHandler);
router.post('/standalone', standaloneLoginHandler);
router.post('/email/start', startEmailLoginHandler);
router.get('/email/verify', verifyEmailLoginHandler);

export default router;
