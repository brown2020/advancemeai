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

export default function PracticePage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<TestSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const data = await getAllTestSections();
        setSections(data);
      } catch (err) {
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
  }, []);

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="SAT Practice Tests" />
        <p>Please sign in to access practice tests.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="SAT Practice Tests" />

      <div className="text-center mb-8">
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Choose a section to practice. Our AI-powered system will adapt to your
          skill level and help you improve your performance.
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
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <span>{section.timeLimit} minutes</span>
                <span>{section.questionCount} questions</span>
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
    </PageContainer>
  );
}
