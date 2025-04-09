import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from original file
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// New schemas for the exam generator application

// Syllabus schema
export const syllabuses = pgTable("syllabuses", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  content: text("content").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertSyllabusSchema = createInsertSchema(syllabuses).pick({
  filename: true,
  originalName: true,
  contentType: true,
  content: true,
});

// Exam schema
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  syllabusId: integer("syllabus_id").notNull(),
  type: text("type").notNull(), // multiple-choice, short-answer
  difficulty: text("difficulty").notNull(), // easy, medium, hard, mixed
  questionCount: integer("question_count").notNull(),
  timeLimit: integer("time_limit"), // optional, in minutes
  topics: text("topics").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExamSchema = createInsertSchema(exams).pick({
  title: true,
  syllabusId: true,
  type: true,
  difficulty: true,
  questionCount: true,
  timeLimit: true,
  topics: true,
});

// Question schema
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  content: text("content").notNull(),
  questionType: text("question_type").notNull(), // multiple-choice, short-answer
  options: jsonb("options"), // for multiple choice: [{id: 'a', text: 'option a'}, ...]
  correctAnswer: text("correct_answer").notNull(),
  topic: text("topic"),
  difficulty: text("difficulty"),
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  examId: true,
  content: true,
  questionType: true,
  options: true,
  correctAnswer: true,
  topic: true,
  difficulty: true,
});

// Exam attempt schema
export const examAttempts = pgTable("exam_attempts", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  maxScore: integer("max_score").notNull(),
});

export const insertExamAttemptSchema = createInsertSchema(examAttempts).pick({
  examId: true,
  maxScore: true,
});

// Answer schema
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull(),
  questionId: integer("question_id").notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct"),
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  attemptId: true,
  questionId: true,
  answer: true,
  isCorrect: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSyllabus = z.infer<typeof insertSyllabusSchema>;
export type Syllabus = typeof syllabuses.$inferSelect;

export type InsertExam = z.infer<typeof insertExamSchema>;
export type Exam = typeof exams.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;
export type ExamAttempt = typeof examAttempts.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

// Zod schema for file upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => {
      const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      return validTypes.includes(file.type);
    },
    {
      message: "File must be a PDF, DOCX, or TXT",
    }
  )
});

// Zod schema for exam configuration
export const examConfigSchema = z.object({
  type: z.enum(["multiple-choice", "short-answer"]),
  questionCount: z.number().min(5).max(50),
  difficulty: z.enum(["easy", "medium", "hard", "mixed"]),
  topics: z.array(z.string()).default([]),
  timeLimit: z.number().optional(),
});
