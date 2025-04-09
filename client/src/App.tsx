import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ExamProvider } from "./context/exam-context";
import NotFound from "@/pages/not-found";
import Navbar from "./components/layout/navbar";
import Footer from "./components/layout/footer";
import Home from "./pages/home";
import Upload from "./pages/upload";
import Configure from "./pages/configure";
import GeneratedExams from "./pages/generated-exams";
import TakeExamSimple from "./pages/take-exam-simple";
import SyllabusDetails from "./pages/syllabus-details";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload" component={Upload} />
      <Route path="/configure/:syllabusId" component={Configure} />
      <Route path="/exams/:syllabusId" component={GeneratedExams} />
      <Route path="/take-exam/:examId" component={TakeExamSimple} />
      <Route path="/syllabus/:id" component={SyllabusDetails} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ExamProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </ExamProvider>
    </QueryClientProvider>
  );
}

export default App;
