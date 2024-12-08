# AdvanceMe AI - SAT Practice Platform

An intelligent SAT preparation platform that adapts to your skill level using AI-powered question generation and adaptive learning algorithms.

## Features

- **Adaptive Learning**: Questions automatically adjust to your skill level for optimal learning progress
- **Multiple Test Sections**: Practice specific SAT sections:
  - Reading Comprehension
  - Writing and Language
  - Math (Calculator)
  - Math (No Calculator)
- **AI-Generated Questions**: Utilizes GPT-4o to create unique, SAT-style questions
- **Detailed Explanations**: Comprehensive explanations for every question
- **Progress Tracking**: Monitor your improvement across different sections
- **Dark Mode Support**: Comfortable studying experience in any lighting condition

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- Firebase account
- OpenAI API key
- Anthropic API key (optional)
- Google Cloud API key (optional)

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

3. Create a `.env.local` file in the root directory with your API keys:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_AI_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key
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
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable React components
│   ├── lib/                 # Utility functions and hooks
│   ├── firebase/           # Firebase configuration
│   └── styles/             # Global styles and CSS modules
├── public/                 # Static assets
└── ...config files
```

## Technology Stack

- **Frontend**: Next.js 15, React 19
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **AI Integration**: OpenAI GPT-4o
- **Type Safety**: TypeScript
- **UI Components**: Headless UI

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Firebase](https://firebase.google.com/) - Backend and Authentication
- [OpenAI](https://openai.com/) - AI Question Generation
- [Vercel](https://vercel.com/) - Deployment Platform

## Support

For support, email support@advancemeai.com or open an issue in this repository.
