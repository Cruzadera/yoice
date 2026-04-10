import { Request, Response } from 'express';
import prisma from '../services/db';

const buildResults = (
  options: Array<{
    id: string;
    user: {
      id: string;
      name: string | null;
      phone: string | null;
      avatarColor: string | null;
      avatarImage: string | null;
    };
  }>,
  votes: Array<{
    optionId: string;
    user: {
      id: string;
      name: string | null;
      phone: string | null;
      avatarColor: string | null;
      avatarImage: string | null;
    };
  }>
) => {
  const ranking = new Map<
    string,
    {
      optionId: string;
      label: string;
      userId: string;
      avatarColor: string | null;
      avatarImage: string | null;
      votes: number;
      voters: Array<{
        id: string;
        name: string;
        avatarColor: string | null;
        avatarImage: string | null;
      }>;
    }
  >();

  for (const option of options) {
    ranking.set(option.id, {
      optionId: option.id,
      label: option.user.name || option.user.phone || 'Participante',
      userId: option.user.id,
      avatarColor: option.user.avatarColor,
      avatarImage: option.user.avatarImage,
      votes: 0,
      voters: []
    });
  }

  for (const vote of votes) {
    const current = ranking.get(vote.optionId) ?? {
      optionId: vote.optionId,
      label: vote.optionId,
      userId: '',
      avatarColor: null,
      avatarImage: null,
      votes: 0,
      voters: []
    };

    current.votes += 1;
    current.voters.push({
      id: vote.user.id,
      name: vote.user.name || vote.user.phone || 'Participante',
      avatarColor: vote.user.avatarColor,
      avatarImage: vote.user.avatarImage
    });
    ranking.set(vote.optionId, current);
  }

  return Array.from(ranking.values()).sort((left, right) => right.votes - left.votes);
};

export const getPollHandler = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  try {
    const poll = await prisma.poll.findUnique({
      where: { id: req.params.pollId },
      include: {
        question: true,
        options: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatarColor: true,
                avatarImage: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                avatarColor: true,
                avatarImage: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!poll) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }

    const userVote = poll.votes.find((vote) => vote.userId === req.auth?.user.id) ?? null;

    return res.json({
      id: poll.id,
      currentUserId: req.auth.user.id,
      question: poll.question.text,
      questionMeta: {
        id: poll.question.id,
        category: poll.question.category,
        selectionType: poll.question.selectionType,
        nsfw: poll.question.nsfw,
        active: poll.question.active
      },
      options: poll.options.map((option) => ({
        id: option.id,
        userId: option.user.id,
        label: option.user.name || option.user.phone,
        user: option.user
      })),
      expiresAt: poll.expiresAt,
      createdAt: poll.createdAt,
      expired: !!poll.expiresAt && poll.expiresAt.getTime() < Date.now(),
      userVote,
      results: buildResults(poll.options, poll.votes)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener la encuesta', error });
  }
};
