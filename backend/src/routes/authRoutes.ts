import { Router } from 'express';
import { standaloneLoginHandler, whatsappAutologinHandler } from '../controllers/authController';

const router = Router();

router.get('/whatsapp', whatsappAutologinHandler);
router.post('/standalone', standaloneLoginHandler);

export default router;
