# QuizForm

QuizForm is a web app for teachers to build timed quizzes and share a link with students. Students join with their name and class—no account needed. Teachers sign in with Google, manage quizzes from a dashboard, and review or export results.

There is no separate Node/Express backend in this repo. The **database and API** live on [Supabase](https://supabase.com) (PostgreSQL + Auth + Edge Functions). The **frontend** is a React app you run locally with Vite.

---

## What you need installed

- [Node.js](https://nodejs.org/) 18 or newer (LTS is fine)
- npm (comes with Node)
- A free [Supabase](https://supabase.com) account (for the database)
- Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) if you want to deploy Edge Functions from your machine

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4, CSS modules where used |
| UI components | shadcn/ui-style components (Base UI, Radix patterns), Lucide icons |
| Backend / database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth for teachers) |
| Student quiz API | Supabase Edge Functions (Deno): `start-quiz-attempt`, `check-quiz-attempt`, `submit-quiz` |
| Tables / data grid | TanStack React Table |
| Notifications | Sonner |
| Export | SheetJS (`xlsx`) for Excel download on results page |
| Animation | Motion, Flip countdown (`@pqina/flip`) |
| Deploy (optional) | Vercel (`vercel.json` SPA rewrite) |

---

## Project layout (short)

```
QuizForm/
├── src/                    # React app (pages, components, hooks)
├── supabase/
│   ├── schema.sql          # Main database tables + RLS policies
│   ├── migrations/         # Extra SQL patches (run after schema.sql)
│   └── functions/          # Edge Functions for student quiz flow
├── public/
├── .env                    # Your Supabase URL + anon key (create locally)
└── package.json
```

---

## Database setup

### Database used

**PostgreSQL**, hosted on **Supabase**. Tables store quizzes, classes, questions, answer options, student submissions, and per-question answers. Row Level Security (RLS) keeps each teacher’s data private while still allowing anonymous students to take a quiz via a public link.

### Files to initialize the database

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Creates all tables, indexes, and base RLS policies |
| `supabase/migrations/20260213120000_answers_selected_option_ids.sql` | Multi-select answer column (safe to run; uses `IF NOT EXISTS`) |
| `supabase/migrations/20260515120000_guest_submission_policies.sql` | Guest/anonymous submission policies |
| `supabase/migrations/20260515130000_restrict_public_rls_to_anon.sql` | Tightens public read/write so only the `anon` role sees student-facing data |

Run them **in that order** on a new Supabase project.

### Steps (Supabase cloud)

1. Go to [supabase.com](https://supabase.com) → **New project** → pick a name, password, and region.
2. Wait until the project is ready.
3. Open **SQL Editor** → **New query**.
4. Copy the full contents of `supabase/schema.sql`, paste, and click **Run**.
5. For each file in `supabase/migrations/`, open a new query, paste the file, and **Run** (same order as the table above).
6. Under **Project Settings → API**, copy:
   - **Project URL** → use as `VITE_SUPABASE_URL`
   - **anon public** key → use as `VITE_SUPABASE_ANON_KEY`

You do not need to install PostgreSQL on your PC if you use Supabase cloud—the hosted database is enough.

### Auth (teachers)

1. In Supabase: **Authentication → Providers** → enable **Google** and add your OAuth client ID/secret from [Google Cloud Console](https://console.cloud.google.com/).
2. Under **Authentication → URL Configuration**, add your site URL (e.g. `http://localhost:5173`) and redirect URLs, including `http://localhost:5173/dashboard` for after login.

Students do not log in; they only use the quiz link (`/q/:token`).

### Edge Functions (required for real student quizzes)

The student flow (start attempt, check duplicate name, submit answers) calls three functions in `supabase/functions/`:

- `start-quiz-attempt`
- `check-quiz-attempt`
- `submit-quiz`

Deploy them to the **same** Supabase project:

```bash
# One-time: install CLI and log in
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# From the QuizForm folder root
supabase functions deploy start-quiz-attempt
supabase functions deploy check-quiz-attempt
supabase functions deploy submit-quiz
```

`YOUR_PROJECT_REF` is the ID in your project URL (`https://YOUR_PROJECT_REF.supabase.co`).

Supabase sets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically for deployed functions—you do not add those to `.env` on the frontend.

**Note:** `/demo` on the frontend uses local demo data and does not need the database or Edge Functions. Live quizzes at `/q/:token` do.

---

## Environment variables

Create a file named `.env` in the project root (same folder as `package.json`):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
```

Restart `npm run dev` after changing `.env`.

Do not commit real keys to public repos. Share keys with your teacher only through whatever channel your course allows (e.g. separate document or submission form).

---

## How to run the application

Follow this order: **database first** (SQL above), **Edge Functions** (if testing student submit flow), **then frontend**.

### 1. Database

Complete the [Database setup](#database-setup) section so tables and policies exist.

### 2. Backend (Supabase + functions)

- Supabase cloud is always “running” once the project exists.
- Deploy the three Edge Functions if students should start and submit quizzes (see above).

There is no `npm run server` or separate backend port in this project.

### 3. Frontend

```bash
# In the QuizForm folder
npm install
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173**).

### Other npm scripts

| Command | What it does |
|---------|----------------|
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Using the app (quick guide)

| URL | Who | What |
|-----|-----|------|
| `/` | Everyone | Landing page |
| `/login` or `/?signin=1` | Teacher | Sign in with Google |
| `/dashboard` | Teacher | Overview (protected) |
| `/dashboard/quizzes` | Teacher | List and manage quizzes |
| `/dashboard/quiz/create` | Teacher | Create quiz |
| `/dashboard/quiz/:id` | Teacher | Edit quiz |
| `/dashboard/quiz/:id/results` | Teacher | Scores + Excel export |
| `/dashboard/submissions` | Teacher | All submissions |
| `/dashboard/classes` | Teacher | Classes overview |
| `/q/:token` | Student | Take a live quiz (token from teacher’s share link) |
| `/demo` | Anyone | Try a sample quiz without Supabase |

After creating a quiz, use the share link from the editor so students open `/q/...` with the quiz’s public token.

---

## Team members

| No. | Member's name |
|-----|----------------|
| 1 | ហាប់ សិរីសុធាវី |
| 2 | ម៉ៅ មន្នីរដ្ឋា |
| 3 | ភី មុន្នី |
| 4 | កែវ ចាន់ឌី |
| 5 | អ៊ុត ម៉ាលីន |
| 6 | រស់ ឈុនហាក់ |
| 7 | មឿត ម៉ានិត |
| 8 | យ៉ាន សុខចាន់ |
