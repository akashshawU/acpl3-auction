# ACPL 3 — Cricket Player Auction Management System

A complete, production-ready live auction system for ACPL Season 3. Built for real-time bidding with 4 teams, 40+ players, and a stunning projector screen.

---

## Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Neon for cloud)
- Redis (optional — falls back to in-memory)
- Cloudinary account (for photo uploads)

---

## Local Setup

### 1. Clone and install

```bash
cd acpl3
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `ADMIN_EMAIL` | Admin login email |
| `ADMIN_PASSWORD` | Admin login password |
| `CLOUDINARY_*` | Cloudinary credentials |
| `REDIS_URL` | Redis URL (optional) |

### 3. Database setup

```bash
npm run db:migrate     # Run migrations
npm run db:seed        # Seed admin, teams, captains, 20 sample players
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Docker Setup

```bash
cp .env.example .env.local
# Fill in Cloudinary and NEXTAUTH_SECRET in .env.local

docker-compose up --build
```

Then run migrations inside the container:

```bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npm run db:seed
```

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@acpl3.com | ChangeMe123! |
| Captain 1 | captain1@acpl3.com | Captain123! |
| Captain 2 | captain2@acpl3.com | Captain123! |
| Captain 3 | captain3@acpl3.com | Captain123! |
| Captain 4 | captain4@acpl3.com | Captain123! |

**Players** log in with mobile + OTP. In dev mode, the OTP is shown in the UI.

---

## Running an Auction (Workflow)

1. **Admin Login** → `/login` with admin credentials
2. **Review Players** → `/admin/players` — Approve/Reject registered players, set base prices and auction order
3. **Setup Auction** → `/admin/auction/setup` — Configure timer (10–60s), bid increment (1/2/5/10 pts), drag to reorder players → **Launch Auction**
4. **Open Projector Screen** → `/auction/live` — Open in a browser on the big screen/TV
5. **Captains Login** → On their phones, go to `/captain/dashboard`
6. **Admin Control** → `/admin/auction/control` — Click **Next Player** to put a player on block, timer starts automatically
7. **Captains Bid** → BID NOW button on their dashboards
8. **Admin actions**: Mark Sold / Mark Unsold / Undo Bid / Pause / Resume
9. **End Auction** → Click End Auction → View analytics at `/admin/analytics`
10. **Export** → PDF/Excel from admin dashboard

---

## Socket.IO Architecture

The app uses a **custom Next.js server** (`server.ts`) that runs both Next.js and Socket.IO on the same port.

- All auction state changes are broadcast via Socket.IO to all connected clients
- Redis adapter enables multi-instance horizontal scaling
- If socket disconnects, the client falls back to polling every 5 seconds
- Timer runs on the server (in `server.ts`) to prevent client manipulation
- On reconnect, clients can emit `auction:sync` to get the full current state

### Events

**Server → All clients:**
- `auction:state` — Full state sync (on join/reconnect)
- `auction:bid` — New bid placed
- `auction:timer` — Countdown tick
- `auction:sold` — Player sold
- `auction:unsold` — Player unsold
- `auction:paused` / `auction:resumed`
- `auction:ended` — With full summary

---

## ACPL Rating Formula

```
score = min(100, round(
  runs/10 +
  wickets×5 +
  strikeRate/10 +
  max(0, (10 - economyRate)×3) +
  momAwards×5
))
```

| Score | Category |
|---|---|
| 85–100 | Elite |
| 75–84 | A+ |
| 60–74 | A |
| 45–59 | B+ |
| 30–44 | B |
| 0–29 | C |

Admin can override any player's rating.

---

## Deployment to Vercel

1. Create a [Neon](https://neon.tech) PostgreSQL database
2. Update `DATABASE_URL` in Vercel env vars
3. Use [Upstash Redis](https://upstash.com) for `REDIS_URL`

> ⚠️ **Important**: Vercel's serverless functions don't support persistent Socket.IO. For production use with real-time features, deploy to a VPS (Railway, Render, Fly.io, DigitalOcean) using `npm start` (the custom server).

For Vercel (degraded mode — no real-time, polling only):
```bash
# Set in Vercel dashboard
NEXTAUTH_URL=https://your-domain.vercel.app
```

---

## Troubleshooting

**`Cannot connect to Redis`** — Redis is optional. The app falls back to in-memory Socket.IO adapter. Set `REDIS_URL` to skip.

**`Prisma Client not generated`** — Run `npm run db:generate`

**`OTP not working`** — In dev mode, the OTP is displayed in the login UI. In production, implement your SMS/email provider in `/api/auth/otp/route.ts`.

**Socket not connecting** — Ensure you're running the app via `npm run dev` (the custom server), not `next dev`.

**`NEXTAUTH_SECRET` error** — Generate with: `openssl rand -base64 32`
