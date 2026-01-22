import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswer: z.string().min(1),
  difficulty: z.union([
    z.literal("easy"),
    z.literal("medium"),
    z.literal("hard"),
    z.number(),
  ]),
  explanation: z.string().optional(),
  sectionId: z.string().optional(),
});

export type Question = z.infer<typeof QuestionSchema>;

export const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema),
  readingPassage: z.string().nullable().optional(),
});
