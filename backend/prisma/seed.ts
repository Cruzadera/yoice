import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
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

  const toStableUuid = (seed: string) => {
    const hash = crypto.createHash('sha256').update(seed).digest();
    hash[6] = (hash[6] & 0x0f) | 0x40;
    hash[8] = (hash[8] & 0x3f) | 0x80;

    const hex = hash.toString('hex').slice(0, 32);
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  };

  return items.map((item) => ({
    id: toStableUuid(item.id),
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
