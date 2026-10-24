# RePublish Ã¢ Video Republishing SaaS

A production-ready SaaS application that allows users to automatically republish short videos from TikTok, Instagram, and Facebook to YouTube.

## Architecture

```
sas/
âââ frontend/     # Next.js 14 App Router (deploy to Vercel)
âââ backend/      # Express.js API + BullMQ Workers (deploy to Railway/Render)
âââ plans/        # Architecture documentation
âââ docker-compose.yml
```

## Features

- ð **Google OAuth2** authentication with YouTube scope
- ð¥ **Video downloading** via `yt-dlp` from TikTok, Instagram, Facebook
- âï¸ **Video processing** via `FFmpeg` (trim, prepare for Shorts)
- ð¤ **YouTube upload** via YouTube Data API v3
- ð **Background jobs** with BullMQ + Redis (retry, parallel processing)
- ðï¸ **Auto cleanup** of temp files after successful upload
- ð **Dashboard** for managing jobs and connected accounts

## Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Redis Cloud account (or local Redis)
- Google Cloud project with YouTube Data API v3 enabled
- `yt-dlp` installed on the server
- `ffmpeg` installed on the server

## Quick Start

### 1. Clone and install

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your values
```

### 3. Run with Docker Compose (local dev)

```bash
docker-compose up -d   # Starts MongoDB + Redis
```

### 4. Start services

```bash
# Terminal 1: Backend API
cd backend && npm run dev

# Terminal 2: BullMQ Worker
cd backend && npm run worker

# Terminal 3: Frontend
cd frontend && npm run dev
```

App runs at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **YouTube Data API v3**
4. Configure **OAuth consent screen** (add `youtube.upload` scope)
5. Create **OAuth 2.0 credentials** (Web application)
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)

## Deployment

### Frontend â Vercel

```bash
cd frontend
vercel deploy
```

Set environment variables in Vercel dashboard.

### Backend â Railway

```bash
# Connect your GitHub repo to Railway
# Set environment variables in Railway dashboard
# Deploy both services: api and worker
```

## Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example).

## API Documentation

See [`plans/architecture.md`](plans/architecture.md) for full API endpoint documentation.

## License

MIT
