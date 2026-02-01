# CLAUDE.md - AdvanceMe AI

This file provides guidance for Claude Code (claude.ai/code) when working with this codebase.

## Project Overview

AdvanceMe AI is an intelligent SAT preparation platform built with Next.js 16. It uses AI-powered question generation and adaptive learning algorithms to help students prepare for the SAT.

**Key Features:**
- Adaptive learning with difficulty scaling (1-5)
- SAT practice sections: Reading, Writing & Language, Math (Calculator/No Calculator)
- AI-generated questions using OpenAI gpt-4.1-mini
- Flashcard system with spaced repetition
- Progress tracking and analytics

## Tech Stack

- **Framework:** Next.js 16.0.3 (App Router)
- **Frontend:** React 19, TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4.0
- **State Management:** Zustand 5.0
- **Backend:** Firebase (Auth, Firestore, Storage)
- **AI:** OpenAI SDK + Vercel AI SDK for streaming
- **Validation:** Zod 4.1
- **UI Components:** Radix UI primitives, Lucide icons

## Common Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run Jest tests
npm run test:watch   # Jest watch mode
npm run test:coverage # Jest with coverage
```

## Architecture

```
src/
├── app/                    # Next.js App Router (pages & API routes)
│   └── api/               # REST API endpoints
├── components/            # React components
│   └── ui/               # Atomic UI primitives (shadcn-style)
├── lib/                  # Core business logic
│   ├── auth.tsx          # Client auth context
│   ├── server-auth.ts    # Server-side auth utilities
│   └── ai/               # AI question generation
├── services/             # Service layer (caching, business logic)
├── api/firebase/         # Repository layer (Firebase CRUD)
├── stores/               # Zustand state stores
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── constants/            # App-wide constants
├── config/               # Firebase & environment config
└── utils/                # Utility functions
```

### Layer Pattern

```
Presentation (React Components)
    ↓
Service Layer (Business Logic, Caching) - src/services/
    ↓
Repository Layer (Firebase CRUD) - src/api/firebase/
    ↓
Firebase Infrastructure
```

## Key Patterns

### Service Layer with Caching
Services in `src/services/` use `createCachedService` wrapper:
- Automatic caching with 10-minute expiration
- Request deduplication to prevent duplicate API calls
- Cache invalidation on mutations

### Zustand Stores
Located in `src/stores/`:
- `flashcard-study-store.ts` - Study progress, mastery levels
- `flashcard-library-store.ts` - Flashcard set management
- Uses persist middleware for localStorage

### Server/Client Separation
- `"use client"` directive for interactive components
- Server-only utilities in `lib/server-*.ts`
- Separate Firebase client (`config/firebase.ts`) and admin (`config/firebase-admin.ts`) configs

## Key API Routes

| Path | Purpose |
|------|---------|
| `/api/ai/questions` | Generate SAT questions |
| `/api/ai/explain-mistake` | AI explanation of incorrect answers |
| `/api/auth/session` | Session cookie management |
| `/api/practice-tests/sessions` | Practice test session CRUD |
| `/api/flashcard-performance` | Track flashcard metrics |

## Environment Variables

**Required for development** (see `.env.example`):

```env
# Firebase Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# OpenAI
OPENAI_API_KEY=

# Optional
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_ALLOW_TEST_MODE=false
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Naming Conventions

- **Services:** `*Service.ts` (e.g., `flashcardService.ts`)
- **Repositories:** `*Repository.ts` (e.g., `flashcardRepository.ts`)
- **Stores:** `*-store.ts` (e.g., `flashcard-study-store.ts`)
- **Hooks:** `use*` (e.g., `useFlashcards`)
- **Constants:** UPPER_SNAKE_CASE
- **Types/Interfaces:** PascalCase

## Important Files

- `src/lib/ai/question-generation.ts` - AI question generation logic
- `src/utils/cachedService.ts` - Generic caching utility
- `src/utils/apiValidation.ts` - Zod request validation schemas
- `src/utils/errorUtils.ts` - Custom AppError class
- `src/config/env.ts` - Zod-validated environment parsing

## Testing

Jest is configured but test files are minimal. Create tests as `*.test.ts` or `*.spec.ts` co-located with source files.

## Deployment

Deployed on **Vercel** with 300s function timeout (configured in `vercel.json`).

## Notes for Claude

1. **TypeScript strict mode** is enabled - maintain type safety
2. **Zod validation** is used for API requests - add schemas for new endpoints
3. **Firebase security rules** exist in `firestore.rules` and `storage.rules`
4. **AI model** is `gpt-4.1-mini` - referenced in question generation
5. **Mock questions** fallback exists if AI generation fails
6. **Theme** supports light/dark mode via `components/theme/`
