import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebaseConfig";

export interface Syllabus {
  id: string;
  filename: string;
  originalName: string;
  contentType: string;
  uploadedAt: string;
}

export function useFetchSyllabuses() {
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSyllabuses = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "syllabuses"));
        const fetchedSyllabuses: Syllabus[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Syllabus[];
        setSyllabuses(fetchedSyllabuses);
      } catch (err) {
        setError("Failed to load syllabuses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSyllabuses();
  }, []);

  return { syllabuses, isLoading, error };
}