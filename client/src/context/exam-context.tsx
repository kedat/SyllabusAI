import { createContext, useContext, useState, ReactNode } from "react";

// Types for the context
export interface Topic {
  name: string;
  importance: number;
}

export interface ExamConfig {
  type: "multiple-choice" | "short-answer";
  questionCount: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  topics: string[];
  timeLimit?: number;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: number;
  examId: number;
  content: string;
  questionType: "multiple-choice" | "short-answer";
  options?: Option[] | null;
  correctAnswer: string;
  topic?: string;
  difficulty?: string;
}

export interface Exam {
  id: number;
  title: string;
  syllabusId: number;
  type: "multiple-choice" | "short-answer";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionCount: number;
  timeLimit?: number;
  topics: string[];
  createdAt: Date;
  questions?: Question[];
}

export interface ExamAttempt {
  id: number;
  examId: number;
  startedAt: Date;
  completedAt: Date | null;
  score: number | null;
  maxScore: number;
}

export interface Answer {
  id: number;
  attemptId: number;
  questionId: number;
  answer: string;
  isCorrect: boolean | null;
}

interface ExamContextType {
  // Syllabus state
  syllabusId: number | null;
  setSyllabusId: (id: number | null) => void;
  
  // Exam config state
  examConfig: ExamConfig;
  setExamConfig: (config: ExamConfig) => void;
  updateExamConfig: (updates: Partial<ExamConfig>) => void;
  
  // Topics state
  topics: Topic[];
  setTopics: (topics: Topic[]) => void;
  
  // Exam state
  currentExam: Exam | null;
  setCurrentExam: (exam: Exam | null) => void;
  
  // Exam attempt state
  currentAttempt: ExamAttempt | null;
  setCurrentAttempt: (attempt: ExamAttempt | null) => void;
  
  // User answers state
  userAnswers: Map<number, string>;
  setUserAnswer: (questionId: number, answer: string) => void;
  clearUserAnswers: () => void;
  
  // Exam results state
  examResults: {
    attempt: ExamAttempt;
    score: number;
    maxScore: number;
    answers: Answer[];
  } | null;
  setExamResults: (results: {
    attempt: ExamAttempt;
    score: number;
    maxScore: number;
    answers: Answer[];
  } | null) => void;
}

// Create the context
const ExamContext = createContext<ExamContextType | undefined>(undefined);

// Provider component
export function ExamProvider({ children }: { children: ReactNode }) {
  const [syllabusId, setSyllabusId] = useState<number | null>(null);
  
  const [examConfig, setExamConfig] = useState<ExamConfig>({
    type: "multiple-choice",
    questionCount: 20,
    difficulty: "medium",
    topics: [], // Empty by default
  });
  
  const [topics, setTopics] = useState<Topic[]>([]);
  
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  
  const [currentAttempt, setCurrentAttempt] = useState<ExamAttempt | null>(null);
  
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  
  const [examResults, setExamResults] = useState<{
    attempt: ExamAttempt;
    score: number;
    maxScore: number;
    answers: Answer[];
  } | null>(null);
  
  // Function to update exam config
  const updateExamConfig = (updates: Partial<ExamConfig>) => {
    setExamConfig(prevConfig => ({
      ...prevConfig,
      ...updates
    }));
  };
  
  // Function to set user answer
  const setUserAnswer = (questionId: number, answer: string) => {
    setUserAnswers(prev => {
      const newMap = new Map(prev);
      newMap.set(questionId, answer);
      return newMap;
    });
  };
  
  // Function to clear user answers
  const clearUserAnswers = () => {
    setUserAnswers(new Map());
  };
  
  return (
    <ExamContext.Provider value={{
      syllabusId,
      setSyllabusId,
      examConfig,
      setExamConfig,
      updateExamConfig,
      topics,
      setTopics,
      currentExam,
      setCurrentExam,
      currentAttempt,
      setCurrentAttempt,
      userAnswers,
      setUserAnswer,
      clearUserAnswers,
      examResults,
      setExamResults
    }}>
      {children}
    </ExamContext.Provider>
  );
}

// Custom hook to use the exam context
export function useExam() {
  const context = useContext(ExamContext);
  
  if (context === undefined) {
    throw new Error("useExam must be used within an ExamProvider");
  }
  
  return context;
}
