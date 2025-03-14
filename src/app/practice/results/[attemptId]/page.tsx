"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { ROUTES } from "@/constants/appConstants";
import { useAuth } from "@/lib/auth";

// Mock test result data
interface TestResult {
  id: string;
  userId: string;
  sectionId: string;
  sectionTitle: string;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  completedAt: Date;
  questions: {
    id: string;
    text: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

// Mock function to get test results
async function getTestResult(attemptId: string): Promise<TestResult> {
  // In a real app, this would fetch from an API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: attemptId,
        userId: "user123",
        sectionId: "reading",
        sectionTitle: "Reading Comprehension",
        score: 7,
        totalQuestions: 10,
        timeSpent: 1200, // 20 minutes
        completedAt: new Date(),
        questions: [
          {
            id: "q1",
            text: "What is the main idea of the passage?",
            userAnswer: "Option A: The author's childhood experiences",
            correctAnswer: "Option D: The impact of technology on society",
            isCorrect: false,
          },
          {
            id: "q2",
            text: "According to the passage, what is the author's view on digital literacy?",
            userAnswer: "Option B: It is essential in the modern world",
            correctAnswer: "Option B: It is essential in the modern world",
            isCorrect: true,
          },
          // More questions would be here in a real app
        ],
      });
    }, 800);
  });
}

export default function TestResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const [attemptId, setAttemptId] = useState<string>("");
  const router = useRouter();
  const { user } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the attemptId from params
  useEffect(() => {
    async function loadParams() {
      try {
        const resolvedParams = await params;
        setAttemptId(resolvedParams.attemptId);
      } catch (err) {
        console.error("Failed to load params:", err);
        setError("Failed to load attempt parameters.");
      }
    }

    loadParams();
  }, [params]);

  // Load test result when attemptId is available
  useEffect(() => {
    async function loadTestResult() {
      if (!attemptId) return;

      try {
        setIsLoading(true);
        const data = await getTestResult(attemptId);
        setResult(data);
      } catch (err) {
        console.error("Failed to load test result:", err);
        setError("Failed to load test results. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTestResult();
  }, [attemptId]);

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must be logged in to view test results.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !result) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <p>Loading test results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-3xl mx-auto mb-6">
        <CardHeader>
          <CardTitle>Test Results: {result.sectionTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Score</p>
              <p className="text-2xl font-bold">
                {result.score} / {result.totalQuestions}
              </p>
              <p className="text-sm text-muted-foreground">
                {Math.round((result.score / result.totalQuestions) * 100)}%
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Time Spent</p>
              <p className="text-2xl font-bold">
                {formatTime(result.timeSpent)}
              </p>
              <p className="text-sm text-muted-foreground">
                Completed on {new Date(result.completedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-4">Question Review</h3>
          <div className="space-y-6">
            {result.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <div className="mt-1">
                    {question.isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      Question {index + 1}: {question.text}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">Your answer:</span>{" "}
                      <span
                        className={
                          question.isCorrect ? "text-green-600" : "text-red-600"
                        }
                      >
                        {question.userAnswer}
                      </span>
                    </p>
                    {!question.isCorrect && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Correct answer:</span>{" "}
                        <span className="text-green-600">
                          {question.correctAnswer}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push(ROUTES.PRACTICE.INDEX)}>
            Back to Practice Tests
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
