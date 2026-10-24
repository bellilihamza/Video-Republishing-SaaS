# RePublish

RePublish is a video republishing SaaS for downloading short-form videos,
processing them for YouTube Shorts, and publishing them through the YouTube
Data API.

The application is organized as a Next.js frontend and an Express API with a
BullMQ worker for asynchronous video processing.

## Features

- Google OAuth2 sign-in with YouTube upload permissions
- Video downloads through `yt-dlp`
- FFmpeg-based trimming and video preparation
- YouTube Data API v3 uploads
- Background processing with BullMQ and Redis
- MongoDB persistence for users, connected accounts, and jobs
- Automatic temporary-file cleanup after processing
- Dashboard views for accounts, jobs, and published videos
- API security with Helmet, CORS, rate limiting, validation, and encrypted
  OAuth tokens

## Project structure

```text
.
├── backend/       Express API and BullMQ worker
├── frontend/      Next.js 14 App Router application
├── plans/         Architecture and API documentation
└── docker-compose.yml
```

## Prerequisites

- Node.js 18 or newer
- npm
- Docker Desktop (recommended for local MongoDB and Redis)
- FFmpeg available on the backend host
- `yt-dlp` available on the backend host
- A MongoDB database
- A Redis instance
- A Google Cloud project with the YouTube Data API v3 enabled

## Local development

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Start local infrastructure

From the repository root:

```bash
docker compose up -d
```

This starts MongoDB on `localhost:27017`, Redis on `localhost:6379`, and
Redis Commander on `http://localhost:8081`.

### 3. Configure environment variables

Create local environment files from the provided examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Update the values for MongoDB, JWT, encryption, Google OAuth, and the backend
URL. The example files contain placeholders only; never commit real
credentials.

For Google OAuth, add the following redirect URI to the OAuth client:

```text
http://localhost:3000/api/auth/callback/google
```

### 4. Start the applications

Run each process in a separate terminal:

```bash
# Backend API
cd backend
npm run dev

# Video worker
cd backend
npm run worker

# Frontend
cd frontend
npm run dev
```

The frontend is available at [http://localhost:3000](http://localhost:3000)
and the API is available at [http://localhost:5000](http://localhost:5000).

## Useful commands

Run commands from the relevant package directory:

| Area | Command | Purpose |
| --- | --- | --- |
| Backend | `npm run build` | Compile TypeScript |
| Backend | `npm run typecheck` | Check types without emitting files |
| Backend | `npm run lint` | Run ESLint |
| Backend | `npm start` | Start the compiled API |
| Backend | `npm run start:worker` | Start the compiled worker |
| Frontend | `npm run build` | Create a production build |
| Frontend | `npm run typecheck` | Check TypeScript types |
| Frontend | `npm run lint` | Run Next.js linting |
| Frontend | `npm start` | Serve the production build |

## Configuration

The complete configuration reference is maintained in:

- [`backend/.env.example`](backend/.env.example)
- [`frontend/.env.example`](frontend/.env.example)

Important backend settings include:

- `MONGODB_URI` and `REDIS_URL` for persistence and queues
- `JWT_SECRET` and `ENCRYPTION_KEY` for application security
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for OAuth
- `FRONTEND_URL` for CORS
- `TEMP_DIR`, `DEFAULT_TRIM_DURATION`, and `MAX_TRIM_DURATION` for processing
- `QUEUE_CONCURRENCY` and `JOB_TIMEOUT_MS` for worker behavior

Use strong, unique values for production secrets. Generate an encryption key
with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deployment

The frontend can be deployed to Vercel or another Next.js-compatible host.
The backend API and worker should be deployed as separate long-running
services with access to the same MongoDB and Redis instances. FFmpeg and
`yt-dlp` must be installed in the backend and worker runtime.

Before deploying:

1. Set production environment variables in the hosting provider.
2. Register the production Google OAuth callback URL.
3. Restrict CORS with the production frontend URL.
4. Run the backend and frontend build commands.
5. Run both the API service and the BullMQ worker.

## Documentation

See [`plans/architecture.md`](plans/architecture.md) for the architecture,
service responsibilities, and API endpoint documentation.

## License

This project is licensed under the MIT License.
