import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useExam } from "@/context/exam-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import StepIndicator from "@/components/step-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Configure() {
  const params = useParams<{ syllabusId: string }>();
  const [, navigate] = useLocation();
  const syllabusId = parseInt(params.syllabusId);
  const { toast } = useToast();
  const { 
    setSyllabusId, 
    examConfig, 
    updateExamConfig
  } = useExam();
  
  const [isTimeLimit, setIsTimeLimit] = useState(false);
  
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
  const { data: syllabus, isLoading } = useQuery({
    queryKey: [`/api/syllabuses/${syllabusId}`],
    enabled: !isNaN(syllabusId)
  });
  
  const handleExamTypeChange = (value: string) => {
    updateExamConfig({ 
      type: value as "multiple-choice" | "short-answer" 
    });
  };
  
  const handleQuestionCountChange = (value: number[]) => {
    updateExamConfig({ questionCount: value[0] });
  };
  
  const handleDifficultyChange = (value: string) => {
    updateExamConfig({ 
      difficulty: value as "easy" | "medium" | "hard" | "mixed" 
    });
  };
  
  const handleTimeLimitToggle = (checked: boolean) => {
    setIsTimeLimit(checked);
    updateExamConfig({ 
      timeLimit: checked ? 60 : undefined 
    });
  };
  
  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      updateExamConfig({ timeLimit: value });
    }
  };
  
  const handleBack = () => {
    navigate("/upload");
  };
  
  const handleNext = () => {
    navigate(`/exams/${syllabusId}`);
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StepIndicator 
        currentStep={1} 
        steps={["Upload", "Configure", "Generate", "Take Exam"]} 
      />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure Your Exam</h1>
        <p className="text-lg text-gray-600">Customize the exam parameters to fit your needs</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <i className="fas fa-spinner fa-spin text-primary text-3xl"></i>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-6">
              {/* Syllabus File */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-medium text-gray-900">Syllabus File</h3>
                  <Button 
                    variant="ghost" 
                    className="text-sm text-primary hover:text-blue-700"
                    onClick={() => navigate("/upload")}
                  >
                    Change
                  </Button>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <i className={`far fa-file${
                    syllabus && typeof syllabus === 'object' && 'contentType' in syllabus && 
                    String(syllabus.contentType).includes('pdf') ? '-pdf text-red-500' : 
                    syllabus && typeof syllabus === 'object' && 'contentType' in syllabus && 
                    String(syllabus.contentType).includes('word') ? '-word text-blue-500' : 
                    ' text-gray-500'
                  } text-lg mr-3`}></i>
                  <span className="font-medium text-gray-800">
                    {syllabus && typeof syllabus === 'object' && 'originalName' in syllabus ? 
                     String(syllabus.originalName) : "Uploaded file"}
                  </span>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Exam Type */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`flex items-center p-3 border rounded-md cursor-pointer
                        ${examConfig.type === "multiple-choice" 
                          ? "border-primary" 
                          : "border-gray-300 hover:border-primary"}`}
                      onClick={() => handleExamTypeChange("multiple-choice")}
                    >
                      <input 
                        type="radio" 
                        name="exam-type" 
                        id="multiple-choice" 
                        checked={examConfig.type === "multiple-choice"} 
                        onChange={() => handleExamTypeChange("multiple-choice")}
                        className="h-4 w-4 text-primary" 
                      />
                      <Label 
                        htmlFor="multiple-choice" 
                        className="ml-2 cursor-pointer"
                      >
                        Multiple Choice
                      </Label>
                    </div>
                    <div 
                      className={`flex items-center p-3 border rounded-md cursor-pointer
                        ${examConfig.type === "short-answer" 
                          ? "border-primary" 
                          : "border-gray-300 hover:border-primary"}`}
                      onClick={() => handleExamTypeChange("short-answer")}
                    >
                      <input 
                        type="radio" 
                        name="exam-type" 
                        id="short-answer" 
                        checked={examConfig.type === "short-answer"} 
                        onChange={() => handleExamTypeChange("short-answer")}
                        className="h-4 w-4 text-primary" 
                      />
                      <Label 
                        htmlFor="short-answer" 
                        className="ml-2 cursor-pointer"
                      >
                        Short Answer
                      </Label>
                    </div>
                  </div>
                </div>
                
                {/* Number of Questions */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label 
                      htmlFor="question-count" 
                      className="block text-sm font-medium text-gray-700"
                    >
                      Number of Questions
                    </Label>
                    <span className="text-sm font-medium text-primary">
                      {examConfig.questionCount}
                    </span>
                  </div>
                  <Slider
                    id="question-count"
                    defaultValue={[examConfig.questionCount]}
                    min={5}
                    max={50}
                    step={1}
                    onValueChange={handleQuestionCountChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5</span>
                    <span>50</span>
                  </div>
                </div>
                
                {/* Difficulty Level */}
                <div>
                  <Label 
                    htmlFor="difficulty" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Difficulty Level
                  </Label>
                  <Select 
                    defaultValue={examConfig.difficulty}
                    onValueChange={handleDifficultyChange}
                  >
                    <SelectTrigger id="difficulty" className="w-full">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Time Limit */}
                <div>
                  <div className="flex items-center mb-2">
                    <Switch
                      checked={isTimeLimit}
                      onCheckedChange={handleTimeLimitToggle}
                      id="time-limit-switch"
                    />
                    <Label 
                      htmlFor="time-limit-switch"
                      className="ml-2 text-sm font-medium text-gray-700"
                    >
                      Set Time Limit
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="number" 
                      min="5" 
                      value={examConfig.timeLimit || 60} 
                      disabled={!isTimeLimit}
                      onChange={handleTimeLimitChange}
                      className="w-20 p-2 border border-gray-300 rounded-md text-center" 
                    />
                    <span className="ml-2 text-gray-600">minutes</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-between">
                <Button 
                  variant="outline"
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleNext}
                  className="px-6 py-2 bg-primary text-white hover:bg-blue-600"
                >
                  Generate Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}