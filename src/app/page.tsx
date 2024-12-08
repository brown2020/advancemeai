"use client";

import Auth from "@/components/Auth";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <main className="space-y-24">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                Advance Your Future
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-transparent bg-clip-text">
                  One Step at a Time
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Master the SAT with personalized prep, practice tests, and
                expert strategies. Your journey to college success starts here.
              </p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <Auth buttonStyle="primary" />
            </div>
          </div>

          {/* Features Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-50 dark:bg-gray-800/50 rounded-3xl -z-10"></div>
            <div className="grid gap-8 p-8">
              {[
                {
                  title: "Adaptive Learning",
                  description:
                    "Questions adjust to your skill level for optimal learning progress. Our system learns from your responses to provide the most effective practice experience.",
                },
                {
                  title: "Detailed Analytics",
                  description:
                    "Track your progress and identify areas for improvement with comprehensive performance insights. Understand your strengths and weaknesses to focus your study time effectively.",
                },
                {
                  title: "Expert Strategies",
                  description:
                    "Learn proven techniques from top SAT instructors. Get access to tips and methods that have helped thousands of students improve their scores significantly.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg"
                >
                  <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
