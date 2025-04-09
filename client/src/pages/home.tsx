import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useExam } from "@/context/exam-context";

interface Syllabus {
  id: number;
  filename: string;
  originalName: string;
  contentType: string;
  content: string;
  uploadedAt: string;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { setSyllabusId } = useExam();
  
  // Query to fetch recent syllabuses
  const { data: syllabuses, isLoading, error } = useQuery<Syllabus[]>({
    queryKey: ["/api/syllabuses"],
    refetchOnWindowFocus: false
  });
  
  // Reset exam context when landing on home page
  useEffect(() => {
    setSyllabusId(null);
  }, [setSyllabusId]);
  
  const handleCreateNewExam = () => {
    navigate("/upload");
  };
  
  const handleUseSavedSyllabus = (id: number) => {
    setSyllabusId(id);
    navigate(`/configure/${id}`);
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to ExamGenius</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Upload your course syllabus and let AI generate customized exams for effective studying.
        </p>
        <Button 
          onClick={handleCreateNewExam}
          className="mt-6 px-6 py-3 bg-primary hover:bg-blue-600 text-white text-lg"
        >
          Create New Exam
        </Button>
      </div>
      
      {/* Recent Uploads Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Syllabuses</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <i className="fas fa-spinner fa-spin text-primary text-3xl"></i>
            <p className="mt-2 text-gray-600">Loading recent uploads...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-4">
                <i className="fas fa-exclamation-circle text-red-500 text-3xl"></i>
                <p className="mt-2 text-gray-700">Failed to load recent uploads</p>
              </div>
            </CardContent>
          </Card>
        ) : syllabuses?.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <i className="fas fa-file-upload text-gray-400 text-3xl"></i>
                <p className="mt-2 text-gray-600">No syllabuses uploaded yet</p>
                <Button 
                  onClick={handleCreateNewExam}
                  className="mt-4 bg-primary hover:bg-blue-600 text-white"
                >
                  Upload Your First Syllabus
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {syllabuses?.map((syllabus: Syllabus) => (
              <Card key={syllabus.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div 
                    className="flex items-start cursor-pointer" 
                    onClick={() => navigate(`/syllabus/${syllabus.id}`)}
                  >
                    <div className="flex-shrink-0 mr-3">
                      <i className={`far fa-file${syllabus.contentType.includes('pdf') ? '-pdf text-red-500' : syllabus.contentType.includes('word') ? '-word text-blue-500' : ' text-gray-500'} text-2xl`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{syllabus.originalName}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(syllabus.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/syllabus/${syllabus.id}`)}
                      className="text-primary border-primary hover:bg-primary/10"
                    >
                      <i className="fas fa-eye mr-2"></i>
                      View Details
                    </Button>
                    <Button 
                      onClick={() => handleUseSavedSyllabus(syllabus.id)}
                      className="bg-primary hover:bg-blue-600 text-white"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Generate Exam
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Features Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <i className="fas fa-magic text-primary text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Generation</h3>
              <p className="text-gray-600">Generate custom exams based on your course materials</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <i className="fas fa-sliders-h text-primary text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Customizable Options</h3>
              <p className="text-gray-600">Adjust difficulty, question types, and topics</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <i className="fas fa-graduation-cap text-primary text-3xl"></i>
              </div>
              <h3 className="text-lg font-semibold mb-2">Interactive Exam Experience</h3>
              <p className="text-gray-600">Take generated exams online with instant feedback</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
