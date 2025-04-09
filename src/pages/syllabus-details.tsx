import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useExam } from "@/context/exam-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface Syllabus {
  id: number;
  filename: string;
  originalName: string;
  contentType: string;
  content: string;
  uploadedAt: string;
}

interface Exam {
  id: number;
  title: string;
  syllabusId: number;
  type: "multiple-choice" | "short-answer";
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionCount: number;
  timeLimit?: number;
  topics: string[];
  createdAt: string;
}

export default function SyllabusDetails() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { setSyllabusId } = useExam();
  const [activeTab, setActiveTab] = useState("exams");
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query to fetch syllabus details
  const { data: syllabus, isLoading: syllabusLoading } = useQuery<Syllabus>({
    queryKey: [`/api/syllabuses/${id}`],
    refetchOnWindowFocus: false,
  });

  // Query to fetch exams for this syllabus
  const { data: exams, isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: [`/api/syllabuses/${id}/exams`],
    refetchOnWindowFocus: false,
  });

  // Set the syllabusId in the exam context
  useEffect(() => {
    if (id) {
      setSyllabusId(parseInt(id));
    }
  }, [id, setSyllabusId]);

  const handleGenerateExam = () => {
    navigate(`/configure/${id}`);
  };

  const handleTakeExam = (examId: number) => {
    navigate(`/take-exam/${examId}`);
  };
  
  const handleDeleteSyllabus = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      
      // Delete the syllabus
      const response = await apiRequest('DELETE', `/api/syllabuses/${id}`);
      
      if (response.ok) {
        // Invalidate the syllabuses cache
        queryClient.invalidateQueries({ queryKey: ['/api/syllabuses'] });
        
        toast({
          title: 'Success',
          description: 'Syllabus has been deleted successfully.',
        });
        
        // Navigate back to the home page
        navigate('/');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete syllabus');
      }
    } catch (error: any) {
      console.error('Error deleting syllabus:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete syllabus',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      case "mixed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getExamTypeIcon = (type: string) => {
    return type === "multiple-choice" ? 
      "fas fa-list-ul" : 
      "fas fa-pen";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {syllabusLoading ? (
        <div className="text-center py-10">
          <i className="fas fa-spinner fa-spin text-primary text-3xl mb-4"></i>
          <p className="text-gray-600">Loading syllabus details...</p>
        </div>
      ) : !syllabus ? (
        <div className="text-center py-10">
          <i className="fas fa-exclamation-circle text-red-500 text-3xl mb-4"></i>
          <p className="text-gray-700">Syllabus not found</p>
          <Button 
            onClick={() => navigate("/")}
            className="mt-4 bg-primary hover:bg-blue-600 text-white"
          >
            Return to Home
          </Button>
        </div>
      ) : (
        <>
          {/* Syllabus Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  className="mr-2" 
                  onClick={() => navigate("/")}
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Syllabus Details</h1>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <i className="fas fa-trash-alt mr-2"></i>
                    Delete Syllabus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this syllabus and all exams generated from it.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteSyllabus}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                      {isDeleting ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-trash-alt mr-2"></i>
                          Delete
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <i className={`far fa-file${syllabus.contentType.includes('pdf') ? '-pdf text-red-500' : syllabus.contentType.includes('word') ? '-word text-blue-500' : ' text-gray-500'} text-3xl`}></i>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-1">{syllabus.originalName}</h2>
                    <p className="text-sm text-gray-500 mb-2">
                      Uploaded on {formatDate(syllabus.uploadedAt)}
                    </p>
                    <div className="mt-3">
                      <Button 
                        onClick={handleGenerateExam}
                        className="bg-primary hover:bg-blue-600 text-white"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Generate New Exam
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="exams" className="text-base py-2 px-4">
                <i className="fas fa-file-alt mr-2"></i>
                Exams
              </TabsTrigger>
              <TabsTrigger value="content" className="text-base py-2 px-4">
                <i className="fas fa-book mr-2"></i>
                Syllabus Content
              </TabsTrigger>
            </TabsList>

            {/* Exams Tab */}
            <TabsContent value="exams" className="mt-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Generated Exams</h2>
              </div>
              
              {examsLoading ? (
                <div className="text-center py-8">
                  <i className="fas fa-spinner fa-spin text-primary text-2xl"></i>
                  <p className="mt-2 text-gray-600">Loading exams...</p>
                </div>
              ) : !exams || exams.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <i className="fas fa-file-alt text-gray-400 text-4xl mb-3"></i>
                    <p className="text-gray-600 mb-4">No exams have been generated yet</p>
                    <Button 
                      onClick={handleGenerateExam}
                      className="bg-primary hover:bg-blue-600 text-white"
                    >
                      Create Your First Exam
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exams.map((exam: Exam) => (
                    <Card key={exam.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="outline" className={getDifficultyColor(exam.difficulty)}>
                            {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
                          </Badge>
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            <i className={`${getExamTypeIcon(exam.type)} mr-1`}></i>
                            {exam.type === "multiple-choice" ? "Multiple Choice" : "Short Answer"}
                          </Badge>
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">
                            {exam.questionCount} Questions
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          Generated on {formatDate(exam.createdAt)}
                        </p>
                        <div className="mt-3">
                          <Button 
                            onClick={() => handleTakeExam(exam.id)}
                            className="w-full bg-primary hover:bg-blue-600 text-white"
                          >
                            <i className="fas fa-pen-alt mr-2"></i>
                            Take Exam
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Syllabus Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-[500px] whitespace-pre-wrap">
                    {syllabus.content}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}