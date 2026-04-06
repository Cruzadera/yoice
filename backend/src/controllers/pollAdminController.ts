import { Request, Response } from 'express';
import { createPollFromActiveQuestion, ensureDailyPoll } from '../services/pollFactory';

export const createPollFromQuestionPoolHandler = async (_req: Request, res: Response) => {
  try {
    const poll = await createPollFromActiveQuestion();
    return res.status(201).json(poll);
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear la poll desde preguntas activas', error });
  }
};

export const ensureDailyPollHandler = async (_req: Request, res: Response) => {
  try {
    const poll = await ensureDailyPoll();
    return res.json(poll);
  } catch (error) {
    return res.status(500).json({ message: 'Error al asegurar la poll diaria', error });
  }
};
