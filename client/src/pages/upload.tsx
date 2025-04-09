import { useState } from "react";
import { useLocation } from "wouter";
import { useExam } from "@/context/exam-context";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import StepIndicator from "@/components/step-indicator";
import FileUploader from "@/components/file-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Upload() {
  const [, navigate] = useLocation();
  const { setSyllabusId } = useExam();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Query to fetch recent syllabuses
  const { data: syllabuses } = useQuery({
    queryKey: ["/api/syllabuses"],
    refetchOnWindowFocus: false
  });
  
  // Mutation to upload syllabus
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await apiRequest("POST", "/api/syllabuses", null, formData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/syllabuses"] });
      toast({
        title: "Upload Successful",
        description: "Your syllabus has been uploaded successfully!",
      });
      setSyllabusId(data.id);
      navigate(`/configure/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload syllabus",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });
  
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    uploadMutation.mutate(selectedFile);
  };
  
  const handleSyllabusSelect = (id: number) => {
    setSyllabusId(id);
    navigate(`/configure/${id}`);
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StepIndicator 
        currentStep={0} 
        steps={["Upload", "Configure", "Generate", "Take Exam"]} 
      />
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Syllabus</h1>
        <p className="text-lg text-gray-600">Upload your course syllabus to generate customized exams</p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <FileUploader onFileSelected={handleFileSelected} />
        
        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <i className={`far fa-file${
                selectedFile.type.includes('pdf') ? '-pdf text-red-500' : 
                selectedFile.type.includes('word') ? '-word text-blue-500' : 
                ' text-gray-500'
              } text-xl mr-3`}></i>
              <div>
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedFile(null)} 
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        
        <div className="mt-6">
          <Button 
            onClick={handleUpload} 
            className="w-full bg-primary hover:bg-blue-600 text-white"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Uploading...
              </>
            ) : (
              <>Continue</>
            )}
          </Button>
        </div>
        
        {/* Recent uploads section */}
        {syllabuses && syllabuses.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Uploads</h3>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-200">
                  {syllabuses.slice(0, 5).map((syllabus: any) => (
                    <li 
                      key={syllabus.id} 
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleSyllabusSelect(syllabus.id)}
                    >
                      <div className="flex items-center">
                        <i className={`far fa-file${
                          syllabus.contentType.includes('pdf') ? '-pdf text-red-500' : 
                          syllabus.contentType.includes('word') ? '-word text-blue-500' : 
                          ' text-gray-500'
                        } text-xl mr-3`}></i>
                        <div>
                          <p className="font-medium text-gray-800">{syllabus.originalName}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded {new Date(syllabus.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button className="text-primary hover:text-blue-700">
                        <i className="fas fa-arrow-right"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
