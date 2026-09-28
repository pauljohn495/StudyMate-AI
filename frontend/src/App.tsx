import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const SubjectsPage = lazy(() => import('./pages/SubjectsPage').then((module) => ({ default: module.SubjectsPage })));
const SubjectDetailPage = lazy(() => import('./pages/SubjectDetailPage').then((module) => ({ default: module.SubjectDetailPage })));
const LessonMaterialsPage = lazy(() => import('./pages/LessonMaterialsPage').then((module) => ({ default: module.LessonMaterialsPage })));
const MaterialsPage = lazy(() => import('./pages/MaterialsPage').then((module) => ({ default: module.MaterialsPage })));
const StudyToolsPage = lazy(() => import('./pages/StudyToolsPage').then((module) => ({ default: module.StudyToolsPage })));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then((module) => ({ default: module.ResourcesPage })));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage').then((module) => ({ default: module.FlashcardsPage })));
const LessonFlashcardsPage = lazy(() => import('./pages/LessonFlashcardsPage').then((module) => ({ default: module.LessonFlashcardsPage })));
const FlashcardStudyPage = lazy(() => import('./pages/FlashcardStudyPage').then((module) => ({ default: module.FlashcardStudyPage })));
const QuizzesPage = lazy(() => import('./pages/QuizzesPage').then((module) => ({ default: module.QuizzesPage })));
const LessonQuizPage = lazy(() => import('./pages/LessonQuizPage').then((module) => ({ default: module.LessonQuizPage })));
const QuizTakePage = lazy(() => import('./pages/QuizTakePage').then((module) => ({ default: module.QuizTakePage })));
const QuizResultPage = lazy(() => import('./pages/QuizResultPage').then((module) => ({ default: module.QuizResultPage })));
const TutorPage = lazy(() => import('./pages/TutorPage').then((module) => ({ default: module.TutorPage })));
const ExamsPage = lazy(() => import('./pages/ExamsPage').then((module) => ({ default: module.ExamsPage })));
const ExamTakePage = lazy(() => import('./pages/ExamTakePage').then((module) => ({ default: module.ExamTakePage })));
const ExamResultPage = lazy(() => import('./pages/ExamResultPage').then((module) => ({ default: module.ExamResultPage })));
const PlannerPage = lazy(() => import('./pages/PlannerPage').then((module) => ({ default: module.PlannerPage })));
const PlanDetailPage = lazy(() => import('./pages/PlanDetailPage').then((module) => ({ default: module.PlanDetailPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then((module) => ({ default: module.ProgressPage })));
const SettingsPage = lazy(() => import('./pages/UtilityPages').then((module) => ({ default: module.SettingsPage })));
const NotFoundPage = lazy(() => import('./pages/UtilityPages').then((module) => ({ default: module.NotFoundPage })));

function RouteLoader() {
  return <div className="grid min-h-[40vh] place-items-center" role="status"><span className="size-7 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"/><span className="sr-only">Loading page</span></div>;
}

export default function App() {
  return <Suspense fallback={<RouteLoader/>}><Routes><Route path="/" element={<LandingPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/register" element={<RegisterPage/>}/><Route element={<ProtectedRoute/>}><Route path="/app" element={<AppShell/>}><Route index element={<DashboardPage/>}/><Route path="subjects" element={<SubjectsPage/>}/><Route path="subjects/:id" element={<SubjectDetailPage/>}/><Route path="lessons/:id" element={<LessonMaterialsPage/>}/><Route path="lessons/:id/study-tools" element={<StudyToolsPage/>}/><Route path="lessons/:id/flashcards" element={<LessonFlashcardsPage/>}/><Route path="lessons/:id/quizzes" element={<LessonQuizPage/>}/><Route path="materials" element={<MaterialsPage/>}/><Route path="reviewers" element={<ResourcesPage/>}/><Route path="flashcards" element={<FlashcardsPage/>}/><Route path="flashcards/:id/study" element={<FlashcardStudyPage/>}/><Route path="quizzes" element={<QuizzesPage/>}/><Route path="quizzes/:id/take" element={<QuizTakePage/>}/><Route path="quiz-attempts/:id" element={<QuizResultPage/>}/><Route path="tutor" element={<TutorPage/>}/><Route path="exams" element={<ExamsPage/>}/><Route path="exams/:id/take" element={<ExamTakePage/>}/><Route path="exams/attempts/:id" element={<ExamResultPage/>}/><Route path="planner" element={<PlannerPage/>}/><Route path="planner/:id" element={<PlanDetailPage/>}/><Route path="progress" element={<ProgressPage/>}/><Route path="settings" element={<SettingsPage/>}/><Route path="coming-soon" element={<Navigate replace to="/app/tutor"/>}/></Route></Route><Route path="*" element={<NotFoundPage/>}/></Routes></Suspense>;
}
