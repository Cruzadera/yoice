import { Request, Response } from 'express';
import prisma from '../services/db';
import { resolveDailyPollForGroupBySource } from '../services/pollFactory';

const createInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const endOfToday = () => {
  const today = startOfToday();
  today.setHours(23, 59, 59, 999);
  return today;
};

export const listUserGroupsHandler = async (req: Request, res: Response) => {
  if (!req.auth) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  try {
    const memberships = await prisma.groupMember.findMany({
      where: {
        userId: req.auth.user.id
      },
      include: {
        group: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (memberships.length === 0) {
      return res.json({ groups: [] });
    }

    const groupIds = memberships.map((membership) => membership.group.id);

    const [memberCounts, existingPolls] = await Promise.all([
      prisma.groupMember.groupBy({
        by: ['groupId'],
        where: {
          groupId: {
            in: groupIds
          }
        },
        _count: {
          _all: true
        }
      }),
      prisma.poll.findMany({
        where: {
          groupId: {
            in: groupIds
          },
          createdAt: {
            gte: startOfToday(),
            lte: endOfToday()
          }
        },
        select: {
          id: true,
          groupId: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    const memberCountByGroupId = new Map(memberCounts.map((entry) => [entry.groupId, entry._count._all]));
    const pollByGroupId = new Map<string, { id: string }>();

    for (const poll of existingPolls) {
      if (!poll.groupId || pollByGroupId.has(poll.groupId)) {
        continue;
      }

      pollByGroupId.set(poll.groupId, { id: poll.id });
    }

    const groups = memberships.map(({ group }) => {
      const memberCount = memberCountByGroupId.get(group.id) ?? 1;
      const poll = pollByGroupId.get(group.id) ?? null;

      return {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
        memberCount,
        pollReady: !!poll,
        poll
      };
    });

    return res.json({ groups });
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar los grupos del usuario', error });
  }
};

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

    // Web/app flow must not auto-create polls.
    const poll = await resolveDailyPollForGroupBySource(group.id, 'web');

    return res.json({ group, poll, memberCount, pollReady: !!poll });
  } catch (error) {
    return res.status(500).json({ message: 'Error al unirse al grupo', error });
  }
};
