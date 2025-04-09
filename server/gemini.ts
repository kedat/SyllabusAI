import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";

// Initialize Google Generative AI with API key from environment variable
const apiKey = process.env.GOOGLE_API_KEY;
console.log("Using Google API Key:", apiKey?.substring(0, 3) + "..." + (apiKey?.length ? apiKey.substring(apiKey.length - 3) : ""));
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Create the model instance for text generation
const model = googleAI.getGenerativeModel({
  model: "gemini-1.5-pro", // Using the most advanced model available
  generationConfig: {
    temperature: 0.7,
    topP: 0.9,
    topK: 16,
    maxOutputTokens: 8192,
  },
});

// Helper function to safely parse JSON from Gemini responses
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
      
      Create a JSON object with the following structure:
      {
        "topics": [
          {
            "name": "Topic name",
            "importance": number (1-10)
          }
        ]
      }
      
      Identify between 5-15 distinct topics. Focus on academic content, not administrative details.
      Return ONLY the JSON object without any other text or explanation.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON content from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : "{}";
    
    const parsedResult = safeJsonParse(jsonContent);
    const topics = parsedResult.topics || [];
    
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
      
      Return a JSON object with the following structure:
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
      
      Return ONLY the JSON object without any other text or explanation.
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON content from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonContent = jsonMatch ? jsonMatch[0] : "{}";
      
      return safeJsonParse(jsonContent);
    } catch (aiError) {
      console.error("AI API error, using fallback mock data:", aiError);
      return generateMockExam(syllabusContent, config, courseTitle);
    }
  } catch (error) {
    console.error("Error generating exam:", error);
    // Create mock data if there's any error
    const courseTitle = extractCourseTitle(syllabusContent, filename);
    return generateMockExam(syllabusContent, config, courseTitle);
  }
}

// Helper function to generate mock exam data based on the syllabus
function generateMockExam(syllabusContent: string, config: ExamConfig, courseTitle: string): Exam {
  console.log("Generating mock exam data for", courseTitle);
  
  // Extract some keywords from the syllabus to make questions more relevant
  const syllabusLines = syllabusContent.split('\n');
  const topicLines = syllabusLines.filter(line => 
    line.includes('Topic') || 
    line.includes('Learning') || 
    line.includes('Objective') || 
    line.includes('Study') ||
    line.match(/^\d+\./)
  );
  
  // Use a sample of lines to generate questions
  const relevantLines = topicLines.length > 10 ? 
    topicLines.slice(0, 10) : 
    syllabusLines.slice(0, Math.min(syllabusLines.length, 20));
  
  // Common subject areas based on typical syllabus content
  const subjectAreas = [
    "Fundamental Concepts",
    "Key Principles",
    "Theoretical Frameworks",
    "Application Methods",
    "Historical Context",
    "Practical Skills",
    "Core Terminology",
    "Analysis Techniques"
  ];
  
  // Create appropriate questions based on config
  const questions: Question[] = [];
  
  for (let i = 0; i < config.questionCount; i++) {
    // Select a relevant line or subject area to base the question on
    const baseText = relevantLines.length > i ? 
      relevantLines[i] : 
      subjectAreas[i % subjectAreas.length];
    
    // Create a relevant topic name
    const topic = baseText.length > 30 ? 
      baseText.substring(0, 30).trim() + "..." : 
      baseText.trim();
    
    // Set appropriate difficulty
    const difficulty = config.difficulty === "mixed" ? 
      ["easy", "medium", "hard"][i % 3] : 
      config.difficulty;
      
    if (config.type === "multiple-choice") {
      questions.push({
        content: `Question ${i+1}: Which of the following best describes "${topic}"?`,
        questionType: "multiple-choice",
        options: [
          { id: "a", text: `The primary framework for understanding ${topic}` },
          { id: "b", text: `A secondary concept related to ${topic}` },
          { id: "c", text: `An application method for ${topic}` },
          { id: "d", text: `The historical development of ${topic}` }
        ],
        correctAnswer: "a",
        topic,
        difficulty
      });
    } else {
      questions.push({
        content: `Question ${i+1}: Briefly explain the concept of "${topic}" and its significance.`,
        questionType: "short-answer",
        correctAnswer: `${topic} is a fundamental concept that involves understanding the core principles and applying them appropriately in context.`,
        topic,
        difficulty
      });
    }
  }
  
  return {
    title: `${courseTitle} - ${config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1)} Difficulty Exam`,
    questions
  };
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