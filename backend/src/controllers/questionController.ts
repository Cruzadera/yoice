import { Request, Response } from 'express';
import prisma from '../services/db';

export const getQuestionsHandler = async (_req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(questions);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener las preguntas', error });
  }
};
