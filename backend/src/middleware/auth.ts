import { NextFunction, Request, Response } from 'express';
import { resolveSessionUser } from '../services/authSession';
import { verifyAutologinToken } from '../utils/token';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        token: string;
        authKey: string;
        user: {
          id: string;
          authKey: string | null;
          email: string | null;
          name: string | null;
          avatarColor: string | null;
          avatarImage: string | null;
          createdAt: Date;
        };
      };
    }
  }
}

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  if (typeof req.query.token === 'string') {
    return req.query.token;
  }

  if (typeof req.body?.token === 'string') {
    return req.body.token;
  }

  return null;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: 'Falta token de autenticación' });
    }

    const payload = verifyAutologinToken(token);
    const { authKey, user } = await resolveSessionUser(payload);

    req.auth = {
      token,
      authKey,
      user
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado', error });
  }
};
