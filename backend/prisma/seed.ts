import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';

type QuestionSeedItem = {
  id: string;
  texto: string;
  categoria: string;
  tipoSeleccion: 'single' | 'multiple';
  nsfw: boolean;
  activa: boolean;
};

const prisma = new PrismaClient();

const loadQuestions = async () => {
  const filePath = path.resolve(__dirname, '../data/questions.json');
  const raw = await readFile(filePath, 'utf8');
  const items = JSON.parse(raw) as QuestionSeedItem[];

  return items.map((item) => ({
    id: item.id,
    text: item.texto,
    category: item.categoria,
    selectionType: item.tipoSeleccion,
    nsfw: item.nsfw,
    active: item.activa
  }));
};

const main = async () => {
  const questions = await loadQuestions();

  await prisma.question.createMany({
    data: questions,
    skipDuplicates: true
  });

  console.log(`Seed completado: ${questions.length} preguntas procesadas.`);
};

main()
  .catch((error) => {
    console.error('Error ejecutando seed de preguntas', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
