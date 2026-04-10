import prisma from './db';
import { readFile } from 'fs/promises';
import path from 'path';

export type PollSource = 'whatsapp' | 'web';

type QuestionSeedItem = {
  id: string;
  texto: string;
  categoria: string;
  tipoSeleccion: 'single' | 'multiple';
  nsfw: boolean;
  activa: boolean;
};

const loadQuestionsFromFile = async () => {
  const filePath = path.resolve(process.cwd(), 'data/questions.json');
  const raw = await readFile(filePath, 'utf8');
  const items = JSON.parse(raw) as QuestionSeedItem[];

  return items.map((item) => ({
    id: item.id,
    text: item.texto,
    category: item.categoria,
    selectionType: item.tipoSeleccion,
    nsfw: item.nsfw,
    active: item.activa,
  }));
};

const ensureQuestionPool = async () => {
  const count = await prisma.question.count({ where: { active: true } });
  if (count > 0) {
    return;
  }

  const questions = await loadQuestionsFromFile();

  if (questions.length === 0) {
    throw new Error('No hay preguntas disponibles en data/questions.json');
  }

  await prisma.question.createMany({
    data: questions,
    skipDuplicates: true,
  });
};

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
  await ensureQuestionPool();

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
  return resolveDailyPollForGroupBySource(groupId, 'whatsapp');
};

export const resolveDailyPollForGroupBySource = async (
  groupId: string,
  source: PollSource,
) => {
  const existingPoll = await prisma.poll.findFirst({
    where: {
      groupId,
      createdAt: {
        gte: startOfToday(),
        lte: endOfToday(),
      },
    },
    include: {
      question: true,
      options: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingPoll) {
    return syncPollOptions(existingPoll.id, groupId);
  }

  if (source === 'whatsapp') {
    return createPollFromActiveQuestion(groupId);
  }

  return null;
};
