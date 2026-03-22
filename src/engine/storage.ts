import { ProblemProgress, ReviewEntry, UserStats, SessionRecord } from '../types';
import { createInitialProgress } from './spaced-repetition';

const STORAGE_KEYS = {
  PROGRESS: 'repcode_progress',
  STATS: 'repcode_stats',
  SESSIONS: 'repcode_sessions',
} as const;

// Progress

export function getAllProgress(): Record<number, ProblemProgress> {
  const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (!raw) return {};
  return JSON.parse(raw);
}

export function getProgress(problemId: number): ProblemProgress | null {
  const all = getAllProgress();
  return all[problemId] || null;
}

export function getOrCreateProgress(problemId: number): ProblemProgress {
  const existing = getProgress(problemId);
  if (existing) return existing;
  return createInitialProgress(problemId);
}

export function saveProgress(progress: ProblemProgress): void {
  const all = getAllProgress();
  all[progress.problemId] = progress;
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
}

export function addReviewEntry(problemId: number, entry: ReviewEntry, updatedProgress: ProblemProgress): void {
  updatedProgress.history.push(entry);
  saveProgress(updatedProgress);
  updateStatsAfterReview();
}

// Stats

export function getStats(): UserStats {
  const raw = localStorage.getItem(STORAGE_KEYS.STATS);
  if (!raw) {
    return {
      totalReviews: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPracticeDate: null,
      problemsMastered: 0,
      patternsEncountered: [],
    };
  }
  return JSON.parse(raw);
}

function saveStats(stats: UserStats): void {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

function updateStatsAfterReview(): void {
  const stats = getStats();
  const allProgress = getAllProgress();
  const today = new Date().toISOString().split('T')[0];

  stats.totalReviews += 1;

  // Update streak
  if (stats.lastPracticeDate) {
    const lastDate = new Date(stats.lastPracticeDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      stats.currentStreak += 1;
    } else if (diffDays > 1) {
      stats.currentStreak = 1;
    }
    // diffDays === 0 means same day, streak stays
  } else {
    stats.currentStreak = 1;
  }

  stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
  stats.lastPracticeDate = today;

  // Count mastered problems (interval >= 21 days)
  stats.problemsMastered = Object.values(allProgress).filter(
    (p) => p.interval >= 21
  ).length;

  saveStats(stats);
}

// Session History

export function getSessionHistory(): SessionRecord[] {
  const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!raw) return [];
  return JSON.parse(raw);
}

export function saveSessionRecord(record: SessionRecord): void {
  const history = getSessionHistory();
  history.push(record);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(history));
}

export function exportData(): string {
  return JSON.stringify({
    progress: getAllProgress(),
    stats: getStats(),
    sessions: getSessionHistory(),
    exportDate: new Date().toISOString(),
  }, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.progress) {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
    }
    if (data.stats) {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
    }
    if (data.sessions) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
    }
    return true;
  } catch {
    return false;
  }
}
