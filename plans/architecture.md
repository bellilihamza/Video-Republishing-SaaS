# RePublish SaaS Ã¢ Architecture Plan

## 1. Overview

A production-ready SaaS web application that allows users to republish short videos from TikTok, Instagram, and Facebook to YouTube. The system handles video downloading, processing, and publishing via a background job queue.

---

## 2. System Architecture

```mermaid
graph TB
    subgraph Client
        A[Next.js 14 Frontend]
    end

    subgraph Backend Services
        B[Express.js API Server]
        C[BullMQ Workers]
    end

    subgraph External
        D[Google OAuth2]
        E[YouTube Data API v3]
        F[yt-dlp]
        G[FFmpeg]
    end

    subgraph Data Stores
        H[MongoDB Atlas]
        I[Redis Cloud]
    end

    A -->|REST API| B
    A -->|NextAuth.js| D
    B -->|Enqueue Jobs| I
    C -->|Consume Jobs| I
    C -->|Download| F
    C -->|Process| G
    C -->|Upload| E
    B -->|CRUD| H
    C -->|Update Status| H
```

---

## 3. Project Structure

```
sas/
âââ frontend/                    # Next.js 14 App Router
â   âââ src/
â   â   âââ app/
â   â   â   âââ layout.tsx
â   â   â   âââ page.tsx
â   â   â   âââ globals.css
â   â   â   âââ api/
â   â   â   â   âââ auth/
â   â   â   â       âââ [...nextauth]/
â   â   â   â           âââ route.ts
â   â   â   âââ dashboard/
â   â   â   â   âââ page.tsx
â   â   â   â   âââ jobs/
â   â   â   â   â   âââ page.tsx
â   â   â   â   âââ accounts/
â   â   â   â   â   âââ page.tsx
â   â   â   â   âââ publish/
â   â   â   â       âââ page.tsx
â   â   â   âââ auth/
â   â   â       âââ signin/
â   â   â       â   âââ page.tsx
â   â   â       âââ error/
â   â   â           âââ page.tsx
â   â   âââ components/
â   â   â   âââ ui/
â   â   â   â   âââ Button.tsx
â   â   â   â   âââ Input.tsx
â   â   â   â   âââ Card.tsx
â   â   â   â   âââ Badge.tsx
â   â   â   â   âââ Select.tsx
â   â   â   â   âââ Spinner.tsx
â   â   â   âââ layout/
â   â   â   â   âââ Navbar.tsx
â   â   â   â   âââ Sidebar.tsx
â   â   â   â   âââ Footer.tsx
â   â   â   âââ dashboard/
â   â   â   â   âââ VideoUrlForm.tsx
â   â   â   â   âââ JobStatusCard.tsx
â   â   â   â   âââ JobList.tsx
â   â   â   â   âââ PublishedVideoList.tsx
â   â   â   â   âââ ConnectedAccounts.tsx
â   â   â   âââ auth/
â   â   â       âââ AuthProvider.tsx
â   â   âââ lib/
â   â   â   âââ auth.ts           # NextAuth config
â   â   â   âââ api.ts            # API client
â   â   â   âââ utils.ts
â   â   âââ hooks/
â   â   â   âââ useJobs.ts
â   â   â   âââ useAccounts.ts
â   â   âââ types/
â   â       âââ index.ts
â   âââ public/
â   âââ next.config.js
â   âââ tailwind.config.ts
â   âââ tsconfig.json
â   âââ package.json
â
âââ backend/                     # Express.js API + Workers
â   âââ src/
â   â   âââ index.ts             # Server entry point
â   â   âââ app.ts               # Express app setup
â   â   âââ config/
â   â   â   âââ env.ts           # Environment variables
â   â   â   âââ db.ts            # MongoDB connection
â   â   â   âââ redis.ts         # Redis connection
â   â   âââ models/
â   â   â   âââ User.ts
â   â   â   âââ Account.ts
â   â   â   âââ Job.ts
â   â   âââ routes/
â   â   â   âââ index.ts         # Route aggregator
â   â   â   âââ auth.routes.ts
â   â   â   âââ jobs.routes.ts
â   â   â   âââ accounts.routes.ts
â   â   â   âââ videos.routes.ts
â   â   âââ controllers/
â   â   â   âââ auth.controller.ts
â   â   â   âââ jobs.controller.ts
â   â   â   âââ accounts.controller.ts
â   â   â   âââ videos.controller.ts
â   â   âââ services/
â   â   â   âââ video-download.service.ts   # yt-dlp wrapper
â   â   â   âââ video-process.service.ts    # FFmpeg wrapper
â   â   â   âââ youtube-upload.service.ts   # YouTube API v3
â   â   â   âââ oauth.service.ts            # Token management
â   â   â   âââ cleanup.service.ts          # Temp file deletion
â   â   âââ queues/
â   â   â   âââ video.queue.ts              # Queue definition
â   â   â   âââ video.worker.ts             # Worker processor
â   â   âââ middleware/
â   â   â   âââ auth.middleware.ts           # JWT verification
â   â   â   âââ validate.middleware.ts       # Request validation
â   â   â   âââ rateLimit.middleware.ts      # Rate limiting
â   â   â   âââ error.middleware.ts          # Global error handler
â   â   âââ validators/
â   â   â   âââ job.validator.ts
â   â   â   âââ url.validator.ts
â   â   âââ utils/
â   â       âââ logger.ts
â   â       âââ helpers.ts
â   âââ tsconfig.json
â   âââ package.json
â
âââ plans/
â   âââ architecture.md
âââ .gitignore
âââ README.md
âââ docker-compose.yml           # Local dev with Redis + MongoDB
```

