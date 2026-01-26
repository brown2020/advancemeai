# AdvanceMe AI - SAT Practice Platform

An intelligent SAT preparation platform that adapts to your skill level using AI-powered question generation and adaptive learning algorithms.

## Features

- **Adaptive Learning**: Questions automatically adjust to your skill level for optimal learning progress
- **Multiple Test Sections**: Practice specific SAT sections:
  - Reading Comprehension
  - Writing and Language
  - Math (Calculator)
  - Math (No Calculator)
- **AI-Generated Questions**: Utilizes gpt-4.1 to create unique, SAT-style questions
- **Detailed Explanations**: Comprehensive explanations for every question
- **Progress Tracking**: Monitor your improvement across different sections
- **Dark Mode Support**: Comfortable studying experience in any lighting condition

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Firebase account (with Firestore, Auth, and Storage enabled)
- OpenAI API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/advancemeai.git
cd advancemeai
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory (see `.env.example` for all required variables):

```env
# Public Environment Variables
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_ALLOW_TEST_MODE=false
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Firebase Client Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Server-Only Environment Variables
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_service_account_private_key"
OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
advancemeai/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   ├── components/             # Reusable React components
│   │   ├── auth/              # Authentication components
│   │   ├── flashcards/        # Flashcard-related components
│   │   ├── home/              # Home page components
│   │   ├── practice/          # Practice test components
│   │   ├── theme/             # Theme provider
│   │   └── ui/                # UI primitives (shadcn-style)
│   ├── lib/                   # Core libraries (auth, server utils)
│   ├── services/              # Business logic layer
│   ├── api/firebase/          # Firebase repository layer
│   ├── hooks/                 # Custom React hooks
│   ├── stores/                # Zustand state management
│   ├── types/                 # TypeScript type definitions
│   ├── constants/             # Application constants
│   ├── config/                # Configuration (Firebase, env validation)
│   └── utils/                 # Utility functions
├── public/                    # Static assets
└── ...config files
```

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Frontend**: React 19
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand 5.0
- **Authentication**: Firebase Auth (client + server sessions)
- **Database**: Firebase Firestore
- **Storage**: Firebase Cloud Storage
- **AI Integration**: 
  - OpenAI GPT-4.1-mini (question generation)
  - Vercel AI SDK (streaming responses)
- **Type Safety**: TypeScript 5 (strict mode)
- **Validation**: Zod 4.1
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Deployment**: Vercel

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Architecture

### Service Layer Pattern
The application follows a clean architecture with clear separation of concerns:

1. **Presentation Layer**: React components (Server & Client)
2. **Service Layer**: Business logic and caching (`src/services/`)
3. **Repository Layer**: Data access abstraction (`src/api/firebase/`)
4. **Infrastructure Layer**: Firebase, OpenAI, external services

### Key Features
- **Caching**: LRU cache with automatic invalidation
- **Request Deduplication**: Prevents duplicate API calls
- **Type Safety**: End-to-end TypeScript with Zod validation
- **Error Handling**: Custom error types with context
- **Logging**: Structured logging with levels
- **Security**: HttpOnly cookies, Firebase security rules

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Firebase](https://firebase.google.com/) - Backend and Authentication
- [OpenAI](https://openai.com/) - AI Question Generation
- [Vercel AI SDK](https://sdk.vercel.ai/) - AI streaming capabilities
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Vercel](https://vercel.com/) - Deployment Platform

## Support

For support, email support@advancemeai.com or open an issue in this repository.
