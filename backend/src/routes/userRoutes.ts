import { Router } from 'express';
import { getCurrentUserHandler, updateUserNameHandler, updateUserProfileHandler } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, getCurrentUserHandler);
router.post('/name', requireAuth, updateUserNameHandler);
router.post('/profile', requireAuth, updateUserProfileHandler);

export default router;
