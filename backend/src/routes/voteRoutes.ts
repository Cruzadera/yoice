import { Router } from 'express';
import { createVoteHandler } from '../controllers/voteController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, createVoteHandler);

export default router;
