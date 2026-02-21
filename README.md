# Predicto

Prediction market app: create markets, place YES/NO bets, resolve, and claim winnings. Backend + Supabase (no blockchain).

## Requirements

- **Node.js** 18+
- **Supabase** project (free tier is fine)
- **npm** (or yarn/pnpm)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` or `.env.local` and set:

| Variable                      | Required   | Description                                                                                                                                                                                                    |
| ----------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | Yes        | Supabase PostgreSQL connection string. In [Supabase](https://supabase.com) → Project Settings → Database → **Connection string** (URI). Use the **Transaction** pooler (port 6543) or **Session** (port 5432). |
| `AUTH_SECRET`                 | Yes        | Random secret for NextAuth (sessions). Generate with: `openssl rand -base64 32`                                                                                                                                |
| `AUTH_URL`                    | Yes (prod) | App URL, e.g. `http://localhost:3000` for local                                                                                                                                                                |
| `ADMIN_EMAILS`                | No         | Comma-separated emails that can create/resolve markets. Example: `you@example.com`                                                                                                                             |
| `RAZORPAY_KEY_ID`             | For Wallet | Razorpay API Key Id (test/live) from [Dashboard](https://dashboard.razorpay.com) → Settings → API Keys                                                                                                         |
| `RAZORPAY_KEY_SECRET`         | For Wallet | Razorpay API Key Secret                                                                                                                                                                                        |
| `RAZORPAY_WEBHOOK_SECRET`     | For Wallet | From Dashboard → Webhooks → Create; subscribe to `payment.captured`. Use the secret for signature verification.                                                                                                |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | For Wallet | Same as Key Id (or your publishable key); used by checkout on the client.                                                                                                                                      |

Example `.env`:

```env
DATABASE_URL="postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
AUTH_SECRET="your-32-char-secret-from-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
ADMIN_EMAILS="you@example.com"
```

### 3. Database

Create the tables in Supabase:

```bash
npm run db:push
```

(or `npx prisma migrate dev --name init` if you prefer migrations.)

## Run

**Development:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with any email (new users get a starter balance). Use an email listed in `ADMIN_EMAILS` to create and resolve markets from the Admin page. Go to **Wallet** to deposit via Razorpay (test mode supported) and view transaction history.

**Production build:**

```bash
npm run build
npm start
```

## Deploy to Vercel

1. **Push code to GitHub** (if not already):

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/predicto.git
   git push -u origin main
   ```

2. **Import on Vercel**
   - Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
   - Import your GitHub repo (e.g. `predicto`).
   - Leave **Framework Preset** as Next.js and **Root Directory** as `.`.

3. **Environment variables**  
   In the project → **Settings** → **Environment Variables**, add (for **Production** and optionally Preview):

   | Name                          | Value                                                                                     |
   | ----------------------------- | ----------------------------------------------------------------------------------------- |
   | `DATABASE_URL`                | Your Supabase connection string (same as local)                                           |
   | `AUTH_SECRET`                 | Same as local (e.g. from `openssl rand -base64 32`)                                       |
   | `AUTH_URL`                    | **Your Vercel URL**, e.g. `https://predicto.vercel.app` (replace with your actual domain) |
   | `ADMIN_EMAILS`                | Comma-separated admin emails                                                              |
   | `RAZORPAY_KEY_ID`             | Razorpay Key Id (test or live)                                                            |
   | `RAZORPAY_KEY_SECRET`         | Razorpay Key Secret                                                                       |
   | `RAZORPAY_WEBHOOK_SECRET`     | From Razorpay Dashboard → Webhooks                                                        |
   | `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Same as `RAZORPAY_KEY_ID` (used by checkout in the browser)                               |

   **Important:** Set `AUTH_URL` to your **production** URL (e.g. `https://your-app.vercel.app`). After the first deploy you’ll see the real URL; you can add it then and redeploy if needed.

4. **Deploy**  
   Click **Deploy**. Vercel will run `npm install` (which runs `prisma generate`) and `next build`.

5. **Razorpay webhook (so wallet balance updates)**
   - Razorpay Dashboard → **Settings** → **Webhooks** → your webhook (or create one).
   - **Webhook URL:** `https://YOUR_VERCEL_APP.vercel.app/api/razorpay/webhook`  
     (e.g. `https://predicto-xyz.vercel.app/api/razorpay/webhook`)
   - Enable **Payment Captured** (and any other events you need).
   - Save. Use the same secret in Vercel as `RAZORPAY_WEBHOOK_SECRET`.

6. **Database**  
   Tables should already exist from local `db:push`. If this is a fresh DB, run once locally with the same `DATABASE_URL` and `npx prisma db push`, or use Vercel’s **Build** logs to confirm Prisma runs; schema is applied when you first use the app with that DB.

---

## Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start dev server                         |
| `npm run build`      | Production build                         |
| `npm start`          | Start production server                  |
| `npm run db:push`    | Sync Prisma schema to DB (no migrations) |
| `npm run db:migrate` | Create and run migrations                |
| `npm run db:studio`  | Open Prisma Studio (DB UI)               |
