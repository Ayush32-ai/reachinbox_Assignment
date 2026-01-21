# ReachInbox Email Scheduler

A full-stack email scheduling application that allows users to compose, schedule, and send bulk emails with rate limiting, persistence, and real-time status tracking.

**Tech Stack:**
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, BullMQ (Redis job queue)
- **Frontend:** Next.js 16, React 19, TypeScript, TailwindCSS, react-datepicker
- **Database:** PostgreSQL 15
- **Queue:** Redis 7
- **Email Service:** Nodemailer (with Ethereal Email for testing)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Architecture Overview](#architecture-overview)
4. [Running the Application](#running-the-application)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ (with npm)
- **Docker** and **Docker Compose** (for PostgreSQL and Redis)
- **Git** (to clone the repo)

### Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Ayush32-ai/ReachInbox.git
cd ReachInbox

# Install root-level dependencies (if any)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### Start Infrastructure (Docker Compose)

```bash
# Start PostgreSQL 15 and Redis 7
docker-compose up -d

# Verify services are running
docker ps

# Check PostgreSQL is accepting connections
docker-compose logs postgres | grep "ready to accept"

# Check Redis is accepting connections
docker-compose logs redis | grep "Ready to accept"
```

### Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
# Or if migrations already exist:
npx prisma migrate deploy

cd ..
```

### Start Backend and Frontend (Development)

#### Option 1: Run Both in Parallel (Recommended)
```bash
npm run dev
# This runs both backend (port 4000) and frontend (port 3000 or 3001) concurrently
```

#### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend listens on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend serves on http://localhost:3000 (or http://localhost:3001 if 3000 is busy)
```

### Access the Application

- **Frontend Dashboard:** http://localhost:3000 (or http://localhost:3001)
- **Backend API:** http://localhost:4000/api/*
- **Ethereal Email Preview:** Check console output for preview URLs after emails are "sent"

---

## 🔧 Environment Setup

### Backend Environment (`.env` in `backend/` folder)

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public"

# Redis (for BullMQ job queue)
REDIS_URL="redis://localhost:6379"

# Email Service (Ethereal Email for development)
ETHEREAL_USER="your-ethereal-email@ethereal.email"
ETHEREAL_PASSWORD="your-ethereal-password"

# Google OAuth (optional; set ALLOW_DEV_AUTH=true to bypass)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Dev Mode (bypass OAuth for local development)
ALLOW_DEV_AUTH="true"
DEV_AUTH_EMAIL="dev@example.com"

# Server Port
PORT="4000"
NODE_ENV="development"
```

### Frontend Environment (`.env.local` in `frontend/` folder)

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### Setting Up Ethereal Email

Ethereal Email is a **fake SMTP service** perfect for testing email functionality without actually sending real emails.

1. **Create an Ethereal Account:**
   - Visit https://ethereal.email
   - Click "Create Ethereal Account"
   - Copy the generated credentials (email and password)

2. **Update `.env` in backend:**
   ```env
   ETHEREAL_USER="your-generated-email@ethereal.email"
   ETHEREAL_PASSWORD="your-generated-password"
   ```

3. **Verify:**
   - After scheduling and sending an email, check the backend console for:
     ```
     Preview URL for message <...>: https://ethereal.email/message/...
     ```
   - Click the link to view the "sent" email in Ethereal's web interface

---

## 🏗️ Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                          │
│  • Dashboard UI with Compose, Scheduled, Sent tabs               │
│  • Real-time status updates via polling                          │
│  • User authentication & session management                      │
└─────────────────────────────────────────────────────────────────┘
                              ↕️ HTTP/JSON
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Express + TypeScript)                 │
│  • REST API: /api/emails/schedule, /parse, /scheduled, /sent    │
│  • Authentication middleware (dev bypass or Google OAuth)        │
│  • Request validation (Zod schemas)                              │
│  • Email service: scheduling, status updates, retry logic       │
└─────────────────────────────────────────────────────────────────┘
         ↕️                  ↕️                      ↕️
    PostgreSQL          BullMQ Queue          Nodemailer
    (Prisma ORM)        (Redis)               (Email)
```

### 1. Scheduling Flow

```
User composes email with:
  - Recipients list (manual or file upload)
  - Subject & body
  - Start time & delay between sends
  - Hourly rate limit

        ↓

API: POST /api/emails/schedule
  - Validates input (Zod schema)
  - Creates ScheduleBatch record (status: SCHEDULED)
  - Creates Email records (one per recipient, status: SCHEDULED)
  - Enqueues jobs in BullMQ with start time as "delayed" job

        ↓

BullMQ Worker (background process):
  - Waits for scheduled time
  - Picks up job from queue
  - Checks hourly limit (max N emails per hour)
  - Calls Nodemailer to send via Ethereal/SMTP
  - Updates Email status: PROCESSING → SENT or FAILED
  - Reschedules next job with delay between sends

        ↓

Frontend polling:
  - Calls GET /api/emails/scheduled or /api/emails/sent
  - Displays real-time status in dashboard
  - Shows preview URLs for sent emails
```

### 2. Persistence on Restart

**Database (PostgreSQL):**
- All `ScheduleBatch` and `Email` records are persisted in PostgreSQL
- Status is updated atomically (SCHEDULED → PROCESSING → SENT/FAILED)
- On server restart, any in-progress jobs can be recovered

**Redis Job Queue (BullMQ):**
- BullMQ stores job state in Redis (delayed, active, completed, failed)
- Jobs with future scheduled times are preserved across restarts
- Failed jobs can be retried (retry logic configured in `emailQueue.ts`)
- On restart, the worker resumes processing pending jobs

**Recovery Strategy:**
1. Server restarts
2. Worker reconnects to Redis
3. BullMQ automatically resumes any delayed jobs that are now due
4. Database queries still show `SCHEDULED` or `PROCESSING` statuses
5. No data is lost; jobs continue from where they left off

```typescript
// Example: Job with 1-hour delay, scheduled for tomorrow at 3 PM
const job = await emailQueue.add(
  'send-email',
  { emailId, recipient, ... },
  { delay: 86400000 + 3600000, ... } // 24h + 1h from now
);
// On restart within that window: job is re-queued and resumes
```

### 3. Rate Limiting & Concurrency

**Hourly Rate Limiting:**
- Each `ScheduleBatch` has an `hourlyLimit` (e.g., 30 emails/hour)
- Worker calculates how many emails can be sent in the current hour
- Uses database query to count already-sent emails in the current hour window
- Delays subsequent emails if limit is approaching

```typescript
// Pseudo-code from emailService.ts
const sentThisHour = await prisma.email.count({
  where: {
    batchId,
    status: 'SENT',
    sentAt: { gte: oneHourAgo },
  },
});

const remainingCapacity = hourlyLimit - sentThisHour;
if (remainingCapacity <= 0) {
  // Schedule next attempt in 5 minutes or delay the current email
}
```

**BullMQ Concurrency Control:**
- Worker is configured with a concurrency setting (default: 1 job at a time)
- Multiple workers can be spawned for scaling (horizontally)
- Each worker processes one email send at a time

```typescript
// From emailQueue.ts
emailQueue.process(1, async (job) => {
  // Process one job at a time; next job waits for this one to complete
  return await sendEmailViaNodemailer(job.data);
});
```

**Delay Between Sends:**
- Each `ScheduleBatch` specifies `delaySeconds` (e.g., 30 seconds between each email)
- After sending one email, worker enqueues the next job with a delay

```typescript
// After sending email #1, delay email #2
await emailQueue.add('send-email', { emailId: email2.id, ... }, {
  delay: delaySeconds * 1000, // Convert to milliseconds
});
```

**Retry & Error Handling:**
- BullMQ retry on failed jobs (configurable max retries)
- Failed jobs are moved to a "failed" queue for manual inspection
- Email status updated to `FAILED` after max retries exceeded

### 4. File Upload & Parsing

**File Types Supported:**
- `.txt`, `.csv`, `.pdf` (via text extraction regex)
- Emails are extracted using regex: `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`

**Flow:**
1. Frontend: User selects file or manually uploads via "Upload List" button
2. File sent to: `POST /api/emails/parse` (preview endpoint)
   - Returns parsed email list without scheduling
   - User can review before confirming
3. Or included in: `POST /api/emails/schedule` (direct scheduling)
   - File parsed automatically
   - Emails added to recipient list

```typescript
// parseRecipientsFromFile in emailRoutes.ts
const text = fileBuffer.toString("utf-8", 0, Math.min(fileBuffer.length, 5 * 1024 * 1024));
const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const emails = text.match(emailRegex) || [];
return Array.from(new Set(emails.map(e => e.toLowerCase())));
```

### 5. User Isolation

**Dev Mode (Local Development):**
- All emails tagged with `DEV_AUTH_EMAIL` (from `.env`)
- Authentication middleware injects this email into `req.user.email`
- Backend filters queries by logged-in user's email

**Production (Google OAuth):**
- Google OAuth returns user's authenticated email
- Same isolation logic applies

```typescript
// Example: Dashboard query
const emails = await listScheduledEmails(req.user?.email);
// Returns only emails where senderEmail === req.user.email
```

---

## 📱 Running the Application

### Full Start (All Services)

```bash
# Terminal 1: Start Docker services (if not already running)
docker-compose up -d

# Terminal 2: Start backend + frontend (from root directory)
npm run dev

# Or run each separately:
# Terminal 2a: Backend
cd backend && npm run dev

# Terminal 2b: Frontend (in another terminal)
cd frontend && npm run dev
```

### Stopping Services

```bash
# Stop Docker services
docker-compose down

# Or stop and remove volumes (reset database)
docker-compose down -v
```

### View Logs

```bash
# Backend logs (if running in foreground)
# Check console output directly

# Docker container logs
docker-compose logs postgres
docker-compose logs redis

# View specific service
docker-compose logs --follow postgres
```

---

## 🔌 API Endpoints

### Authentication
- **Dev Mode:** No auth needed; all requests use `DEV_AUTH_EMAIL` from `.env`
- **Production:** Google OAuth token required in `Authorization: Bearer <token>` header

### Endpoints

#### 1. Schedule Emails
```
POST /api/emails/schedule
Content-Type: multipart/form-data

Body:
  - file: (optional) recipients list file
  - subject: string
  - body: string
  - recipients: string[] (optional; in addition to file)
  - startTime: ISO 8601 datetime
  - delaySeconds: number (seconds between each email)
  - hourlyLimit: number (max emails per hour)
  - senderEmail: string
  - senderName: string (optional)

Response:
  {
    "ok": true,
    "batchId": "uuid",
    "totalRecipients": 5
  }
```

#### 2. Parse File (Preview)
```
POST /api/emails/parse
Content-Type: multipart/form-data

Body:
  - file: (required) recipients list file

Response:
  {
    "items": ["user1@example.com", "user2@example.com", ...]
  }
```

#### 3. List Scheduled Emails
```
GET /api/emails/scheduled

Response:
  {
    "items": [
      {
        "id": "uuid",
        "recipient": "user@example.com",
        "subject": "Hello",
        "body": "...",
        "status": "SCHEDULED",
        "scheduledAt": "2025-01-22T10:00:00Z",
        "senderEmail": "dev@example.com"
      },
      ...
    ]
  }
```

#### 4. List Sent Emails
```
GET /api/emails/sent

Response:
  {
    "items": [
      {
        "id": "uuid",
        "recipient": "user@example.com",
        "subject": "Hello",
        "body": "...",
        "status": "SENT",
        "sentAt": "2025-01-22T10:05:00Z",
        "senderEmail": "dev@example.com"
      },
      ...
    ]
  }
```

---

## 🗄️ Database Schema

### ScheduleBatch
Represents a bulk email scheduling operation.

```sql
CREATE TABLE "ScheduleBatch" (
  id                 String       @id @default(cuid())
  subject            String       -- Email subject
  body               String       -- Email body
  startTime          DateTime     -- When to start sending
  delaySeconds       Int          -- Seconds between each email
  hourlyLimit        Int          -- Max emails per hour
  senderEmail        String       -- Email of the scheduler
  senderName         String?      -- Optional sender name
  requestedBy        String?      -- User who created this batch
  createdAt          DateTime     @default(now())
  emails             Email[]      -- Related individual emails
}
```

### Email
Represents a single email to be sent or already sent.

```sql
CREATE TABLE "Email" (
  id                 String       @id @default(cuid())
  recipient          String       -- Recipient email address
  subject            String       -- Email subject
  body               String       -- Email body
  status             String       -- SCHEDULED, PROCESSING, SENT, FAILED
  scheduledAt        DateTime?    -- When this email is scheduled to be sent
  sentAt             DateTime?    -- When this email was actually sent
  senderEmail        String       -- Sender's email
  jobId              String?      -- BullMQ job ID (for tracking)
  batchId            String       -- Foreign key to ScheduleBatch
  batch              ScheduleBatch @relation(fields: [batchId], references: [id])
  createdAt          DateTime     @default(now())
}
```

---

## 🛠️ Troubleshooting

### 1. **Port 3000/4000 Already in Use**

```bash
# Find process using port
netstat -ano | findstr :4000    # Windows PowerShell
lsof -i :4000                   # macOS/Linux

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (macOS/Linux)
kill -9 <PID>

# Or use different port
PORT=4001 npm run dev
```

### 2. **Database Connection Refused**

```bash
# Verify Docker services are running
docker-compose ps

# Restart Docker services
docker-compose down
docker-compose up -d

# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection string in .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public"
```

### 3. **Redis Connection Errors**

```bash
# Verify Redis is running
docker-compose logs redis

# Check Redis is listening
redis-cli -h localhost -p 6379 ping  # Should return PONG

# Restart Redis
docker-compose restart redis
```

### 4. **Prisma Migration Issues**

```bash
# Reset database and run migrations fresh
cd backend
npx prisma migrate reset

# Or: Deploy existing migrations
npx prisma migrate deploy

# View migration status
npx prisma migrate status
```

### 5. **File Upload Parsing Returns Empty**

- **Check file format:** Only UTF-8 text, CSV, and PDFs (as text) are supported
- **Ensure emails match regex:** `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`
- **Test parse endpoint:** `POST /api/emails/parse` with a test file first
- **Backend logs:** Check console output for parsing errors

### 6. **Emails Not Sending**

```bash
# Check Ethereal credentials in .env
ETHEREAL_USER="..."
ETHEREAL_PASSWORD="..."

# Check worker logs
npm run dev  # See backend console output for queue events

# Verify BullMQ worker is running
# Look for: "Email job email-... completed" in backend output

# Check email status in dashboard
# Should progress: SCHEDULED → PROCESSING → SENT
```

### 7. **Frontend Cannot Connect to Backend**

```bash
# Verify backend is running
curl http://localhost:4000/api/emails/scheduled

# Check frontend .env.local
NEXT_PUBLIC_API_URL="http://localhost:4000"

# Frontend should show error in browser console if connection fails
# Open DevTools (F12) and check Network tab
```

### 8. **Emails Disappearing on Server Restart**

This is **normal if using in-memory storage**. Ensure:
- PostgreSQL is running: `docker-compose logs postgres`
- Redis is running: `docker-compose logs redis`
- Database migrations applied: `npx prisma migrate deploy`

All emails should be recoverable from the database.

---

## 📚 Additional Resources

- **Ethereal Email:** https://ethereal.email
- **Prisma Documentation:** https://www.prisma.io/docs
- **BullMQ Documentation:** https://docs.bullmq.io
- **Express Documentation:** https://expressjs.com
- **Next.js Documentation:** https://nextjs.org/docs

---

## 📝 License

This project is open-source and available under the MIT License.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Commit changes: `git commit -m "feat: description"`
3. Push to GitHub: `git push origin feat/your-feature`
4. Open a Pull Request

---

**Happy Scheduling! 🚀**
