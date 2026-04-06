import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../services/db';
import { createAutologinToken, deriveAuthKey, verifyAutologinToken } from '../utils/token';

const buildAccessResponse = (
  token: string,
  pollId: string,
  user: {
    id: string;
    authKey: string | null;
    name: string | null;
    avatarColor: string | null;
    avatarImage: string | null;
    createdAt: Date;
  },
  poll: {
    id: string;
    question: {
      id: string;
      text: string;
      category: string;
      selectionType: string;
      nsfw: boolean;
      active: boolean;
    };
    options: Array<{
      id: string;
      user: {
        id: string;
        name: string | null;
        phone: string | null;
        avatarColor?: string | null;
        avatarImage?: string | null;
      };
    }>;
    expiresAt: Date | null;
    createdAt: Date;
  }
) => {
  const nextStep = user.name ? 'poll' : 'onboarding';

  return {
    nextStep,
    redirectTo:
      nextStep === 'poll'
        ? `/poll/${pollId}?token=${encodeURIComponent(token)}`
        : `/onboarding?pollId=${encodeURIComponent(pollId)}&token=${encodeURIComponent(token)}`,
    token,
    user: {
      id: user.id,
      authKey: user.authKey,
      name: user.name,
      avatarColor: user.avatarColor,
      avatarImage: user.avatarImage,
      createdAt: user.createdAt
    },
    poll
  };
};

export const whatsappAutologinHandler = async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const pollId = typeof req.query.pollId === 'string' ? req.query.pollId : '';

  if (!token || !pollId) {
    return res.status(400).json({ message: 'token y pollId son obligatorios' });
  }

  try {
    const payload = verifyAutologinToken(token);
    const authKey = deriveAuthKey(payload.sub);

    const [user, poll] = await Promise.all([
      prisma.user.upsert({
        where: { authKey },
        update: {},
        create: { authKey }
      }),
      prisma.poll.findUnique({
        where: { id: pollId },
        select: {
          id: true,
          expiresAt: true,
          createdAt: true,
          question: {
            select: {
              id: true,
              text: true,
              category: true,
              selectionType: true,
              nsfw: true,
              active: true
            }
          },
          options: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  avatarColor: true,
                  avatarImage: true
                }
              }
            }
          }
        }
      })
    ]);

    if (!poll) {
      return res.status(404).json({ message: 'Encuesta no encontrada' });
    }

    return res.json(buildAccessResponse(token, pollId, user, poll));
  } catch (error) {
    return res.status(401).json({ message: 'No se pudo autenticar el acceso desde WhatsApp', error });
  }
};

export const standaloneLoginHandler = async (req: Request, res: Response) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({ message: 'El nombre es obligatorio en modo standalone' });
  }

  try {
    const subject = `standalone:${crypto.randomUUID()}`;
    const authKey = deriveAuthKey(subject);
    const token = createAutologinToken(subject);
    const user = await prisma.user.upsert({
      where: { authKey },
      update: { name },
      create: {
        authKey,
        name
      }
    });

    return res.json({
      nextStep: 'groupLobby',
      token,
      user: {
        id: user.id,
        authKey: user.authKey,
        name: user.name,
        avatarColor: user.avatarColor,
        avatarImage: user.avatarImage,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'No se pudo iniciar el acceso standalone', error });
  }
};
