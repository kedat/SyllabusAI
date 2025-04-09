import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { extractTopics, generateExam } from "./gemini";
import { 
  insertSyllabusSchema, 
  insertExamSchema, 
  insertQuestionSchema,
  insertExamAttemptSchema,
  insertAnswerSchema,
  examConfigSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";
import * as pdf from "pdf-parse";
import mammoth from "mammoth";

// Configure file upload storage
const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      const uploadsDir = path.join(process.cwd(), "uploads");
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
      } catch (error) {
        cb(error as Error, uploadsDir);
      }
    },
    filename: function (req, file, cb) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  }),
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, DOCX, and TXT files are allowed"));
    }
    
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API Routes
  
  // Upload syllabus file
  app.post("/api/syllabuses", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Extract text content from file
      const filePath = req.file.path;
      let content = "";
      
      try {
        if (req.file.mimetype === "application/pdf") {
          const dataBuffer = await fs.readFile(filePath);
          const pdfData = await pdf(dataBuffer);
          content = pdfData.text;
        } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const result = await mammoth.extractRawText({ path: filePath });
          content = result.value;
        } else {
          // Plain text
          content = await fs.readFile(filePath, "utf-8");
        }
      } catch (error) {
        console.error("Error extracting content:", error);
        return res.status(500).json({ message: "Failed to extract content from file" });
      }
      
      // Create syllabus in storage
      const syllabusData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        contentType: req.file.mimetype,
        content
      };
      
      const parsedData = insertSyllabusSchema.parse(syllabusData);
      const syllabus = await storage.createSyllabus(parsedData);
      
      // Remove content field from response to reduce payload size
      const { content: _, ...syllabusResponse } = syllabus;
      
      res.status(201).json(syllabusResponse);
    } catch (error) {
      console.error("Error uploading syllabus:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to upload syllabus" });
    }
  });

  // Get all syllabuses
  app.get("/api/syllabuses", async (req, res) => {
    try {
      const syllabuses = await storage.getAllSyllabuses();
      
      // Remove content field from response to reduce payload size
      const syllabusesWithoutContent = syllabuses.map(({ content, ...syllabus }) => syllabus);
      
      res.json(syllabusesWithoutContent);
    } catch (error) {
      console.error("Error getting syllabuses:", error);
      res.status(500).json({ message: "Failed to get syllabuses" });
    }
  });

  // Get a specific syllabus
  app.get("/api/syllabuses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid syllabus ID" });
      }
      
      const syllabus = await storage.getSyllabus(id);
      if (!syllabus) {
        return res.status(404).json({ message: "Syllabus not found" });
      }
      
      res.json(syllabus);
    } catch (error) {
      console.error("Error getting syllabus:", error);
      res.status(500).json({ message: "Failed to get syllabus" });
    }
  });
  
  // Delete a syllabus
  app.delete("/api/syllabuses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid syllabus ID" });
      }
      
      // Check if syllabus exists
      const syllabus = await storage.getSyllabus(id);
      if (!syllabus) {
        return res.status(404).json({ message: "Syllabus not found" });
      }
      
      // Delete the syllabus file from disk
      try {
        const filePath = path.join(process.cwd(), "uploads", syllabus.filename);
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error("Error deleting file:", fileError);
        // Continue with deletion even if file cannot be deleted
      }
      
      // Delete from database (which cascades to related exams, questions, attempts, and answers)
      const deleted = await storage.deleteSyllabus(id);
      
      if (deleted) {
        res.status(200).json({ message: "Syllabus deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete syllabus" });
      }
    } catch (error) {
      console.error("Error deleting syllabus:", error);
      res.status(500).json({ message: "Failed to delete syllabus" });
    }
  });

  // Extract topics from syllabus
  app.get("/api/syllabuses/:id/topics", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid syllabus ID" });
      }
      
      const syllabus = await storage.getSyllabus(id);
      if (!syllabus) {
        return res.status(404).json({ message: "Syllabus not found" });
      }
      
      const topics = await extractTopics(syllabus.content);
      res.json(topics);
    } catch (error) {
      console.error("Error extracting topics:", error);
      res.status(500).json({ message: "Failed to extract topics" });
    }
  });

  // Generate exam from syllabus
  app.post("/api/syllabuses/:id/exams", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid syllabus ID" });
      }
      
      const syllabus = await storage.getSyllabus(id);
      if (!syllabus) {
        return res.status(404).json({ message: "Syllabus not found" });
      }
      
      // Validate exam config
      const config = examConfigSchema.parse(req.body);
      
      // Make sure topics is an array (even if empty)
      if (!config.topics) {
        config.topics = [];
      }
      
      // Generate exam using Google's Gemini AI
      const generatedExam = await generateExam(
        syllabus.content, 
        config, 
        syllabus.originalName
      );
      
      // Save exam in storage
      const examData = {
        title: generatedExam.title,
        syllabusId: syllabus.id,
        type: config.type,
        difficulty: config.difficulty,
        questionCount: config.questionCount,
        timeLimit: config.timeLimit,
        topics: config.topics
      };
      
      const parsedExamData = insertExamSchema.parse(examData);
      const exam = await storage.createExam(parsedExamData);
      
      // Save questions in storage
      for (const questionData of generatedExam.questions) {
        const question = {
          examId: exam.id,
          content: questionData.content,
          questionType: questionData.questionType,
          options: questionData.questionType === "multiple-choice" ? questionData.options : null,
          correctAnswer: questionData.correctAnswer,
          topic: questionData.topic,
          difficulty: questionData.difficulty
        };
        
        const parsedQuestion = insertQuestionSchema.parse(question);
        await storage.createQuestion(parsedQuestion);
      }
      
      // Get the created questions to include in response
      const questions = await storage.getQuestionsByExamId(exam.id);
      
      // Return the complete exam with questions
      res.status(201).json({
        ...exam,
        questions
      });
    } catch (error) {
      console.error("Error generating exam:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to generate exam" });
    }
  });

  // Get exams for a syllabus
  app.get("/api/syllabuses/:id/exams", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid syllabus ID" });
      }
      
      const syllabus = await storage.getSyllabus(id);
      if (!syllabus) {
        return res.status(404).json({ message: "Syllabus not found" });
      }
      
      const exams = await storage.getExamsBySyllabusId(syllabus.id);
      res.json(exams);
    } catch (error) {
      console.error("Error getting exams:", error);
      res.status(500).json({ message: "Failed to get exams" });
    }
  });

  // Get a specific exam with questions
  app.get("/api/exams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      
      const exam = await storage.getExam(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const questions = await storage.getQuestionsByExamId(exam.id);
      
      res.json({
        ...exam,
        questions
      });
    } catch (error) {
      console.error("Error getting exam:", error);
      res.status(500).json({ message: "Failed to get exam" });
    }
  });

  // Start an exam attempt
  app.post("/api/exams/:id/attempts", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      
      const exam = await storage.getExam(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      const questions = await storage.getQuestionsByExamId(exam.id);
      
      const attemptData = {
        examId: exam.id,
        maxScore: questions.length
      };
      
      const parsedAttemptData = insertExamAttemptSchema.parse(attemptData);
      const attempt = await storage.createExamAttempt(parsedAttemptData);
      
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error starting exam attempt:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to start exam attempt" });
    }
  });

  // Submit answers for an exam attempt
  app.post("/api/attempts/:id/answers", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attempt ID" });
      }
      
      const attempt = await storage.getExamAttempt(id);
      if (!attempt) {
        return res.status(404).json({ message: "Exam attempt not found" });
      }
      
      if (attempt.completedAt) {
        return res.status(400).json({ message: "Exam attempt already completed" });
      }
      
      // Validate answers structure
      const answersSchema = z.array(z.object({
        questionId: z.number(),
        answer: z.string()
      }));
      
      const answers = answersSchema.parse(req.body);
      
      // Get questions for this exam
      const questions = await storage.getQuestionsByExamId(attempt.examId);
      const questionsMap = new Map(questions.map(q => [q.id, q]));
      
      let score = 0;
      
      // Process each answer
      for (const answerData of answers) {
        const question = questionsMap.get(answerData.questionId);
        
        if (!question) {
          return res.status(400).json({ 
            message: `Question with ID ${answerData.questionId} not found in this exam` 
          });
        }
        
        // Check if answer is correct
        const isCorrect = isAnswerCorrect(question, answerData.answer);
        if (isCorrect) {
          score++;
        }
        
        // Save answer
        const answer = {
          attemptId: attempt.id,
          questionId: answerData.questionId,
          answer: answerData.answer,
          isCorrect
        };
        
        const parsedAnswer = insertAnswerSchema.parse(answer);
        await storage.createAnswer(parsedAnswer);
      }
      
      // Complete the attempt and update the score
      const completedAttempt = await storage.completeExamAttempt(attempt.id, score);
      
      // Get all answers for this attempt
      const savedAnswers = await storage.getAnswersByAttemptId(attempt.id);
      
      res.json({
        attempt: completedAttempt,
        answers: savedAnswers,
        score,
        maxScore: attempt.maxScore
      });
    } catch (error) {
      console.error("Error submitting answers:", error);
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to submit answers" });
    }
  });

  // Get results for an exam attempt
  app.get("/api/attempts/:id/results", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attempt ID" });
      }
      
      const attempt = await storage.getExamAttempt(id);
      if (!attempt) {
        return res.status(404).json({ message: "Exam attempt not found" });
      }
      
      if (!attempt.completedAt) {
        return res.status(400).json({ message: "Exam attempt not yet completed" });
      }
      
      const answers = await storage.getAnswersByAttemptId(attempt.id);
      const questions = await storage.getQuestionsByExamId(attempt.examId);
      const questionsMap = new Map(questions.map(q => [q.id, q]));
      
      // Create detailed results with questions and answers
      const results = answers.map(answer => {
        const question = questionsMap.get(answer.questionId);
        return {
          question,
          answer,
          isCorrect: answer.isCorrect
        };
      });
      
      res.json({
        attempt,
        results,
        score: attempt.score,
        maxScore: attempt.maxScore
      });
    } catch (error) {
      console.error("Error getting attempt results:", error);
      res.status(500).json({ message: "Failed to get attempt results" });
    }
  });

  return httpServer;
}

// Helper function to check if an answer is correct
function isAnswerCorrect(question: any, answer: string): boolean {
  if (question.questionType === "multiple-choice") {
    // For multiple choice, check if the selected option ID matches the correct answer
    return answer.toLowerCase() === question.correctAnswer.toLowerCase();
  } else if (question.questionType === "short-answer") {
    // For short answer, simple exact match (could be improved with NLP)
    const cleanAnswer = answer.toLowerCase().trim();
    const cleanCorrect = question.correctAnswer.toLowerCase().trim();
    
    return cleanAnswer === cleanCorrect || 
           cleanCorrect.includes(cleanAnswer) || 
           cleanAnswer.includes(cleanCorrect);
  }
  
  return false;
}
