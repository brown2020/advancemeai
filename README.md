# AdvanceMe AI

AI-assisted study platform for flashcards, SAT-style adaptive practice, quizzes, classes, live sessions, progress tracking, and study-guide generation. Live demo: [https://advancemeai.vercel.app](https://advancemeai.vercel.app)

## Features

Verified from the current codebase:

- **Flashcards** — create and import sets, folders, image uploads, and study modes (learn, match, write, test) with spaced-repetition support
- **SAT prep** — section practice and full-length tests with adaptive difficulty and AI-generated SAT-style questions
- **Quizzes** — create and take multiple-choice quizzes
- **AI study guides** — turn notes into study material via OpenAI
- **Classes / study groups** — create or join groups, share content, and view class progress
- **Live sessions** — host or join live quiz rounds by code
- **Progress & gamification** — analytics, streaks, XP, levels, and achievements
- **Auth & profiles** — Firebase Auth (email/password and Google), public user profiles, search
- **Theming** — light/dark mode

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix UI, Lucide |
| Language | TypeScript 6 (strict) |
| Validation | Zod 4 |
| State | Zustand 5 |
| Auth / DB / Storage | Firebase Auth, Firestore, Cloud Storage (client + Admin) |
| AI | OpenAI (`gpt-4.1` questions, `gpt-4o-mini` chat, `gpt-4.1-mini` fast) via `openai` + Vercel AI SDK |
| Tests | Jest 30 + ts-jest |
| Lint | ESLint 10 |
| Deploy | Vercel (`vercel.json` maxDuration 300s); Firebase rules/indexes in-repo |

Node **22** is used in CI. `.npmrc` sets `legacy-peer-deps=true`.

## Project structure

```
advancemeai/
├── src/
│   ├── app/                 # App Router pages + API routes
│   ├── components/          # UI by domain (flashcards, practice, live, …)
│   ├── services/            # Business logic
│   ├── api/firebase/        # Firestore repositories
│   ├── lib/                 # Auth, sessions, AI helpers, analytics
│   ├── stores/              # Zustand stores
│   ├── config/              # Firebase + env validation
│   ├── hooks/, types/, utils/, constants/
├── docs/ENV_EXAMPLE.md      # Env var reference
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── firebase.json
├── vercel.json
└── .github/workflows/ci.yml
```

Notable app routes: `/`, `/flashcards`, `/practice`, `/quizzes`, `/groups`, `/live`, `/study-guides`, `/progress`, `/profile`, `/search`, `/users/[username]`, `/auth/*`.

## Getting started

### Prerequisites

- Node.js 22+ (matches CI)
- npm
- Firebase project (Auth, Firestore, Storage)
- OpenAI API key (for AI features)

### Install

```bash
git clone https://github.com/brown2020/advancemeai.git
cd advancemeai
git checkout dev
npm install
```

### Environment

Copy the template from `docs/ENV_EXAMPLE.md` into `.env.local`. Never commit real secrets.

```bash
cp docs/ENV_EXAMPLE.md .env.local   # then edit values
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Name | Purpose | Where to get it |
|------|---------|-----------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web SDK | Firebase Console → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender ID | Same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app ID | Same |
| `NEXT_PUBLIC_BASE_URL` | Public site URL (e.g. `http://localhost:3000`) | You |
| `NEXT_PUBLIC_DEBUG` | Debug logging (`true`/`false`) | Optional |
| `NEXT_PUBLIC_ALLOW_TEST_MODE` | Enable test-mode UI | Optional |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | Point client at emulators | Optional (local only) |
| `FIREBASE_PROJECT_ID` | Admin SDK project ID | Service account JSON |
| `FIREBASE_CLIENT_EMAIL` | Admin SDK client email | Service account JSON |
| `FIREBASE_PRIVATE_KEY` | Admin SDK private key (`\n` escaped) | Service account JSON |
| `OPENAI_API_KEY` | OpenAI API access | [platform.openai.com](https://platform.openai.com) |
| `OPENAI_QUESTION_MODEL` | Override question model (default `gpt-4.1`) | Optional |

Firebase Admin alternatives (pick one style): `FIREBASE_ADMIN_*` split vars, or a full JSON blob in `FIREBASE_SERVICE_ACCOUNT_KEY` / `FIREBASE_SERVICE_ACCOUNT_JSON` (and `*_BASE64` / other aliases listed in `docs/ENV_EXAMPLE.md`). Emulator hosts: `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`.

In Firebase Console: enable Google, Email/Password, and email-link sign-in; add localhost and production domains under Authorized domains.

## Firebase setup

- Rules: `firestore.rules`, `storage.rules`
- Indexes: `firestore.indexes.json` (referenced from `firebase.json`)

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest |
| `npm run test:watch` | Jest watch mode |
| `npm run test:coverage` | Jest with coverage |

## Testing and CI

GitHub Actions (`.github/workflows/ci.yml`) on `dev` / `main` and PRs: `npm ci` → lint → typecheck → test → build. Node 22. Required CI secrets: the six `NEXT_PUBLIC_FIREBASE_*` vars plus `NEXT_PUBLIC_BASE_URL`. Runtime secrets (`FIREBASE_*` Admin, `OPENAI_API_KEY`) are for deploy/runtime, not required for the CI workflow itself.

## Deployment

- **Vercel** — production tracks `main`; `vercel.json` sets function `maxDuration` to 300s under `src/app/**/*`
- Set the same env vars in the Vercel project settings
- Deploy Firebase rules/indexes separately when they change

## Contributing

- `main` — production
- `dev` — integration branch

See [AGENTS.md](./AGENTS.md) for agent workflow and [spec.md](./spec.md) for product scope. Branch from `dev`, keep changes focused, and open PRs into `dev`.

## License

[GNU Affero General Public License v3](./LICENSE.md) (AGPL-3.0).
