import { Router } from 'express';
import { createPollFromQuestionPoolHandler, ensureDailyPollHandler } from '../controllers/pollAdminController';
import { getPollHandler } from '../controllers/pollController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/generate', createPollFromQuestionPoolHandler);
router.post('/ensure-daily', ensureDailyPollHandler);
router.get('/:pollId', requireAuth, getPollHandler);

export default router;
