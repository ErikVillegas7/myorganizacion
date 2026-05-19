# Mi Organización

Plataforma para organizar notas rápidas, calendario académico, materias con tablero y seguimiento de hábitos. Con Google login, los datos se sincronizan por usuario en Postgres (Prisma), y se mantiene un respaldo local para uso offline.

## Vistas principales

- `/notas`: jerarquía de carpetas con notas editables.
- `/calendario`: eventos académicos con temporizador de próximos hitos.
- `/materias`: tablero por unidades, notas y condiciones de cursada.
- `/habitos`: seguimiento semanal con diagrama de progreso.

## Desarrollo

```bash
npm run dev
```

## Auth y Base de Datos

### 1) Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET` (o `AUTH_SECRET`)
- `NEXTAUTH_URL` (o `AUTH_URL`)

### 2) Prisma

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3) Google OAuth

En Google Cloud Console:

1. Configura la pantalla de consentimiento (External).
2. Crea un OAuth Client ID (Web application).
3. Agrega los redirect URIs:
	- `http://localhost:3000/api/auth/callback/google`
	- `https://<tu-dominio>.vercel.app/api/auth/callback/google`

## Build

```bash
npm run build
```
