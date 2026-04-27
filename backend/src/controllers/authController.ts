import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../services/db';
import { createAutologinToken, deriveAuthKey, verifyAutologinToken } from '../utils/token';
import { sendLoginEmail } from '../services/email.service';
import { pickRandomAvatarColor } from '../utils/avatarColor';

const frontendUrl = process.env.FRONTEND_URL ?? process.env.APP_URL ?? 'http://localhost:8081';
const backendPublicUrl =
  process.env.BACKEND_PUBLIC_URL ??
  process.env.API_URL ??
  process.env.BACKEND_URL ??
  `http://localhost:${process.env.PORT || 3001}`;

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const hashOneTimeToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const ensureUserAvatarColor = async <T extends { id: string; avatarColor: string | null }>(user: T) => {
  if (user.avatarColor) {
    return user;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { avatarColor: pickRandomAvatarColor() }
  });
};

const ensureMembershipFromPoll = async (userId: string, pollId: string | null) => {
  if (!pollId) {
    return null;
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { groupId: true }
  });

  if (!poll?.groupId) {
    return null;
  }

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: poll.groupId, userId } },
    update: {},
    create: { groupId: poll.groupId, userId }
  });

  return { id: poll.groupId };
};

export const autologinHandler = async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  const pollId = typeof req.query.pollId === 'string' ? req.query.pollId : '';

  if (!token) {
    return res.status(400).json({ message: 'token es obligatorio' });
  }

  try {
    const payload = verifyAutologinToken(token);
    const authKey = deriveAuthKey(payload.sub);

    let user = await prisma.user.upsert({
      where: { authKey },
      update: {},
      create: { authKey }
    });
    user = await ensureUserAvatarColor(user);

    if (pollId) {
      await ensureMembershipFromPoll(user.id, pollId);
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          select: { id: true, name: true, inviteCode: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const groups = memberships.map(({ group }) => ({
      id: group.id,
      name: group.name,
      inviteCode: group.inviteCode
    }));

    const nextStep = user.name ? 'groupList' : 'onboarding';

    return res.json({
      nextStep,
      token,
      user: {
        id: user.id,
        authKey: user.authKey,
        name: user.name,
        avatarColor: user.avatarColor,
        avatarImage: user.avatarImage,
        createdAt: user.createdAt
      },
      groups,
      pollId: pollId || null
    });
  } catch (error) {
    return res.status(401).json({ message: 'No se pudo autenticar el acceso', error });
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
    let user = await prisma.user.upsert({
      where: { authKey },
      update: { name },
      create: {
        authKey,
        name
      }
    });
    user = await ensureUserAvatarColor(user);

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

export const startEmailLoginHandler = async (req: Request, res: Response) => {
  const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : '';
  const pollId = typeof req.body?.pollId === 'string' ? req.body.pollId.trim() : '';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Email no válido.' });
  }

  try {
    const authSubject = `email:${email}`;
    const authKey = deriveAuthKey(authSubject);
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        authKey: true,
        name: true,
        avatarColor: true,
        avatarImage: true,
        createdAt: true
      }
    });

    // If the email is already known and compatible with our auth subject,
    // skip sending a new verification email and grant direct access.
    if (existingUser && (!existingUser.authKey || existingUser.authKey === authKey)) {
      let user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          authKey,
          email
        }
      });
      user = await ensureUserAvatarColor(user);

      await ensureMembershipFromPoll(user.id, pollId || null);

      const appToken = createAutologinToken(authSubject);

      return res.json({
        ok: true,
        directLogin: true,
        token: appToken,
        pollId: pollId || null,
        user: {
          id: user.id,
          authKey: user.authKey,
          name: user.name,
          avatarColor: user.avatarColor,
          avatarImage: user.avatarImage,
          createdAt: user.createdAt
        },
        message: 'Acceso directo completado.'
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashOneTimeToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.emailLoginToken.create({
      data: {
        email,
        tokenHash,
        pollId: pollId || null,
        expiresAt
      }
    });

    const loginUrl = `${backendPublicUrl.replace(/\/$/, '')}/auth/email/verify?token=${encodeURIComponent(rawToken)}`;
    const sentBySmtp = await sendLoginEmail(email, loginUrl);

    return res.json({
      ok: true,
      message: 'Si el correo existe, te hemos enviado un enlace de acceso.',
      ...(sentBySmtp
        ? {}
        : {
            // Fallback de desarrollo si no hay SMTP configurado.
            debugLoginUrl: loginUrl
          })
    });
  } catch (error) {
    console.error('No se pudo iniciar login por email', error);
    return res.status(500).json({ message: 'No se pudo iniciar el acceso por email.' });
  }
};

export const verifyEmailLoginHandler = async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

  if (!token) {
    return res.status(400).json({ message: 'Token de email obligatorio.' });
  }

  try {
    const tokenHash = hashOneTimeToken(token);

    const emailToken = await prisma.emailLoginToken.findUnique({
      where: { tokenHash }
    });

    if (!emailToken || emailToken.usedAt || emailToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Enlace inválido o expirado.' });
    }

    const authSubject = `email:${emailToken.email}`;
    const authKey = deriveAuthKey(authSubject);

    const nameFromEmail = emailToken.email.split('@')[0];
    let user = await prisma.user.upsert({
      where: { authKey },
      update: {
        email: emailToken.email
      },
      create: {
        authKey,
        email: emailToken.email,
        name: nameFromEmail
      }
    });
    user = await ensureUserAvatarColor(user);

    await prisma.emailLoginToken.update({
      where: { id: emailToken.id },
      data: { usedAt: new Date(), userId: user.id }
    });

    await ensureMembershipFromPoll(user.id, emailToken.pollId);

    const appToken = createAutologinToken(authSubject);
    const redirectUrl = new URL('/auth/email/verified', `${frontendUrl.replace(/\/$/, '')}/`);
    redirectUrl.searchParams.set('token', appToken);
    redirectUrl.searchParams.set('email', emailToken.email);
    if (emailToken.pollId) {
      redirectUrl.searchParams.set('pollId', emailToken.pollId);
    }

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('No se pudo verificar login por email', error);
    return res.status(500).json({ message: 'No se pudo validar el enlace de email.' });
  }
};
