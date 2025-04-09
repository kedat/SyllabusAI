import OpenAI from "openai";

// Initialize OpenAI with API key from environment variable
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Helper function to safely parse JSON from OpenAI responses
function safeJsonParse(jsonString: string | null | undefined): any {
  if (!jsonString) return {};
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return {};
  }
}

// Types for the exam generation process
interface Topic {
  name: string;
  importance: number; // 1-10 scale
}

interface ExamConfig {
  type: "multiple-choice" | "short-answer";
  questionCount: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  topics: string[];
  timeLimit?: number;
}

interface Option {
  id: string;
  text: string;
}

interface MultipleChoiceQuestion {
  content: string;
  questionType: "multiple-choice";
  options: Option[];
  correctAnswer: string;
  topic: string;
  difficulty: string;
}

interface ShortAnswerQuestion {
  content: string;
  questionType: "short-answer";
  correctAnswer: string;
  topic: string;
  difficulty: string;
}

type Question = MultipleChoiceQuestion | ShortAnswerQuestion;

interface Exam {
  title: string;
  questions: Question[];
}

// Extract topics from syllabus content
export async function extractTopics(syllabusContent: string): Promise<Topic[]> {
  try {
    const prompt = `
      You are an educational expert analyzing a course syllabus. 
      Your task is to identify the main topics covered in this syllabus, along with their relative importance (on a scale of 1-10).
      
      Syllabus:
      ${syllabusContent.substring(0, 15000)} // Limit content to avoid token limits
      
      Return a JSON object with the following structure:
      {
        "topics": [
          {
            "name": "Topic name",
            "importance": number (1-10)
          }
        ]
      }
      
      Identify between 5-15 distinct topics. Focus on academic content, not administrative details.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = safeJsonParse(response.choices[0].message.content);
    const topics = result.topics || [];
    
    // If no topics were found or there was an error parsing them, generate generic topics
    if (topics.length === 0) {
      // Generate some default topics based on common educational subjects
      return [
        { name: "Main Concepts", importance: 10 },
        { name: "Key Definitions", importance: 8 },
        { name: "Theoretical Frameworks", importance: 7 },
        { name: "Applied Methodologies", importance: 9 },
        { name: "Historical Context", importance: 6 },
        { name: "Case Studies", importance: 8 },
        { name: "Research Methods", importance: 7 }
      ];
    }
    
    return topics;
  } catch (error) {
    console.error("Error extracting topics:", error);
    
    // Return default topics if there was an error
    return [
      { name: "Main Concepts", importance: 10 },
      { name: "Key Definitions", importance: 8 },
      { name: "Theoretical Frameworks", importance: 7 },
      { name: "Applied Methodologies", importance: 9 },
      { name: "Historical Context", importance: 6 },
      { name: "Case Studies", importance: 8 },
      { name: "Research Methods", importance: 7 }
    ];
  }
}

// Generate exam questions based on syllabus content and configuration
export async function generateExam(
  syllabusContent: string,
  config: ExamConfig,
  filename: string
): Promise<Exam> {
  try {
    const courseTitle = extractCourseTitle(syllabusContent, filename);
    
    const prompt = `
      You are an expert educator creating exam questions based on course content.
      
      Course syllabus content:
      ${syllabusContent.substring(0, 15000)} // Limit content to avoid token limits
      
      Exam configuration:
      - Type: ${config.type}
      - Number of questions: ${config.questionCount}
      - Difficulty: ${config.difficulty}
      ${config.timeLimit ? `- Time limit: ${config.timeLimit} minutes` : ""}
      
      Create an exam with ${config.questionCount} ${config.type} questions based on the syllabus content.
      
      Guidelines:
      - Create questions that test understanding, not just memorization
      - For multiple-choice, create 4 options per question with only one correct answer
      - For short-answer, provide a concise model answer
      - Make sure all questions are directly based on the syllabus content
      - Cover a broad range of content from the syllabus
      - For ${config.difficulty} difficulty level, adjust complexity accordingly
      
      Return ONLY a JSON object with the following structure:
      {
        "title": "Exam title based on the course", 
        "questions": [
          // For multiple-choice questions:
          {
            "content": "Question text",
            "questionType": "multiple-choice",
            "options": [{"id": "a", "text": "option text"}, ...],
            "correctAnswer": "a", // The ID of the correct option
            "topic": "Topic name",
            "difficulty": "easy|medium|hard"
          },
          // For short-answer questions:
          {
            "content": "Question text",
            "questionType": "short-answer",
            "correctAnswer": "Model answer",
            "topic": "Topic name",
            "difficulty": "easy|medium|hard"
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const result = safeJsonParse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("Error generating exam:", error);
    throw new Error("Failed to generate exam questions");
  }
}

// Helper function to extract course title from syllabus content or fallback to filename
function extractCourseTitle(content: string, filename: string): string {
  // Try to extract a title from the first few lines
  const firstLines = content.split('\n').slice(0, 10).join(' ');
  const courseMatch = firstLines.match(/course:?\s*([a-z0-9\s]+)/i) || 
                      firstLines.match(/title:?\s*([a-z0-9\s]+)/i) ||
                      firstLines.match(/syllabus:?\s*([a-z0-9\s]+)/i);
  
  if (courseMatch && courseMatch[1].trim()) {
    return courseMatch[1].trim();
  }
  
  // Fallback to filename
  return filename.replace(/\.(pdf|docx|txt)$/i, '').replace(/_/g, ' ');
}
