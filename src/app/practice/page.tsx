"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  getAllTestSections,
  TestSection,
} from "@/services/practiceTestService";
import { ROUTES } from "@/constants/appConstants";
import {
  PageContainer,
  PageHeader,
  LoadingState,
  ErrorDisplay,
  CardGrid,
  SectionContainer,
  ActionLink,
} from "@/components/common/UIComponents";
import Auth from "@/components/Auth";
import PracticeDebug from "./debug";

export default function PracticePage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<TestSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    // Enable debug mode
    if (process.env.NEXT_PUBLIC_DEBUG === "true") {
      setShowDebug(true);
    }

    // Check for test mode
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const testMode = urlParams.get("test") === "true";
      setIsTestMode(testMode);

      if (testMode) {
        console.log("Test mode enabled - bypassing authentication");
      }
    }

    // Fetch sections if user is authenticated or in test mode
    if (user || isTestMode) {
      const fetchSections = async () => {
        try {
          setLoading(true);
          const data = await getAllTestSections();
          setSections(data);
        } catch (err) {
          console.error("Error fetching sections:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch practice test sections"
          );
        } finally {
          setLoading(false);
        }
      };
      fetchSections();
    } else {
      setLoading(false);
    }
  }, [user, isTestMode]);

  return (
    <PageContainer>
      <PageHeader title="SAT Practice Tests" />

      {/* Debug toggle button */}
      <div className="text-right mb-4">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {showDebug ? "Hide Debug Info" : "Show Debug Info"}
        </button>
      </div>

      {/* Debug information - shown conditionally */}
      {showDebug && <PracticeDebug />}

      {!user && !isTestMode ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow-sm mt-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-6 rounded-full bg-blue-50 p-6 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Sign in to access Practice Tests
            </h2>
            <p className="text-gray-600 mb-6">
              Our AI-powered practice tests are personalized to your skill level
              and help you improve gradually.
            </p>
            <div className="w-full max-w-sm">
              <Auth buttonStyle="practice" />
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Don&apos;t have an account? Sign up for free by clicking the
              button above.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose a section to practice. Our AI-powered system will adapt to
              your skill level and help you improve your performance.
            </p>
          </div>

          {error && <ErrorDisplay message={error} />}

          {loading ? (
            <LoadingState message="Loading practice test sections..." />
          ) : (
            <CardGrid>
              {sections.map((section) => (
                <SectionContainer key={section.id}>
                  <h2 className="text-lg font-bold mb-2">{section.title}</h2>
                  <div className="text-sm text-blue-600 mb-3">
                    <span>AI-Generated Practice Questions</span>
                  </div>
                  <p className="text-gray-600 mb-4">{section.description}</p>
                  <div className="mt-4">
                    <ActionLink
                      href={ROUTES.PRACTICE.SECTION(section.id)}
                      variant="primary"
                    >
                      Start Practice
                    </ActionLink>
                  </div>
                </SectionContainer>
              ))}
            </CardGrid>
          )}
        </>
      )}
    </PageContainer>
  );
}
