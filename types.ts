
export enum AppTab {
  HOME = 'HOME',
  LEVELS = 'LEVELS',
  CHAT = 'CHAT',
  NEWS = 'NEWS',
  ADMIN = 'ADMIN',
}

export type Language = 'ar' | 'en';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export type QuestionType = 'MCQ' | 'TF' | 'FILL_BLANK';

export interface Question {
  id: number;
  type: QuestionType;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface ExamSection {
  id: number;
  title: string; // Title of this specific passage
  content: string; // The reading passage
  questions: Question[];
}

export interface ExamData {
  level: number;
  title: string; // Main title of the exam
  sections: ExamSection[]; // Array of passages/sections
  timeLimit: number; // Suggested time in seconds
}

export type ExamMode = 'TIMED' | 'UNTIMED';

export interface ExamResult {
  id: string;
  studentName: string;
  level: number;
  score: number;
  totalQuestions: number;
  date: string; // ISO string
  mode: ExamMode;
  language: Language; // Added to track which language exam was taken
  details: {
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface UserProgress {
  currentLevel: number; // 1 to 12
  maxUnlockedLevel: number;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

// --- NEW TYPES ---

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
}

export interface AppSettings {
  logoUrl?: string;
  heroBgUrl?: string;
  schoolNameAr: string;
  schoolNameEn: string;
}

export interface CloudConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}