import {
  User, InsertUser, users,
  Syllabus, InsertSyllabus, syllabuses,
  Exam, InsertExam, exams,
  Question, InsertQuestion, questions,
  ExamAttempt, InsertExamAttempt, examAttempts,
  Answer, InsertAnswer, answers
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Storage interface for CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Syllabus operations
  createSyllabus(syllabus: InsertSyllabus): Promise<Syllabus>;
  getSyllabus(id: number): Promise<Syllabus | undefined>;
  getAllSyllabuses(): Promise<Syllabus[]>;
  deleteSyllabus(id: number): Promise<boolean>;

  // Exam operations
  createExam(exam: InsertExam): Promise<Exam>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsBySyllabusId(syllabusId: number): Promise<Exam[]>;
  
  // Question operations
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByExamId(examId: number): Promise<Question[]>;
  
  // Exam attempt operations
  createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt>;
  getExamAttempt(id: number): Promise<ExamAttempt | undefined>;
  completeExamAttempt(id: number, score: number): Promise<ExamAttempt>;
  
  // Answer operations
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  getAnswersByAttemptId(attemptId: number): Promise<Answer[]>;
}

// PostgreSQL database storage implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Syllabus operations
  async createSyllabus(insertSyllabus: InsertSyllabus): Promise<Syllabus> {
    const [syllabus] = await db
      .insert(syllabuses)
      .values(insertSyllabus)
      .returning();
    return syllabus;
  }

  async getSyllabus(id: number): Promise<Syllabus | undefined> {
    const [syllabus] = await db.select().from(syllabuses).where(eq(syllabuses.id, id));
    return syllabus;
  }

  async getAllSyllabuses(): Promise<Syllabus[]> {
    return await db.select().from(syllabuses).orderBy(desc(syllabuses.uploadedAt));
  }
  
  async deleteSyllabus(id: number): Promise<boolean> {
    // First get the related exams
    const relatedExams = await this.getExamsBySyllabusId(id);
    
    // Begin a transaction to ensure all deletions are successful or none are
    const result = await db.transaction(async (tx) => {
      // For each exam, delete all related data
      for (const exam of relatedExams) {
        // Get all attempts for this exam
        const examAttemptsResult = await tx
          .select()
          .from(examAttempts)
          .where(eq(examAttempts.examId, exam.id));
          
        // Delete answers for each attempt
        for (const attemptObj of examAttemptsResult) {
          await tx
            .delete(answers)
            .where(eq(answers.attemptId, attemptObj.id));
        }
        
        // Delete attempts
        await tx
          .delete(examAttempts)
          .where(eq(examAttempts.examId, exam.id));
          
        // Delete questions
        await tx
          .delete(questions)
          .where(eq(questions.examId, exam.id));
      }
      
      // Delete exams
      await tx
        .delete(exams)
        .where(eq(exams.syllabusId, id));
        
      // Finally, delete the syllabus
      const deleteResult = await tx
        .delete(syllabuses)
        .where(eq(syllabuses.id, id));
        
      return deleteResult.rowCount ? deleteResult.rowCount > 0 : false;
    });
    
    return result;
  }

  // Exam operations
  async createExam(insertExam: InsertExam): Promise<Exam> {
    const [exam] = await db
      .insert(exams)
      .values(insertExam)
      .returning();
    return exam;
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsBySyllabusId(syllabusId: number): Promise<Exam[]> {
    return await db
      .select()
      .from(exams)
      .where(eq(exams.syllabusId, syllabusId))
      .orderBy(desc(exams.createdAt));
  }

  // Question operations
  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db
      .insert(questions)
      .values(insertQuestion)
      .returning();
    return question;
  }

  async getQuestionsByExamId(examId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.examId, examId));
  }

  // Exam attempt operations
  async createExamAttempt(insertAttempt: InsertExamAttempt): Promise<ExamAttempt> {
    const [attempt] = await db
      .insert(examAttempts)
      .values(insertAttempt)
      .returning();
    return attempt;
  }

  async getExamAttempt(id: number): Promise<ExamAttempt | undefined> {
    const [attempt] = await db.select().from(examAttempts).where(eq(examAttempts.id, id));
    return attempt;
  }

  async completeExamAttempt(id: number, score: number): Promise<ExamAttempt> {
    const [updatedAttempt] = await db
      .update(examAttempts)
      .set({
        completedAt: new Date(),
        score
      })
      .where(eq(examAttempts.id, id))
      .returning();
    
    if (!updatedAttempt) {
      throw new Error(`Exam attempt with id ${id} not found`);
    }
    
    return updatedAttempt;
  }

  // Answer operations
  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const [answer] = await db
      .insert(answers)
      .values(insertAnswer)
      .returning();
    return answer;
  }

  async getAnswersByAttemptId(attemptId: number): Promise<Answer[]> {
    return await db
      .select()
      .from(answers)
      .where(eq(answers.attemptId, attemptId));
  }
}

// Export a database storage instance
export const storage = new DatabaseStorage();