---

## 4. Data Flow Ã¢ Video Republishing Pipeline

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant API as Express API
    participant Queue as BullMQ / Redis
    participant Worker as Video Worker
    participant YtDlp as yt-dlp
    participant FFmpeg as FFmpeg
    participant YouTube as YouTube API
    participant DB as MongoDB
    participant FS as File System

    User->>Frontend: Paste video URL + select platform
    Frontend->>API: POST /api/jobs
    API->>DB: Create Job record with status=pending
    API->>Queue: Enqueue video processing job
    API-->>Frontend: Return jobId + status

    Queue->>Worker: Dequeue job
    Worker->>DB: Update status=downloading
    Worker->>YtDlp: Download video to /tmp/videos/jobId/
    YtDlp-->>Worker: input.mp4 saved

    Worker->>DB: Update status=processing
    Worker->>FFmpeg: Trim + prepare video
    FFmpeg-->>Worker: output.mp4 ready

    Worker->>DB: Update status=uploading
    Worker->>YouTube: Upload output.mp4 with metadata
    YouTube-->>Worker: Return YouTube video URL

    Worker->>DB: Update status=completed + save publishedVideoUrl
    Worker->>FS: Delete /tmp/videos/jobId/ folder

    Frontend->>API: GET /api/jobs/jobId - poll status
    API->>DB: Query job
    API-->>Frontend: Return job status + video URL
    Frontend-->>User: Show published video link
