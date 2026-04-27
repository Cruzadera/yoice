import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../services/db';

export const createVoteHandler = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  const pollId = typeof req.body?.pollId === 'string' ? req.body.pollId : '';
  const optionId = typeof req.body?.optionId === 'string' ? req.body.optionId.trim() : '';

  if (!pollId || !optionId) {
    return res.status(400).json({ message: 'pollId y optionId son obligatorios' });
  }

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        group: true,
        options: {
          select: {
            id: true,
            userId: true
          }
        }
      }
    });

    if (!poll) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }

    if (poll.groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: poll.groupId,
            userId: req.auth.user.id
          }
        },
        select: {
          id: true
        }
      });

      if (!membership) {
        return res.status(403).json({ message: 'Debes pertenecer al grupo para votar' });
      }
    }

    if (poll.expiresAt && poll.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'La encuesta ya ha expirado' });
    }

    const selectedOption = poll.options.find((option) => option.id === optionId);

    if (!selectedOption) {
      return res.status(400).json({ message: 'La opción indicada no pertenece a esta encuesta' });
    }

    if (selectedOption.userId === req.auth.user.id) {
      return res.status(400).json({ message: 'No puedes votarte a ti mismo en esta encuesta' });
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        pollId_userId: {
          pollId,
          userId: req.auth.user.id
        }
      }
    });

    if (existingVote) {
      return res.status(409).json({ message: 'Este usuario ya ha votado en la encuesta' });
    }

    const vote = await prisma.vote.create({
      data: {
        pollId,
        userId: req.auth.user.id,
        optionId,
        questionId: poll.questionId
      }
    });

    return res.status(201).json(vote);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'Este usuario ya ha votado en la encuesta' });
    }

    return res.status(500).json({ message: 'Error al registrar el voto', error });
  }
};
