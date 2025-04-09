import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Syllabus } from "./useFetchSyllabuses";

export function useUploadSyllabus() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadSyllabus = async (filename: string): Promise<Syllabus | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const newSyllabus = {
        filename,
        originalName: filename,
        contentType: "application/pdf", // Example content type
        uploadedAt: Timestamp.now().toDate().toISOString(),
      };

      const docRef = await addDoc(collection(db, "syllabuses"), newSyllabus);
      setIsUploading(false);
      return { id: docRef.id, ...newSyllabus };
    } catch (err) {
      setUploadError("Failed to upload syllabus.");
      setIsUploading(false);
      return null;
    }
  };

  return { uploadSyllabus, isUploading, uploadError };
}