```

---

## 5. Database Schemas

### 5.1 User Model

| Field       | Type     | Description                |
|-------------|----------|----------------------------|
| `_id`       | ObjectId | Auto-generated             |
| `email`     | String   | Google email, unique        |
| `name`      | String   | Display name               |
| `image`     | String   | Profile image URL          |
| `createdAt` | Date     | Account creation timestamp |
| `updatedAt` | Date     | Last update timestamp      |

### 5.2 Account Model

| Field          | Type     | Description                       |
|----------------|----------|-----------------------------------|
| `_id`          | ObjectId | Auto-generated                    |
| `userId`       | ObjectId | Reference to User                 |
| `provider`     | String   | oauth provider: google            |
| `platform`     | String   | youtube, tiktok, instagram, etc   |
| `accessToken`  | String   | Encrypted OAuth access token      |
| `refreshToken` | String   | Encrypted OAuth refresh token     |
| `expiresAt`    | Date     | Token expiration time             |
| `scope`        | String   | Granted OAuth scopes              |
| `createdAt`    | Date     | Connection timestamp              |

### 5.3 Job Model

| Field               | Type     | Description                                  |
|---------------------|----------|----------------------------------------------|
| `_id`               | ObjectId | Auto-generated                               |
| `userId`            | ObjectId | Reference to User                            |
| `videoUrl`          | String   | Source video URL                              |
| `sourcePlatform`    | String   | tiktok, instagram, facebook                  |
| `targetPlatform`    | String   | youtube                                      |
| `status`            | String   | pending, downloading, processing, uploading, completed, failed |
| `title`             | String   | Video title for YouTube                      |
| `description`       | String   | Video description                            |
| `tags`              | String[] | Video tags                                   |
| `privacyStatus`     | String   | public, unlisted, private                    |
| `trimDuration`      | Number   | Max duration in seconds                      |
| `outputVideoPath`   | String   | Temporary file path                          |
| `publishedVideoUrl` | String   | YouTube URL after publish                    |
| `errorMessage`      | String   | Error details if failed                      |
| `attempts`          | Number   | Retry count                                  |
| `createdAt`         | Date     | Job creation timestamp                       |
| `updatedAt`         | Date     | Last status update                           |

---

## 6. API Endpoints

### 6.1 Authentication

| Method | Endpoint                   | Description                     |
|--------|----------------------------|---------------------------------|
| GET    | `/api/auth/session`        | Get current user session        |
| POST   | `/api/auth/google`         | Exchange Google auth code        |
| POST   | `/api/auth/refresh`        | Refresh access token            |
| DELETE | `/api/auth/logout`         | Destroy session                 |

### 6.2 Jobs

| Method | Endpoint                   | Description                     |
|--------|----------------------------|---------------------------------|
| POST   | `/api/jobs`                | Create a new video job          |
| GET    | `/api/jobs`                | List all jobs for current user  |
| GET    | `/api/jobs/:id`            | Get job by ID                   |
| DELETE | `/api/jobs/:id`            | Cancel/delete a job             |

### 6.3 Accounts

| Method | Endpoint                   | Description                     |
|--------|----------------------------|---------------------------------|
| GET    | `/api/accounts`            | List connected accounts         |
| POST   | `/api/accounts/connect`    | Connect a new platform account  |
| DELETE | `/api/accounts/:id`        | Disconnect an account           |

### 6.4 Videos

| Method | Endpoint                   | Description                     |
|--------|----------------------------|---------------------------------|
| GET    | `/api/videos`              | List published videos           |
| GET    | `/api/videos/:id`          | Get published video details     |

---

## 7. Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js
    participant NextAuth as NextAuth.js
    participant Google as Google OAuth2
    participant API as Express API
    participant DB as MongoDB

    User->>Frontend: Click Sign in with Google
    Frontend->>NextAuth: Initiate OAuth flow
    NextAuth->>Google: Redirect to consent screen
    Note over Google: Scopes: profile, email, youtube.upload
    Google-->>NextAuth: Return auth code
    NextAuth->>Google: Exchange code for tokens
    Google-->>NextAuth: accessToken + refreshToken
    NextAuth->>API: POST /api/auth/google with tokens
    API->>DB: Upsert User + Account with encrypted tokens
    API-->>NextAuth: Return JWT session token
    NextAuth-->>Frontend: Set session cookie
    Frontend-->>User: Redirect to dashboard
```

---

## 8. Job Queue Architecture

```mermaid
graph LR
    subgraph API Server
        A[POST /api/jobs] -->|Add job| B[BullMQ Queue]
    end

    subgraph Redis
        B
    end

    subgraph Worker Process
        C[Video Worker]
        C -->|Step 1| D[Download via yt-dlp]
        C -->|Step 2| E[Process via FFmpeg]
        C -->|Step 3| F[Upload to YouTube]
        C -->|Step 4| G[Cleanup temp files]
    end

    B -->|Dequeue| C
    C -->|Update status| H[MongoDB]
```

### Queue Configuration

- **Concurrency**: 3 parallel jobs per worker
- **Retries**: 3 attempts with exponential backoff
- **Timeout**: 10 minutes per job
- **Stalled check**: Every 30 seconds
- **Remove on complete**: After 24 hours
- **Remove on fail**: After 7 days

---

## 9. Security Implementation

| Concern               | Solution                                           |
|------------------------|----------------------------------------------------|
| Authentication         | NextAuth.js JWT sessions                           |
| API Authorization      | JWT middleware on all protected routes              |
| Token Storage          | AES-256 encryption for OAuth tokens in MongoDB     |
| Input Validation       | Zod schemas on all request bodies                  |
| Rate Limiting          | express-rate-limit: 100 req/15min per IP           |
| CORS                   | Whitelist frontend origin only                     |
| URL Validation         | Regex + allowlist for TikTok/Instagram/Facebook    |
| Error Handling         | Global error middleware, no stack traces in prod    |
| Environment Secrets    | .env files, never committed                        |

