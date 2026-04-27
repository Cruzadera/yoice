import { Router } from 'express';
import { createPollFromQuestionPoolHandler, ensureDailyPollHandler } from '../controllers/pollAdminController';
import { getPollHandler } from '../controllers/pollController';

const router = Router();

router.post('/generate', createPollFromQuestionPoolHandler);
router.post('/ensure-daily', ensureDailyPollHandler);
router.get('/:pollId', getPollHandler);

export default router;
