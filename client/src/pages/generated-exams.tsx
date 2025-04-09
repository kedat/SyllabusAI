import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useExam } from "@/context/exam-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import StepIndicator from "@/components/step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GeneratedExams() {
  const params = useParams<{ syllabusId: string }>();
  const [, navigate] = useLocation();
  const syllabusId = parseInt(params.syllabusId);
  const { toast } = useToast();
  const { 
    setSyllabusId, 
    examConfig, 
    currentExam, 
    setCurrentExam,
    clearUserAnswers
  } = useExam();
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Validate the syllabus ID
  useEffect(() => {
    if (isNaN(syllabusId)) {
      toast({
        title: "Invalid Syllabus",
        description: "The syllabus ID is invalid",
        variant: "destructive",
      });
      navigate("/upload");
    } else {
      setSyllabusId(syllabusId);
    }
  }, [syllabusId, setSyllabusId, navigate, toast]);
  
  // Query to fetch syllabus
  const { data: syllabus } = useQuery({
    queryKey: [`/api/syllabuses/${syllabusId}`],
    enabled: !isNaN(syllabusId)
  });
  
  // Query to fetch existing exams for this syllabus
  const { 
    data: exams, 
    isLoading: isLoadingExams,
    refetch: refetchExams
  } = useQuery({
    queryKey: [`/api/syllabuses/${syllabusId}/exams`],
    enabled: !isNaN(syllabusId)
  });
  
  // Mutation to generate a new exam
  const generateExamMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await apiRequest("POST", `/api/syllabuses/${syllabusId}/exams`, examConfig);
      return await response.json();
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      toast({
        title: "Exam Generated",
        description: "Your exam has been generated successfully!",
      });
      setCurrentExam(data);
      refetchExams();
    },
    onError: (error) => {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate exam",
        variant: "destructive",
      });
    }
  });
  
  // Auto-generate exam if there are no existing exams
  useEffect(() => {
    if (exams && exams.length === 0 && !isGenerating && !isLoadingExams) {
      generateExamMutation.mutate();
    }
  }, [exams, isGenerating, isLoadingExams]);
  
  const handleBack = () => {
    navigate(`/configure/${syllabusId}`);
  };
  
  const handleGenerateMore = () => {
    generateExamMutation.mutate();
  };
  
  const handleTakeExam = (examId: number) => {
    // Fetch the full exam data with questions
    fetch(`/api/exams/${examId}`)
      .then(res => res.json())
      .then(data => {
        setCurrentExam(data);
        clearUserAnswers();
        navigate(`/take-exam/${examId}`);
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "Failed to load exam data",
          variant: "destructive",
        });
      });
  };
  
  const handleDownloadExam = async (exam: any) => {
    try {
      // Fetch the full exam data with questions if not already loaded
      let examData = exam;
      
      if (!examData.questions) {
        const res = await fetch(`/api/exams/${exam.id}`);
        examData = await res.json();
      }
      
      // Generate exam content as text
      let content = `# ${examData.title}\n\n`;
      content += `Date: ${new Date().toLocaleDateString()}\n`;
      content += `Type: ${examData.type === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer'}\n`;
      content += `Difficulty: ${examData.difficulty}\n`;
      content += `Questions: ${examData.questionCount}\n`;
      
      if (examData.timeLimit) {
        content += `Time Limit: ${examData.timeLimit} minutes\n`;
      }
      
      content += `\n## Questions\n\n`;
      
      examData.questions.forEach((question: any, index: number) => {
        content += `${index + 1}. ${question.content}\n\n`;
        
        if (question.questionType === 'multiple-choice' && question.options) {
          question.options.forEach((option: any) => {
            content += `   ${option.id.toUpperCase()}. ${option.text}\n`;
          });
        }
        
        content += `\n`;
      });
      
      content += `\n## Answer Key\n\n`;
      
      examData.questions.forEach((question: any, index: number) => {
        content += `${index + 1}. ${question.correctAnswer}`;
        if (question.questionType === 'short-answer') {
          content += ` - ${question.correctAnswer}`;
        }
        content += `\n`;
      });
      
      // Create and download the file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${examData.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Exam Downloaded",
        description: "Your exam has been downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download the exam",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StepIndicator 
        currentStep={2} 
        steps={["Upload", "Configure", "Generate", "Take Exam"]} 
      />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Generated Exams</h1>
        <p className="text-lg text-gray-600">Review and select an exam to take or download</p>
      </div>
      
      <div className="max-w-4xl mx-auto">
        {isGenerating ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-primary text-3xl mb-4"></i>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Generating Your Exam</h3>
            <p className="text-gray-600">
              Our AI is analyzing your syllabus and creating customized questions...
            </p>
          </div>
        ) : isLoadingExams ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-primary text-3xl"></i>
          </div>
        ) : exams && exams.length > 0 ? (
          <div>
            {/* Exam cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {exams.map((exam: any) => (
                <Card 
                  key={exam.id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{exam.title}</h3>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span className="flex items-center mr-4">
                        <i className="far fa-question-circle mr-1"></i> {exam.questionCount} Questions
                      </span>
                      {exam.timeLimit && (
                        <span className="flex items-center mr-4">
                          <i className="far fa-clock mr-1"></i> {exam.timeLimit} min
                        </span>
                      )}
                      <span className="flex items-center">
                        <i className="fas fa-signal mr-1"></i> {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">Topics:</div>
                      <div className="flex flex-wrap gap-2">
                        {exam.topics.slice(0, 4).map((topic: string, index: number) => (
                          <Badge 
                            key={index} 
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {topic}
                          </Badge>
                        ))}
                        {exam.topics.length > 4 && (
                          <Badge 
                            variant="secondary"
                            className="bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            +{exam.topics.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <Button 
                          variant="ghost" 
                          className="text-primary hover:text-blue-700 text-sm font-medium"
                          onClick={() => handleDownloadExam(exam)}
                        >
                          <i className="fas fa-download mr-1"></i> Download
                        </Button>
                        <Button 
                          className="bg-primary hover:bg-blue-600 text-white"
                          onClick={() => handleTakeExam(exam.id)}
                        >
                          Take Exam
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Generate more option */}
            <div className="text-center mb-8">
              <Button 
                variant="outline" 
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={handleGenerateMore}
                disabled={isGenerating}
              >
                <i className="fas fa-sync-alt mr-2"></i> Generate More Options
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No exams have been generated yet</p>
          </div>
        )}
        
        <div className="flex justify-between">
          <Button 
            variant="outline"
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Back
          </Button>
          {exams && exams.length > 0 && (
            <Button 
              className="px-6 py-2 bg-primary text-white hover:bg-blue-600"
              onClick={() => handleTakeExam(exams[0].id)}
            >
              Take Exam {exams[0].title.split(' ').pop()}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
