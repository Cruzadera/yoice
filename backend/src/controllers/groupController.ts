import { Request, Response } from 'express';
import prisma from '../services/db';
import { ensureDailyPollForGroup } from '../services/pollFactory';

const createInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const createGroupHandler = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!name) {
    return res.status(400).json({ message: 'El nombre del grupo es obligatorio' });
  }

  try {
    const group = await prisma.group.create({
      data: {
        name,
        inviteCode: createInviteCode(),
        memberships: {
          create: {
            userId: req.auth.user.id
          }
        }
      }
    });

    const memberCount = await prisma.groupMember.count({
      where: { groupId: group.id }
    });

    return res.status(201).json({ group, poll: null, memberCount, pollReady: false });
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear el grupo', error });
  }
};

export const joinGroupHandler = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  const inviteCode = typeof req.body?.inviteCode === 'string' ? req.body.inviteCode.trim().toUpperCase() : '';

  if (!inviteCode) {
    return res.status(400).json({ message: 'El código del grupo es obligatorio' });
  }

  try {
    const group = await prisma.group.findUnique({
      where: { inviteCode }
    });

    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    await prisma.groupMember.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: req.auth.user.id
        }
      },
      update: {},
      create: {
        groupId: group.id,
        userId: req.auth.user.id
      }
    });

    const memberCount = await prisma.groupMember.count({
      where: { groupId: group.id }
    });

    const poll = memberCount >= 2 ? await ensureDailyPollForGroup(group.id) : null;

    return res.json({ group, poll, memberCount, pollReady: memberCount >= 2 });
  } catch (error) {
    return res.status(500).json({ message: 'Error al unirse al grupo', error });
  }
};
