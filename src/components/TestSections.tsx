"use client";

import { useState } from "react";
import Link from "next/link";

type TestSection = {
  id: string;
  title: string;
  duration: string;
  questions: number;
  description: string;
  icon: React.ReactNode;
};

const sections: TestSection[] = [
  {
    id: "reading",
    title: "Reading",
    duration: "65 minutes",
    questions: 52,
    description:
      "Passages from literature, historical documents, social sciences, and natural sciences.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    id: "writing",
    title: "Writing and Language",
    duration: "35 minutes",
    questions: 44,
    description:
      "Grammar, punctuation, sentence structure, and clarity improvements.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    ),
  },
  {
    id: "math-calc",
    title: "Math (Calculator)",
    duration: "55 minutes",
    questions: 38,
    description: "Advanced math problems where calculator usage is permitted.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: "math-no-calc",
    title: "Math (No Calculator)",
    duration: "25 minutes",
    questions: 20,
    description: "Core math concepts tested without calculator assistance.",
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
    ),
  },
];

export default function TestSections() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Choose a Test Section
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className={`p-6 rounded-xl transition-all cursor-pointer ${
              selectedSection === section.id
                ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                : "bg-white dark:bg-gray-800 hover:shadow-md"
            }`}
            onClick={() => setSelectedSection(section.id)}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="text-blue-600 dark:text-blue-400">
                  {section.icon}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {section.title}
                </h3>
                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <span>{section.duration}</span>
                  <span>{section.questions} questions</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {section.description}
                </p>
                {selectedSection === section.id && (
                  <Link
                    href={`/test/${section.id}`}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Practice Test
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
