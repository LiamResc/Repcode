import { Problem, ProblemProgress, SessionConfig, SessionProblem } from '../types';
import { isDue, isOverdue, getMasteryLevel, getAverageQuality } from './spaced-repetition';
import { getAllProgress, getOrCreateProgress } from './storage';

export function generateSession(
  problems: Problem[],
  config: SessionConfig
): SessionProblem[] {
  const allProgress = getAllProgress();
  const session: SessionProblem[] = [];

  // 1. Collect overdue problems (highest priority)
  const overdue: SessionProblem[] = [];
  // 2. Collect due problems
  const due: SessionProblem[] = [];
  // 3. Collect weakness problems (low average quality)
  const weaknesses: SessionProblem[] = [];
  // 4. Collect new problems
  const newProblems: SessionProblem[] = [];

  for (const problem of problems) {
    // Apply filters
    if (config.difficultyFilter && config.difficultyFilter.length > 0) {
      if (!config.difficultyFilter.includes(problem.difficulty)) continue;
    }
    if (config.patternFilter && config.patternFilter.length > 0) {
      if (!problem.patterns.some((p) => config.patternFilter!.includes(p))) continue;
    }

    const progress = allProgress[problem.id];

    if (!progress || progress.history.length === 0) {
      if (config.includeNew) {
        newProblems.push({ problem, reason: 'new' });
      }
      continue;
    }

    if (isOverdue(progress)) {
      overdue.push({ problem, reason: 'overdue' });
    } else if (isDue(progress)) {
      due.push({ problem, reason: 'due' });
    }

    // Weakness: has been reviewed but average quality is low
    const avgQuality = getAverageQuality(progress);
    if (avgQuality < 3 && progress.history.length >= 2) {
      weaknesses.push({ problem, reason: 'weakness' });
    }
  }

  // Shuffle each category for variety
  shuffle(overdue);
  shuffle(due);
  shuffle(weaknesses);
  shuffle(newProblems);

  // Build session: prioritize overdue > due > weakness > new
  const addToSession = (items: SessionProblem[]) => {
    for (const item of items) {
      if (session.length >= config.maxProblems) return;
      if (!session.some((s) => s.problem.id === item.problem.id)) {
        session.push(item);
      }
    }
  };

  addToSession(overdue);
  addToSession(due);
  addToSession(weaknesses);
  addToSession(newProblems);

  // Interleave by pattern to avoid consecutive same-pattern problems
  return interleaveByPattern(session);
}

function interleaveByPattern(session: SessionProblem[]): SessionProblem[] {
  if (session.length <= 2) return session;

  const result: SessionProblem[] = [];
  const remaining = [...session];

  // Start with a random problem
  const firstIdx = Math.floor(Math.random() * remaining.length);
  result.push(remaining.splice(firstIdx, 1)[0]);

  while (remaining.length > 0) {
    const lastPatterns = result[result.length - 1].problem.patterns;

    // Find the problem with the least pattern overlap with the last one
    let bestIdx = 0;
    let bestScore = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const overlap = remaining[i].problem.patterns.filter((p) =>
        lastPatterns.includes(p)
      ).length;
      if (overlap < bestScore) {
        bestScore = overlap;
        bestIdx = i;
      }
    }

    result.push(remaining.splice(bestIdx, 1)[0]);
  }

  return result;
}

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function getDueCount(problems: Problem[]): number {
  const allProgress = getAllProgress();
  let count = 0;
  for (const problem of problems) {
    const progress = allProgress[problem.id];
    if (progress && isDue(progress)) {
      count++;
    }
  }
  return count;
}

export function getWeakPatterns(problems: Problem[]): { pattern: string; avgQuality: number; count: number }[] {
  const allProgress = getAllProgress();
  const patternStats: Record<string, { totalQuality: number; count: number }> = {};

  for (const problem of problems) {
    const progress = allProgress[problem.id];
    if (!progress || progress.history.length === 0) continue;

    const avgQ = progress.history.reduce((sum, h) => sum + h.quality, 0) / progress.history.length;

    for (const pattern of problem.patterns) {
      if (!patternStats[pattern]) {
        patternStats[pattern] = { totalQuality: 0, count: 0 };
      }
      patternStats[pattern].totalQuality += avgQ;
      patternStats[pattern].count += 1;
    }
  }

  return Object.entries(patternStats)
    .map(([pattern, stats]) => ({
      pattern,
      avgQuality: stats.totalQuality / stats.count,
      count: stats.count,
    }))
    .sort((a, b) => a.avgQuality - b.avgQuality);
}

export function getAllPatterns(problems: Problem[]): string[] {
  const patterns = new Set<string>();
  for (const problem of problems) {
    for (const pattern of problem.patterns) {
      patterns.add(pattern);
    }
  }
  return Array.from(patterns).sort();
}
