# Surveys App

Aplicación de encuestas con:
- `backend/`: Node.js + Express + Prisma.
- `frontend/`: Expo/React Native Web.
- `PostgreSQL`: base de datos externa ya desplegada en Docker.

## Flujo actual

1. El usuario abre un enlace de WhatsApp con formato `/auth/whatsapp?token=XYZ&pollId=abc123`.
2. El frontend llama al backend para validar el token.
3. Si el usuario no tiene nombre, entra en `/onboarding`.
4. Si ya está completo, entra directamente en `/poll/{pollId}`.
5. El voto se guarda en PostgreSQL usando Prisma y se bloquean duplicados con `@@unique([pollId, userId])`.

## Modelo de datos

- `Question`: catálogo predefinido de preguntas.
- `Poll`: instancia diaria o puntual ligada a una `Question`.
- `Option`: opciones dinámicas generadas desde usuarios.
- `Vote`: voto emitido por un usuario sobre una `Option` de una `Poll`.

Tambien existe una entrada standalone desde la propia app:

1. El usuario abre la app sin enlace.
2. Introduce `phone`, `name` opcional y `pollId`.
3. El backend genera el mismo token interno y redirige al mismo flujo de onboarding o encuesta.

## Variables de entorno

### Backend

Archivo: `backend/.env`

```env
DATABASE_URL="postgresql://user:password@host:5432/app_encuestas"
JWT_SECRET="cambia-este-secreto"
PORT=3001
ENABLE_POLL_CRON=false
```

### Frontend

Archivo: `frontend/.env`

```env
EXPO_PUBLIC_API_URL="http://localhost:3001/api"
```

## Puesta en marcha

### Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start
```

### Frontend

```bash
cd frontend
npm install
npm run start
```

## Endpoints principales

- `GET /auth/whatsapp?token=...&pollId=...`
- `GET /api/auth/whatsapp?token=...&pollId=...`
- `POST /api/auth/standalone`
- `POST /api/user/name`
- `GET /api/user/me`
- `GET /api/polls/:pollId`
- `POST /api/polls/generate`
- `POST /api/polls/ensure-daily`
- `GET /api/questions`
- `POST /api/votes`

## Consultas Prisma usadas

```ts
const poll = await prisma.poll.findUnique({
  where: { id: pollId },
  include: {
    question: true,
    options: {
      include: { user: true }
    },
    votes: true
  }
});

const vote = await prisma.vote.create({
  data: {
    pollId,
    userId,
    optionId
  }
});
```

## Seed de preguntas

El catálogo base se carga desde [questions.json](/home/maria/proyectos/app_encuestas/data/questions.json) mediante [seed.ts](/home/maria/proyectos/app_encuestas/backend/prisma/seed.ts).