---

## 10. URL Validation Patterns

```
TikTok:    ^https?://(www\.)?tiktok\.com/@[\w.-]+/video/\d+
Instagram: ^https?://(www\.)?instagram\.com/(p|reel)/[\w-]+
Facebook:  ^https?://(www\.|m\.)?facebook\.com/.+/videos/\d+
           ^https?://(www\.)?fb\.watch/[\w-]+
```

---

## 11. Frontend Pages

| Route                  | Description                           |
|------------------------|---------------------------------------|
| `/`                    | Landing page with CTA                 |
| `/auth/signin`         | Google sign-in page                   |
| `/dashboard`           | Main dashboard overview               |
| `/dashboard/publish`   | Paste URL + configure upload          |
| `/dashboard/jobs`      | View all job statuses                 |
| `/dashboard/accounts`  | Manage connected platforms            |

---

## 12. Key Dependencies

### Frontend

| Package            | Purpose                    |
|--------------------|----------------------------|
| `next@14`          | React framework            |
| `next-auth@4`      | Authentication             |
| `tailwindcss`      | Styling                    |
| `axios`            | HTTP client                |
| `react-hot-toast`  | Notifications              |
| `lucide-react`     | Icons                      |
| `zod`              | Client-side validation     |

### Backend

| Package              | Purpose                    |
|----------------------|----------------------------|
| `express`            | HTTP server                |
| `mongoose`           | MongoDB ODM                |
| `bullmq`             | Job queue                  |
| `ioredis`            | Redis client               |
| `googleapis`         | YouTube Data API v3        |
| `jsonwebtoken`       | JWT creation/verification  |
| `zod`                | Request validation         |
| `express-rate-limit` | Rate limiting              |
| `winston`            | Logging                    |
| `helmet`             | Security headers           |
| `cors`               | CORS management            |
| `dotenv`             | Environment variables      |
| `crypto`             | Token encryption           |

### System Dependencies

| Tool     | Purpose              |
|----------|----------------------|
| `yt-dlp` | Video downloading    |
| `ffmpeg` | Video processing     |

---

## 13. Environment Variables

### Frontend `.env.local`

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend `.env`

```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/republish
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random-secret>
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
ENCRYPTION_KEY=<32-byte-hex-key>
FRONTEND_URL=http://localhost:3000
TEMP_DIR=/tmp/videos
```

---

## 14. Deployment Architecture

```mermaid
graph TB
    subgraph Vercel
        A[Next.js Frontend]
    end

    subgraph Railway or Render
        B[Express API Server]
        C[BullMQ Worker Process]
    end

    subgraph MongoDB Atlas
        D[Database Cluster]
    end

    subgraph Redis Cloud
        E[Redis Instance]
    end

    subgraph Google Cloud
        F[OAuth2 + YouTube API]
    end

    A -->|HTTPS| B
    B --> D
    B --> E
    C --> E
    C --> D
    C --> F
```

---

## 15. Implementation Order

1. **Backend scaffold** Ã¢ Express app, config, middleware, DB connection
2. **Database models** Ã¢ User, Account, Job with Mongoose
3. **Authentication** Ã¢ Google OAuth2 flow, JWT sessions, token encryption
4. **API routes** Ã¢ Jobs CRUD, Accounts management, Videos listing
5. **Queue system** Ã¢ BullMQ queue definition + worker skeleton
6. **Video download** Ã¢ yt-dlp service wrapper
7. **Video processing** Ã¢ FFmpeg service wrapper
8. **YouTube upload** Ã¢ googleapis integration
9. **Cleanup service** Ã¢ Temp file deletion after publish
10. **Frontend scaffold** Ã¢ Next.js 14, TailwindCSS, NextAuth
11. **Auth UI** Ã¢ Sign-in page, session provider, protected routes
12. **Dashboard UI** Ã¢ Publish form, job list, accounts page
13. **Polling/status** Ã¢ Real-time job status updates
14. **Security hardening** Ã¢ Rate limiting, validation, error handling
15. **Docker Compose** Ã¢ Local dev with Redis + MongoDB
16. **Deployment configs** Ã¢ Vercel, Railway/Render configs
