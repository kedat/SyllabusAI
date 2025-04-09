import { useParams } from "wouter";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useEffect, useState } from "react";

export default function TakeExam() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const docRef = doc(db, "exams", examId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setExam(docSnap.data() as Exam);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching exam:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmit = () => {
    if (!exam) return;

    let correctAnswers = 0;

    exam.questions.forEach((question, index) => {
      if (
        question.questionType === "multiple-choice" &&
        answers[index] === question.correctAnswer
      ) {
        correctAnswers++;
      }
    });

    const totalQuestions = exam.questions.length;
    const calculatedScore = Math.round((correctAnswers / totalQuestions) * 100);
    setScore(calculatedScore);

    alert(`You scored ${calculatedScore}% on this exam!`);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!exam) {
    return <div className="text-center py-12">Exam not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{exam.title}</h1>
      <div className="space-y-8">
        {exam.questions.map((question, index) => (
          <div
            key={index}
            className="p-6 border border-gray-300 rounded-lg shadow-md"
          >
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              {index + 1}. {question.content}
            </h2>
            {question.questionType === "multiple-choice" &&
              question.options.map((option) => (
                <div key={option.id} className="mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`q${index}`}
                      value={option.id}
                      onChange={() => handleAnswerChange(index, option.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.text}</span>
                  </label>
                </div>
              ))}
            {question.questionType === "short-answer" && (
              <textarea
                className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                placeholder="Type your answer here..."
                onChange={(e) => handleAnswerChange(index, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <button
          onClick={handleSubmit}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
        >
          Submit Exam
        </button>
        {score !== null && (
          <div className="mt-4 text-xl font-semibold text-green-600">
            Your Score: {score}%
          </div>
        )}
      </div>
    </div>
  );
}
