import { Router } from 'express';
import { createGroupHandler, joinGroupHandler } from '../controllers/groupController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, createGroupHandler);
router.post('/join', requireAuth, joinGroupHandler);

export default router;
