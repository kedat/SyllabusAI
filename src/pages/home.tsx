import { useFetchSyllabuses } from "@/hooks/useFetchSyllabuses";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExamConfig, Exam, useExam } from "@/context/exam-context";
import { useEffect, useState } from "react";
import { generateExam, generateMockExam } from "@/gemini";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export default function Home() {
  const [, navigate] = useLocation();
  const { setSyllabusId } = useExam();
  const { syllabuses, isLoading, error } = useFetchSyllabuses();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedExams, setGeneratedExams] = useState<Exam[]>([]);

  // Reset exam context when landing on home page
  useEffect(() => {
    setSyllabusId(null);

    // Load exams from local storage
    const storedExams = localStorage.getItem("generatedExams");
    if (storedExams) {
      setGeneratedExams(JSON.parse(storedExams));
    }
  }, [setSyllabusId]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUploadSyllabus = async (file: File | null) => {
    if (!file) return;

    try {
      // Read the file content (assuming it's a text-based syllabus)
      const fileContent = await file.text();

      // Generate the exam using Gemini
      const examConfig: ExamConfig = {
        type: "multiple-choice",
        questionCount: 10,
        difficulty: "mixed",
        topics: [], // Topics can be extracted from the syllabus if needed
      };

      const filename = file.name;
      const exam = await generateExam(fileContent, examConfig, filename);

      // Display the generated exam
      alert(`Exam generated successfully! Title: ${exam.title}`);

      // Prepare the exam document for Firestore
      const examDoc = {
        title: exam.title,
        questions: exam.questions,
        syllabusFilename: filename,
        uploadedAt: new Date().toISOString(),
      };

      console.log("Saving exam to Firestore:", examDoc);

      // Save the exam to Firestore and get the document ID
      const docRef = await addDoc(collection(db, "exams"), examDoc);
      console.log("Exam saved to Firestore with ID:", docRef.id);

      // Add the generated exam with Firestore ID to the state
      const newExam = { ...exam, id: docRef.id }; // Include the Firestore ID in the exam object
      setGeneratedExams((prevExams) => {
        const updatedExams = [...prevExams, newExam];
        localStorage.setItem("generatedExams", JSON.stringify(updatedExams)); // Save to local storage
        return updatedExams;
      });

      alert("Exam saved to Firestore successfully!");

      // Prepare the file for upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("exam", JSON.stringify(exam)); // Include the generated exam in the upload

      // Upload the file and exam to the API
      const uploadResponse = await fetch(
        "https://ai-exam-silk.vercel.app/upload-file",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload syllabus.");
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload Result:", uploadResult);
      alert("Syllabus uploaded successfully!");
    } catch (error) {
      console.error("Error during exam generation or upload:", error);

      // Fallback to mock exam generation
      const mockExam = generateMockExam(
        "Default syllabus content",
        {
          type: "multiple-choice",
          questionCount: 10,
          difficulty: "mixed",
          topics: [],
        },
        "Mock Syllabus"
      );

      console.log("Generated Mock Exam:", mockExam);
      alert(
        `Failed to generate or upload exam. Showing mock exam: ${mockExam.title}`
      );

      // Add the mock exam to the state and local storage
      setGeneratedExams((prevExams) => {
        const updatedExams = [...prevExams, mockExam];
        localStorage.setItem("generatedExams", JSON.stringify(updatedExams)); // Save to local storage
        return updatedExams;
      });
    }
  };

  const handleUploadClick = () => {
    handleUploadSyllabus(selectedFile);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to ExamGenius
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your course syllabus and let AI generate customized exams for
          effective studying.
        </p>
        <div className="mt-6">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <Button
            onClick={handleUploadClick}
            className="mt-4 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Upload Syllabus
          </Button>
        </div>
      </div>

      {/* Display Generated Exams */}
      {generatedExams.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Generated Exams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedExams.map((exam) => (
              <Card key={exam.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    {exam.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {exam?.questions.length} Questions
                  </p>
                  <Button
                    onClick={() => navigate(`/take-exam/${exam.id}`)}
                    className="bg-blue-600 text-white"
                  >
                    Take Exam
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
