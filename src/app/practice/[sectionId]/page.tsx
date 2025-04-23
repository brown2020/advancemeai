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
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
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

  // New state for question count selection
  const [showQuestionCountSelector, setShowQuestionCountSelector] =
    useState(true);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(3);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [readingPassage, setReadingPassage] = useState<string | null>(null);

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

        // Set section title based on sectionId
        const sectionTitles: Record<string, string> = {
          reading: "Reading Comprehension",
          writing: "Writing and Language",
          "math-no-calc": "Math (No Calculator)",
          "math-calc": "Math (Calculator)",
        };
        setSectionTitle(
          sectionTitles[resolvedParams.sectionId] || resolvedParams.sectionId
        );
      } catch (err) {
        console.error("Failed to load params:", err);
        setError("Failed to load section parameters.");
      }
    }

    loadParams();
  }, [params]);

  // Load questions when user selects question count
  const handleStartPractice = async () => {
    if (!sectionId) return;

    setShowQuestionCountSelector(false);
    setIsGeneratingQuestions(true);

    try {
      // Custom fetch function to get the specified number of questions
      const fetchQuestions = async (count: number) => {
        // Create a custom URL with a count parameter
        const url = `/api/questions/${sectionId}?count=${count}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch questions for section ${sectionId}`);
        }

        return await response.json();
      };

      const data = await fetchQuestions(selectedQuestionCount);

      // Update to handle the new response format
      if (data.questions) {
        setQuestions(data.questions);
      } else {
        setQuestions(data);
      }

      // Set the reading passage from the API response
      if (data.readingPassage && sectionId === "reading") {
        setReadingPassage(data.readingPassage);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to load questions:", err);
      setError("Failed to load questions. Please try again later.");
    } finally {
      setIsGeneratingQuestions(false);
      setIsLoading(false);
    }
  };

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

    // Check if this question has already been answered before
    const hasAnsweredBefore =
      results.correctAnswers.includes(currentQuestion.id) ||
      (results.totalAnswered > 0 &&
        Object.keys(selectedAnswers).includes(currentQuestion.id) &&
        !results.correctAnswers.includes(currentQuestion.id));

    // Only update the score if this is the first time answering this question
    if (!hasAnsweredBefore) {
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
    } else if (
      !results.correctAnswers.includes(currentQuestion.id) &&
      isAnswerCorrect
    ) {
      // If they previously got it wrong but now got it right, update the score
      setResults((prev) => ({
        ...prev,
        score: prev.score + 1,
        correctAnswers: [...prev.correctAnswers, currentQuestion.id],
      }));
    } else if (
      results.correctAnswers.includes(currentQuestion.id) &&
      !isAnswerCorrect
    ) {
      // If they previously got it right but now got it wrong, decrease the score
      setResults((prev) => ({
        ...prev,
        score: prev.score - 1,
        correctAnswers: prev.correctAnswers.filter(
          (id) => id !== currentQuestion.id
        ),
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);

      const timeSpent = Math.floor((Date.now() - startTime) / 1000); // Convert to seconds

      // Create a record of questions with their details
      const questionsData = questions.map((q) => ({
        id: q.id,
        text: q.text,
        correctAnswer: q.correctAnswer,
        options: q.options,
        explanation: q.explanation,
      }));

      // Store the questions in localStorage for reference
      localStorage.setItem(
        `questions-${sectionId}-${Date.now()}`,
        JSON.stringify(questionsData)
      );

      // Calculate the actual number of questions answered
      const answeredQuestions = Object.keys(selectedAnswers).length;

      // Make sure totalQuestions matches the actual number of questions
      const totalQuestions = questions.length;

      // Ensure score doesn't exceed the total number of questions
      const finalScore = Math.min(results.score, totalQuestions);

      const response = await submitTestAttempt({
        userId: user.uid,
        sectionId,
        answers: selectedAnswers,
        timeSpent,
        completedAt: new Date(),
        score: finalScore,
        totalQuestions: totalQuestions,
        // Store additional data for the results page
        questionsData: questionsData,
      });

      // Use direct navigation instead of router
      console.log(
        "Navigating to results page:",
        ROUTES.PRACTICE.RESULTS(response.id)
      );
      window.location.href = ROUTES.PRACTICE.RESULTS(response.id);
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

  // Show question count selector
  if (showQuestionCountSelector) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>AI-Generated Practice Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              You&apos;re about to start the <strong>{sectionTitle}</strong>{" "}
              practice test. Our AI will generate custom questions for you to
              practice with.
            </p>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">
                How many questions would you like?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[3, 5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSelectedQuestionCount(count)}
                    className={`p-3 border rounded-md text-center ${
                      selectedQuestionCount === count
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> AI-generated questions may take a moment
                to create. The more questions you select, the longer it will
                take.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartPractice} className="w-full">
              Generate Questions & Start Practice
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show loading state while generating questions
  if (isGeneratingQuestions) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Generating Your Practice Questions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-lg font-medium mb-2">
              AI is creating your questions...
            </p>
            <p className="text-gray-500 text-center max-w-md">
              Our AI is generating {selectedQuestionCount} custom {sectionTitle}{" "}
              questions for you. This may take a moment.
            </p>
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
      {/* Reading passage for reading comprehension questions */}
      {readingPassage && sectionId === "reading" && (
        <Card className="w-full max-w-3xl mx-auto mb-6">
          <CardHeader>
            <CardTitle>Reading Passage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-md max-h-[400px] overflow-y-auto">
              {readingPassage.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              {Object.keys(selectedAnswers).length} of {questions.length}{" "}
              questions answered
            </p>
            <p className="text-sm">
              <span className="font-medium">Current Score:</span>{" "}
              {results.score} correct out of {questions.length} total questions
              (
              {questions.length > 0
                ? Math.round((results.score / questions.length) * 100)
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
            {Object.keys(selectedAnswers).length === questions.length && (
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
