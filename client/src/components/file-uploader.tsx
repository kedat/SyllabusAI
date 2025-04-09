import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export default function FileUploader({ 
  onFileSelected, 
  accept = ".pdf,.docx,.txt", 
  maxSize = 10 
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };
  
  const validateAndProcessFile = (file: File) => {
    // Check file type
    const acceptedTypes = accept.split(",").map(type => 
      type.trim().replace(".", "").toLowerCase()
    );
    
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!acceptedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: `Please upload ${accept} files only.`,
        variant: "destructive"
      });
      return;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      toast({
        title: "File too large",
        description: `File size should not exceed ${maxSize}MB.`,
        variant: "destructive"
      });
      return;
    }
    
    // Process the file
    onFileSelected(file);
  };
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
        ${isDragOver ? "border-primary bg-blue-50" : "border-gray-300 hover:border-primary"}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseClick}
    >
      <div className="space-y-4">
        <i className={`fas fa-cloud-upload-alt text-5xl ${isDragOver ? "text-primary" : "text-gray-400"} upload-icon transition-colors`}></i>
        <div className="text-gray-600">
          <p className="font-medium">Drag and drop your syllabus file</p>
          <p className="text-sm">or</p>
        </div>
        <Button className="bg-primary hover:bg-blue-600 text-white">
          Browse Files
        </Button>
        <input 
          type="file" 
          className="hidden" 
          accept={accept}
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />
        <p className="text-sm text-gray-500">Supported formats: PDF, DOCX, TXT</p>
        <p className="text-sm text-gray-500">Maximum size: {maxSize}MB</p>
      </div>
    </div>
  );
}
