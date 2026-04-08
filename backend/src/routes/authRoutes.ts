import { Router } from 'express';
import {
	standaloneLoginHandler,
	startEmailLoginHandler,
	verifyEmailLoginHandler,
	whatsappAutologinHandler
} from '../controllers/authController';

const router = Router();

router.get('/whatsapp', whatsappAutologinHandler);
router.post('/standalone', standaloneLoginHandler);
router.post('/email/start', startEmailLoginHandler);
router.get('/email/verify', verifyEmailLoginHandler);

export default router;
