import { ProblemProgress, ReviewEntry } from '../types';

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings:
 * 0 - Complete blank, couldn't start
 * 1 - Wrong, but recognized pattern after seeing solution
 * 2 - Wrong, but knew the general approach
 * 3 - Correct, but with significant difficulty or hints
 * 4 - Correct with minor hesitation
 * 5 - Perfect, immediate recognition
 */

export function calculateNextReview(
  progress: ProblemProgress,
  quality: number
): ProblemProgress {
  let { easeFactor, interval, repetitions } = progress;

  if (quality >= 3) {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Failed recall — reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor (minimum 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...progress,
    easeFactor,
    interval,
    repetitions,
    nextReviewDate: nextReview.toISOString().split('T')[0],
    lastReviewDate: now.toISOString().split('T')[0],
  };
}

export function qualityFromReview(
  hintsUsed: number,
  solvedCorrectly: boolean,
  timeSpent: number,
  timerLimit: number
): number {
  if (!solvedCorrectly) {
    if (hintsUsed >= 3) return 0;
    if (hintsUsed >= 1) return 1;
    return 2;
  }

  // Solved correctly
  if (hintsUsed >= 2) return 3;
  if (hintsUsed === 1 || timeSpent > timerLimit * 0.8) return 4;
  return 5;
}

export function createInitialProgress(problemId: number): ProblemProgress {
  return {
    problemId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString().split('T')[0],
    lastReviewDate: '',
    history: [],
  };
}

export function isDue(progress: ProblemProgress): boolean {
  const today = new Date().toISOString().split('T')[0];
  return progress.nextReviewDate <= today;
}

export function isOverdue(progress: ProblemProgress, days: number = 3): boolean {
  const dueDate = new Date(progress.nextReviewDate);
  const overdueCutoff = new Date();
  overdueCutoff.setDate(overdueCutoff.getDate() - days);
  return dueDate < overdueCutoff;
}

export function getMasteryLevel(progress: ProblemProgress): 'new' | 'learning' | 'reviewing' | 'mastered' {
  if (progress.history.length === 0) return 'new';
  if (progress.interval >= 21) return 'mastered';
  if (progress.interval >= 6) return 'reviewing';
  return 'learning';
}

export function getAverageQuality(progress: ProblemProgress): number {
  if (progress.history.length === 0) return 0;
  const sum = progress.history.reduce((acc, entry) => acc + entry.quality, 0);
  return sum / progress.history.length;
}
