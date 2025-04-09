import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import StepIndicator from "@/components/step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TakeExamSimple() {
  const params = useParams<{ examId: string }>();
  const [, navigate] = useLocation();
  const examId = parseInt(params.examId);
  const { toast } = useToast();
  
  // Local state for the exam
  const [currentExam, setCurrentExam] = useState<any>(null);
  
  // Local state for the user's answers
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch exam data
  const { data: examData, isLoading: isLoadingExam } = useQuery<any>({
    queryKey: [`/api/exams/${examId}`],
    enabled: !isNaN(examId)
  });
  
  // Update the current exam and timer when examData changes
  useEffect(() => {
    if (examData) {
      setCurrentExam(examData);
      // Initialize timer if time limit is set
      if (examData.timeLimit) {
        setTimeRemaining(examData.timeLimit * 60); // Convert minutes to seconds
      }
    }
  }, [examData]); // Only depend on examData
  
  // Start exam attempt
  const startAttemptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/exams/${examId}/attempts`, {});
      return await response.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start exam attempt",
        variant: "destructive"
      });
    }
  });
  
  // Submit answers mutation
  const submitAnswersMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) return null;
      
      const answersArray = Array.from(userAnswers.entries()).map(([questionId, answer]) => ({
        questionId,
        answer
      }));
      
      const response = await apiRequest("POST", `/api/attempts/${attemptId}/answers`, answersArray);
      return await response.json();
    },
    onSuccess: (data) => {
      if (data) {
        setIsSubmitting(false);
        setExamResults(data);
        setShowResults(true);
      }
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit answers",
        variant: "destructive"
      });
    }
  });
  
  // Start exam attempt when component mounts
  useEffect(() => {
    if (examId && !isNaN(examId) && !attemptId && !isSubmitting) {
      startAttemptMutation.mutate();
    }
  }, [examId, attemptId, isSubmitting]);
  
  // Initialize and update timer
  useEffect(() => {
    if (timeRemaining !== null && !showResults) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(timerIntervalRef.current!);
            setShowTimeUpDialog(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timeRemaining, showResults]);
  
  // Format time remaining as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle next question
  const handleNextQuestion = () => {
    if (!currentExam || !currentExam.questions) return;
    
    if (currentQuestionIndex < currentExam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Handle previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Handle navigation to specific question
  const handleQuestionNavigation = (index: number) => {
    setCurrentQuestionIndex(index);
  };
  
  // Handle answer selection for multiple choice
  const handleMultipleChoiceAnswer = (questionId: number, optionId: string) => {
    const newAnswers = new Map(userAnswers);
    newAnswers.set(questionId, optionId);
    setUserAnswers(newAnswers);
  };
  
  // Handle short answer input
  const handleShortAnswerInput = (questionId: number, value: string) => {
    const newAnswers = new Map(userAnswers);
    newAnswers.set(questionId, value);
    setUserAnswers(newAnswers);
  };
  
  // Handle submit exam
  const handleSubmitExam = () => {
    setShowSubmitDialog(true);
  };
  
  // Confirm submit
  const confirmSubmit = () => {
    setShowSubmitDialog(false);
    setIsSubmitting(true);
    submitAnswersMutation.mutate();
  };
  
  // Handle time up
  const handleTimeUp = () => {
    setShowTimeUpDialog(false);
    setIsSubmitting(true);
    submitAnswersMutation.mutate();
  };
  
  // Navigate to results
  const goToResults = () => {
    navigate("/");
    
    // Show results toast
    toast({
      title: "Exam Completed",
      description: `Your score: ${examResults?.score}/${examResults?.maxScore}`,
    });
  };
  
  // Handle finish exam viewing
  const handleFinish = () => {
    // Clear answers and navigate home
    setUserAnswers(new Map());
    navigate("/");
  };
  
  // Calculate progress percentage
  const calculateProgress = (): number => {
    if (!currentExam || !currentExam.questions) return 0;
    return Math.round((currentQuestionIndex + 1) / currentExam.questions.length * 100);
  };
  
  // Count answered questions
  const countAnsweredQuestions = (): number => {
    return userAnswers.size;
  };
  
  // Get current question
  const currentQuestion = currentExam?.questions?.[currentQuestionIndex];
  
  // Check if loading
  const isLoading = isLoadingExam || (!currentExam?.questions);
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StepIndicator 
        currentStep={3} 
        steps={["Upload", "Configure", "Generate", "Take Exam"]} 
      />
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <i className="fas fa-spinner fa-spin text-primary text-3xl"></i>
        </div>
      ) : showResults && examResults ? (
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Results</h1>
            <p className="text-lg text-gray-600">
              Your score: {examResults.score}/{examResults.maxScore} 
              ({Math.round((examResults.score / examResults.maxScore) * 100)}%)
            </p>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Exam Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Exam:</span>
                  <span className="font-medium">{currentExam?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">
                    {currentExam?.type === 'multiple-choice' ? 'Multiple Choice' : 'Short Answer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium">{currentExam?.questionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="font-medium">
                    {currentExam?.difficulty.charAt(0).toUpperCase() + currentExam?.difficulty.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-medium text-primary">
                    {examResults.score}/{examResults.maxScore} 
                    ({Math.round((examResults.score / examResults.maxScore) * 100)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center mt-8">
            <Button 
              onClick={handleFinish}
              className="px-6 py-2 bg-primary text-white hover:bg-blue-600"
            >
              Finish
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{currentExam?.title}</h1>
            {timeRemaining !== null && (
              <div className={`flex items-center bg-gray-100 px-4 py-2 rounded-md ${
                timeRemaining < 60 ? 'text-red-500 font-semibold' : ''
              }`}>
                <i className="far fa-clock text-gray-600 mr-2"></i>
                <span className="font-medium">
                  Time Remaining: {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Question {currentQuestionIndex + 1} of {currentExam?.questions?.length}</span>
              <span>{calculateProgress()}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
          
          {/* Question container */}
          {currentQuestion && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Question {currentQuestionIndex + 1}</h3>
                  <p className="text-gray-800">{currentQuestion.content}</p>
                </div>
                
                {/* Answer options */}
                <div className="space-y-3 mb-6">
                  {currentQuestion.questionType === 'multiple-choice' && currentQuestion.options && (
                    currentQuestion.options.map((option: any) => (
                      <label 
                        key={option.id}
                        className={`flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                          userAnswers.get(currentQuestion.id) === option.id ? 'border-primary bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name={`q${currentQuestion.id}`}
                          value={option.id}
                          checked={userAnswers.get(currentQuestion.id) === option.id}
                          onChange={() => handleMultipleChoiceAnswer(currentQuestion.id, option.id)}
                          className="h-4 w-4 text-primary" 
                        />
                        <span className="ml-3">
                          {option.id.toUpperCase()}) {option.text}
                        </span>
                      </label>
                    ))
                  )}
                  
                  {currentQuestion.questionType === 'short-answer' && (
                    <div className="mt-4">
                      <textarea
                        value={userAnswers.get(currentQuestion.id) || ''}
                        onChange={(e) => handleShortAnswerInput(currentQuestion.id, e.target.value)}
                        placeholder="Enter your answer here..."
                        className="w-full p-3 border border-gray-300 rounded-md h-32 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  {currentQuestionIndex < (currentExam?.questions?.length || 0) - 1 ? (
                    <Button 
                      onClick={handleNextQuestion}
                      className="px-6 py-2 bg-primary text-white hover:bg-blue-600"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmitExam}
                      className="px-6 py-2 bg-green-500 text-white hover:bg-green-600"
                    >
                      Submit Exam
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Question navigator */}
          <Card>
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Question Navigator</h4>
              <div className="grid grid-cols-10 gap-2">
                {currentExam?.questions?.map((question: any, index: number) => (
                  <button 
                    key={index}
                    onClick={() => handleQuestionNavigation(index)}
                    className={`h-8 w-8 rounded flex items-center justify-center font-medium ${
                      index === currentQuestionIndex 
                        ? 'bg-primary text-white'
                        : userAnswers.get(question.id)
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t flex justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{countAnsweredQuestions()}</span> of {currentExam?.questions?.length} questions answered
                </div>
                <Button 
                  onClick={handleSubmitExam}
                  className="bg-green-500 text-white hover:bg-green-600"
                >
                  Submit Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {countAnsweredQuestions()} out of {currentExam?.questions?.length} questions. 
              Are you sure you want to submit your exam?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Time Up Dialog */}
      <Dialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time's Up!</DialogTitle>
            <DialogDescription>
              The exam time limit has been reached. Your answers will be submitted automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleTimeUp}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}