# Yoice Backend

Backend Express preparado para autologin genérico, Prisma y PostgreSQL.

## Configuración

1. Copia `backend/.env.example` a `backend/.env`.
2. Ajusta `DATABASE_URL` para apuntar al PostgreSQL existente en Docker.
3. Define `JWT_SECRET`.
4. Activa `ENABLE_POLL_CRON=true` si quieres crear la poll diaria automáticamente.

Ejemplo:

```env
DATABASE_URL="postgresql://user:password@host:5432/app_encuestas"
JWT_SECRET="cambia-este-secreto"
PORT=3001
ENABLE_POLL_CRON=false
```

## Scripts

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start
```

## Endpoints

- `GET /auth/autologin?token=...&pollId=...`
- `GET /api/auth/autologin?token=...&pollId=...`
- `POST /auth/magic-link/verify`
- `POST /api/auth/magic-link/verify`
- `POST /api/auth/standalone`
- `GET /api/user/me`
- `POST /api/user/name`
- `GET /api/polls/:pollId`
- `POST /api/polls/generate`
- `POST /api/polls/ensure-daily`
- `GET /api/questions`
- `POST /api/votes`

## Prisma

Schema: `backend/prisma/schema.prisma`

Consultas clave:

```ts
await prisma.poll.findUnique({
  where: { id: pollId },
  include: {
    question: true,
    options: {
      include: { user: true }
    },
    votes: true
  }
});

await prisma.vote.create({
  data: {
    pollId,
    userId,
    optionId
  }
});
```

## Seed

El script [seed.ts](/home/maria/proyectos/app_encuestas/backend/prisma/seed.ts) lee [questions.json](/home/maria/proyectos/app_encuestas/data/questions.json) y hace `createMany` sobre `Question`.

## Cron de polls

El ejemplo de cron está en [pollCron.ts](/home/maria/proyectos/app_encuestas/backend/src/services/pollCron.ts) y usa [pollFactory.ts](/home/maria/proyectos/app_encuestas/backend/src/services/pollFactory.ts) para:
- elegir una `Question` activa aleatoria
- crear una `Poll`
- generar una `Option` por cada usuario con nombre
