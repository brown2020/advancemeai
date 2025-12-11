"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { Question, submitTestAttempt } from "@/services/practiceTestService";
import { ROUTES } from "@/constants/appConstants";
import { useAuth } from "@/lib/auth";
import { ExplainMistakeButton } from "@/components/practice/ExplainMistakeButton";
import { BookmarkQuestionButton } from "@/components/practice/BookmarkQuestionButton";
import { StreamingQuestionGenerator } from "@/components/practice/StreamingQuestionGenerator";
import {
  deriveConceptId,
  deriveModeTimer,
  saveAdaptiveAttempt,
} from "@/services/adaptivePracticeService";
import { PracticeMode } from "@/api/firebase/practiceProgressRepository";
import { useAdaptivePractice } from "@/hooks/useAdaptivePractice";
import {
  SECTION_TITLES,
  TimerDisplay,
  MicroLessonTip,
  QuestionCountSelector,
  GeneratingQuestionsCard,
  QuestionLoadingSkeleton,
  ErrorCard,
  ReadingPassageCard,
  ProgressSummary,
  getRandomMicroLessonTip,
  formatTimer,
} from "@/components/practice/PracticeComponents";

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
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("review");
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [microLessonTip, setMicroLessonTip] = useState<string | null>(null);

  const { recommendation, isLoading: isLoadingRecommendation } =
    useAdaptivePractice(user?.uid, sectionId || undefined);

  useEffect(() => {
    if (
      recommendation &&
      showQuestionCountSelector &&
      !isLoadingRecommendation
    ) {
      setSelectedQuestionCount(recommendation.recommendedCount);
    }
  }, [recommendation, showQuestionCountSelector, isLoadingRecommendation]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (timerSeconds === null) {
      setRemainingSeconds(null);
      return;
    }
    setRemainingSeconds(timerSeconds);
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  const formattedTimer = useMemo(
    () => formatTimer(remainingSeconds),
    [remainingSeconds]
  );

  // Load the sectionId from params
  useEffect(() => {
    async function loadParams() {
      try {
        const resolvedParams = await params;
        setSectionId(resolvedParams.sectionId);
        setSectionTitle(
          SECTION_TITLES[resolvedParams.sectionId] || resolvedParams.sectionId
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
    setQuestionStartTime(Date.now());
    setMicroLessonTip(
      practiceMode === "micro" ? getRandomMicroLessonTip(sectionId) : null
    );
    const modeTimer = deriveModeTimer(practiceMode, selectedQuestionCount);
    setTimerSeconds(modeTimer);

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
    const timeSpentMs = Date.now() - questionStartTime;
    if (user) {
      saveAdaptiveAttempt({
        userId: user.uid,
        sectionId,
        questionId: currentQuestion.id,
        mode: practiceMode,
        isCorrect: isAnswerCorrect,
        timeSpentMs,
        difficulty: currentQuestion.difficulty,
        conceptId: deriveConceptId(currentQuestion),
      }).catch((error) => console.error("Failed to save attempt", error));
    }
    setQuestionStartTime(Date.now());

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

  useEffect(() => {
    if (practiceMode !== "timed") return;
    if (remainingSeconds === 0) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, practiceMode]);

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <ErrorCard message="You must be logged in to access practice tests." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <ErrorCard message={error} />
      </div>
    );
  }

  // Show question count selector
  if (showQuestionCountSelector) {
    return (
      <div className="container mx-auto p-4">
        <QuestionCountSelector
          selectedCount={selectedQuestionCount}
          onCountChange={setSelectedQuestionCount}
          practiceMode={practiceMode}
          onModeChange={setPracticeMode}
          sectionTitle={sectionTitle}
          recommendation={recommendation}
          onStart={handleStartPractice}
        />
      </div>
    );
  }

  // Show loading state while generating questions
  if (isGeneratingQuestions) {
    return (
      <div className="container mx-auto p-4">
        <GeneratingQuestionsCard
          selectedCount={selectedQuestionCount}
          sectionTitle={sectionTitle}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <QuestionLoadingSkeleton />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mx-auto p-4">
        <ErrorCard message="No questions found for this section." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 space-y-3">
        {practiceMode === "timed" && (
          <TimerDisplay formattedTimer={formattedTimer} />
        )}
        {practiceMode === "micro" && <MicroLessonTip tip={microLessonTip} />}
        <StreamingQuestionGenerator
          sectionId={sectionId}
          onQuestion={(question) => setQuestions((prev) => [...prev, question])}
          difficulty={recommendation?.suggestedDifficulty ?? "medium"}
        />
      </div>
      {/* Reading passage for reading comprehension questions */}
      {readingPassage && sectionId === "reading" && (
        <ReadingPassageCard passage={readingPassage} />
      )}

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <BookmarkQuestionButton
              questionId={currentQuestion.id}
              questionText={currentQuestion.text}
              correctAnswer={currentQuestion.correctAnswer}
              sectionId={sectionId}
            />
          </div>
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
                  {!isCorrect && (
                    <div className="mt-3">
                      <ExplainMistakeButton
                        question={currentQuestion.text}
                        userAnswer={selectedAnswers[currentQuestion.id]}
                        correctAnswer={currentQuestion.correctAnswer}
                        sectionId={sectionId}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress summary */}
          <ProgressSummary
            answeredCount={Object.keys(selectedAnswers).length}
            totalQuestions={questions.length}
            score={results.score}
          />
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
