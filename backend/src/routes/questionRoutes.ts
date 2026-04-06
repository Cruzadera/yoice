import { Router } from 'express';
import { getQuestionsHandler } from '../controllers/questionController';

const router = Router();

router.get('/', getQuestionsHandler);

export default router;
