import prisma from './db';
import { pickRandomAvatarColor } from '../utils/avatarColor';
import { deriveAuthKey, SessionTokenPayload } from '../utils/token';

export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const ensureUserAvatarColor = async <T extends { id: string; avatarColor: string | null }>(user: T) => {
  if (user.avatarColor) {
    return user;
  }

  return prisma.user.update({
    where: { id: user.id },
    data: { avatarColor: pickRandomAvatarColor() }
  });
};

const syncEmailUser = async (
  email: string,
  authKey: string,
  options?: { userId?: string; name?: string | null }
) => {
  const normalizedEmail = normalizeEmail(email);
  const existingUser = options?.userId
    ? await prisma.user.findUnique({
        where: { id: options.userId }
      })
    : null;
  const existingUserByEmail = existingUser ??
    await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

  if (existingUserByEmail) {
    if (existingUserByEmail.email && existingUserByEmail.email !== normalizedEmail) {
      throw new Error('Email del token no coincide con el usuario autenticado');
    }

    return prisma.user.update({
      where: { id: existingUserByEmail.id },
      data: {
        authKey,
        email: normalizedEmail,
        ...(existingUserByEmail.name || !options?.name ? {} : { name: options.name })
      }
    });
  }

  return prisma.user.create({
    data: {
      authKey,
      email: normalizedEmail,
      ...(options?.name ? { name: options.name } : {})
    }
  });
};

export const resolveSessionUser = async (payload: SessionTokenPayload) => {
  const authKey = deriveAuthKey(payload.sub);

  if (payload.email) {
    const user = await syncEmailUser(payload.email, authKey, {
      userId: payload.userId,
      name: payload.name ?? null
    });

    return {
      authKey,
      user: await ensureUserAvatarColor(user)
    };
  }

  if (payload.userId) {
    const existingUser = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (existingUser) {
      const user = existingUser.authKey === authKey
        ? existingUser
        : await prisma.user.update({
            where: { id: existingUser.id },
            data: { authKey }
          });

      return {
        authKey,
        user: await ensureUserAvatarColor(user)
      };
    }
  }

  const user = await prisma.user.upsert({
    where: { authKey },
    update: {},
    create: { authKey }
  });

  return {
    authKey,
    user: await ensureUserAvatarColor(user)
  };
};

export const findOrCreateEmailUser = async (email: string, options?: { name?: string | null; userId?: string }) => {
  const normalizedEmail = normalizeEmail(email);
  const authSubject = `email:${normalizedEmail}`;
  const authKey = deriveAuthKey(authSubject);
  const user = await syncEmailUser(normalizedEmail, authKey, options);

  return {
    authSubject,
    authKey,
    user: await ensureUserAvatarColor(user)
  };
};
