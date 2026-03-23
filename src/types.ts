export interface Problem {
  id: number;
  title: string;
  leetcodeNumber: number;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  patterns: string[];
  description: string;
  hints: [string, string, string, string];
  keyInsight: string;
  relatedProblems?: number[]; // ids of related problems (easier → harder progression)
  timeComplexity: string; // e.g. "O(n)", "O(n log n)"
  spaceComplexity: string; // e.g. "O(1)", "O(n)"
}

export interface ReviewEntry {
  date: string;
  quality: number; // 0-5
  timeSpent: number; // seconds
  hintsUsed: number; // 0-4
  insight: string;
}

export interface ProblemProgress {
  problemId: number;
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReviewDate: string; // ISO date string
  lastReviewDate: string;
  history: ReviewEntry[];
}

export interface SessionConfig {
  maxProblems: number;
  timerMinutes: number;
  includeNew: boolean;
  patternFilter?: string[];
  difficultyFilter?: ('Easy' | 'Medium' | 'Hard')[];
}

export interface SessionProblem {
  problem: Problem;
  reason: 'due' | 'overdue' | 'new' | 'weakness';
}

export interface SessionRecord {
  id: string;
  date: string;
  mode: 'practice' | 'mock-interview';
  problems: {
    problemId: number;
    quality: number;
    timeSpent: number;
    hintsUsed: number;
  }[];
  totalTime: number;
  avgQuality: number;
}

export interface UserStats {
  totalReviews: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  problemsMastered: number; // interval >= 21 days
  patternsEncountered: string[];
}
