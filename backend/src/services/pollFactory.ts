import prisma from './db';

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

const getEligibleUsersForPoll = async (groupId?: string) => {
  if (groupId) {
    return prisma.user.findMany({
      where: {
        name: {
          not: null
        },
        memberships: {
          some: {
            groupId
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  return prisma.user.findMany({
    where: {
      name: {
        not: null
      }
    },
    orderBy: { createdAt: 'asc' }
  });
};

const getPollWithRelations = async (pollId: string) =>
  prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      question: true,
      options: {
        include: {
          user: true
        }
      }
    }
  });

const syncPollOptions = async (pollId: string, groupId?: string) => {
  const [users, poll] = await Promise.all([
    getEligibleUsersForPoll(groupId),
    prisma.poll.findUnique({
      where: { id: pollId },
      select: {
        id: true,
        options: {
          select: {
            userId: true
          }
        }
      }
    })
  ]);

  if (!poll) {
    throw new Error('Poll no encontrada al sincronizar opciones');
  }

  const existingUserIds = new Set(poll.options.map((option) => option.userId));
  const missingUsers = users.filter((user) => !existingUserIds.has(user.id));

  if (missingUsers.length === 0) {
    return getPollWithRelations(pollId);
  }

  await prisma.option.createMany({
    data: missingUsers.map((user) => ({
      pollId,
      userId: user.id
    })),
    skipDuplicates: true
  });

  return getPollWithRelations(pollId);
};

export const createPollFromActiveQuestion = async (groupId?: string) => {
  const activeQuestionCount = await prisma.question.count({
    where: { active: true }
  });

  if (activeQuestionCount === 0) {
    throw new Error('No hay preguntas activas para crear la encuesta');
  }

  const randomOffset = Math.floor(Math.random() * activeQuestionCount);
  const question = await prisma.question.findFirst({
    where: { active: true },
    skip: randomOffset
  });

  if (!question) {
    throw new Error('No se pudo seleccionar una pregunta activa');
  }

  const users = await getEligibleUsersForPoll(groupId);

  if (users.length === 0) {
    throw new Error('No hay usuarios con nombre para generar opciones dinámicas');
  }

  const poll = await prisma.poll.create({
    data: {
      questionId: question.id,
      groupId,
      options: {
        create: users.map((user) => ({
          userId: user.id
        }))
      }
    },
    include: {
      question: true,
      options: {
        include: {
          user: true
        }
      }
    }
  });

  return poll;
};

export const ensureDailyPoll = async () => {
  const existingPoll = await prisma.poll.findFirst({
    where: {
      createdAt: {
        gte: startOfToday(),
        lte: endOfToday()
      }
    },
    include: {
      question: true,
      options: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existingPoll) {
    return existingPoll;
  }

  return createPollFromActiveQuestion();
};

export const ensureDailyPollForGroup = async (groupId: string) => {
  const memberCount = await prisma.groupMember.count({
    where: { groupId }
  });

  if (memberCount < 2) {
    return null;
  }

  const existingPoll = await prisma.poll.findFirst({
    where: {
      groupId,
      createdAt: {
        gte: startOfToday(),
        lte: endOfToday()
      }
    },
    include: {
      question: true,
      options: {
        include: {
          user: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existingPoll) {
    return syncPollOptions(existingPoll.id, groupId);
  }

  return createPollFromActiveQuestion(groupId);
};
