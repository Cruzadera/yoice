import { Request, Response } from 'express';
import prisma from '../services/db';
import { pickRandomAvatarColor } from '../utils/avatarColor';

export const getCurrentUserHandler = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.auth.user.id }
  });

  if (user && !user.avatarColor) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatarColor: pickRandomAvatarColor() }
    });

    return res.json(updatedUser);
  }

  return res.json(user);
};

export const updateUserNameHandler = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.auth.user.id },
      select: { avatarColor: true }
    });

    const user = await prisma.user.update({
      where: { id: req.auth.user.id },
      data: {
        name,
        ...(currentUser?.avatarColor ? {} : { avatarColor: pickRandomAvatarColor() })
      }
    });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error al guardar el nombre del usuario', error });
  }
};

export const updateUserProfileHandler = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const avatarColor = typeof req.body?.avatarColor === 'string' ? req.body.avatarColor.trim() : '';
  const avatarImage = typeof req.body?.avatarImage === 'string' ? req.body.avatarImage.trim() : '';

  if (!name) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }

  if (avatarImage && !avatarImage.startsWith('data:image/')) {
    return res.status(400).json({ message: 'La imagen del avatar no tiene un formato válido' });
  }

  if (avatarImage.length > 3_000_000) {
    return res.status(400).json({ message: 'La imagen del avatar es demasiado grande' });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.auth.user.id },
      data: {
        name,
        avatarColor: avatarColor || null,
        avatarImage: avatarImage || null
      }
    });

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error al guardar el perfil del usuario', error });
  }
};
