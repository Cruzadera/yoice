import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

export const initDB = async () => {
  await prisma.$connect();
  console.log('DB connected (Prisma)');
};

export default prisma;
