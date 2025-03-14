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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import {
  Question,
  getSectionQuestions,
  submitTestAttempt,
} from "@/services/practiceTestService";
import { ROUTES } from "@/constants/appConstants";
import { useAuth } from "@/lib/auth";

// Create inline Label component
const Label = ({
  htmlFor,
  className,
  children,
  ...props
}: {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) => (
  <label
    htmlFor={htmlFor}
    className={`text-sm font-medium leading-none ${className || ""}`}
    {...props}
  >
    {children}
  </label>
);

// Create inline Skeleton component
const Skeleton = ({
  className,
  ...props
}: {
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={`animate-pulse rounded-md bg-gray-200 ${className || ""}`}
    {...props}
  />
);

export default function PracticeSectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const [sectionId, setSectionId] = useState<string>("");
  const router = useRouter();
  const { user } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState<number>(Date.now());

  // New state for feedback
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<{
    score: number;
    totalAnswered: number;
    correctAnswers: string[];
  }>({
    score: 0,
    totalAnswered: 0,
    correctAnswers: [],
  });

  // Load the sectionId from params
  useEffect(() => {
    async function loadParams() {
      try {
        const resolvedParams = await params;
        setSectionId(resolvedParams.sectionId);
      } catch (err) {
        console.error("Failed to load params:", err);
        setError("Failed to load section parameters.");
      }
    }

    loadParams();
  }, [params]);

  // Load questions when sectionId is available
  useEffect(() => {
    async function loadQuestions() {
      if (!sectionId) return;

      try {
        setIsLoading(true);
        const fetchedQuestions = await getSectionQuestions(sectionId);
        setQuestions(fetchedQuestions);
        setError(null);
      } catch (err) {
        console.error("Failed to load questions:", err);
        setError("Failed to load questions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [sectionId]);

  const currentQuestion = questions[currentQuestionIndex];

  const handlePrevious = () => {
    setShowFeedback(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleAnswerSelect = (value: string) => {
    if (!currentQuestion) return;

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: value,
    });

    // Reset feedback when a new answer is selected
    setShowFeedback(false);
  };

  const checkAnswer = () => {
    if (!currentQuestion || !selectedAnswers[currentQuestion.id]) return;

    const isAnswerCorrect =
      selectedAnswers[currentQuestion.id] === currentQuestion.correctAnswer;
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    // Update results
    if (isAnswerCorrect) {
      setResults((prev) => ({
        ...prev,
        score: prev.score + 1,
        totalAnswered: prev.totalAnswered + 1,
        correctAnswers: [...prev.correctAnswers, currentQuestion.id],
      }));
    } else {
      setResults((prev) => ({
        ...prev,
        totalAnswered: prev.totalAnswered + 1,
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000); // Convert to seconds

      const response = await submitTestAttempt({
        userId: user.uid,
        sectionId,
        answers: selectedAnswers,
        timeSpent,
        completedAt: new Date(),
        score: results.score,
        totalQuestions: questions.length,
      });

      // Redirect to results page after submission
      router.push(ROUTES.PRACTICE.RESULTS(response.id));
    } catch (err) {
      console.error("Failed to submit answers:", err);
      setError("Failed to submit your answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You must be logged in to access practice tests.
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-8 w-3/4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No questions found for this section.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-lg font-medium">{currentQuestion.text}</p>
          </div>
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 rounded-md border p-3 ${
                  showFeedback && option === currentQuestion.correctAnswer
                    ? "border-green-500 bg-green-50"
                    : showFeedback &&
                      option === selectedAnswers[currentQuestion.id] &&
                      option !== currentQuestion.correctAnswer
                    ? "border-red-500 bg-red-50"
                    : ""
                }`}
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  disabled={showFeedback}
                />
                <Label htmlFor={`option-${index}`} className="flex-grow">
                  {option}
                </Label>
                {showFeedback && option === currentQuestion.correctAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {showFeedback &&
                  option === selectedAnswers[currentQuestion.id] &&
                  option !== currentQuestion.correctAnswer && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
              </div>
            ))}
          </RadioGroup>

          {/* Feedback section */}
          {showFeedback && (
            <div
              className={`mt-6 p-4 rounded-md ${
                isCorrect
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-1" />
                )}
                <div>
                  <p className="font-medium mb-2">
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </p>
                  {currentQuestion.explanation && (
                    <p className="text-sm">
                      <span className="font-medium">Explanation:</span>{" "}
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-sm">
              <span className="font-medium">Progress:</span>{" "}
              {results.totalAnswered} of {questions.length} answered
            </p>
            <p className="text-sm">
              <span className="font-medium">Score:</span> {results.score}{" "}
              correct (
              {results.totalAnswered > 0
                ? Math.round((results.score / results.totalAnswered) * 100)
                : 0}
              %)
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="mr-2"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
              variant="outline"
            >
              Next
            </Button>
          </div>
          <div>
            {!showFeedback && selectedAnswers[currentQuestion.id] && (
              <Button onClick={checkAnswer} className="mr-2">
                Check Answer
              </Button>
            )}
            {results.totalAnswered === questions.length && (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit All Answers"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
