# Yoice Frontend

Frontend Expo adaptado a una entrada principal:

- `home -> standalone -> onboarding|groupList|poll`
- `/auth/autologin -> onboarding|groupList|poll`

## Configuración

1. Copia `frontend/.env.example` a `frontend/.env`.
2. Ajusta `EXPO_PUBLIC_API_URL` al backend.

```env
EXPO_PUBLIC_API_URL="http://localhost:3001/api"
```

## Ejecutar

```bash
npm install
npm run start
```

## Pantallas activas

- `src/screens/HomeScreen.tsx`
- `src/screens/StandaloneAccessScreen.tsx`
- `src/screens/AuthCallbackScreen.tsx`
- `src/screens/OnboardingScreen.tsx`
- `src/screens/PollScreen.tsx`
