import TestSections from "@/components/TestSections";

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            SAT Practice Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose a section to practice. Our AI-powered system will adapt to
            your skill level and help you improve your performance.
          </p>
        </div>
        <TestSections />
      </div>
    </div>
  );
}
