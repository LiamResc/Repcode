import { Problem, SessionConfig, SessionProblem } from '../types';
import { isDue, isOverdue } from './spaced-repetition';
import { getAllProgress } from './storage';
import { toLocalDateString } from './date-utils';

/** Minimum days after last review before a problem can appear again */
const COOLDOWN_DAYS = 2;

/**
 * Weights for weighted random selection.
 * Higher weight = more likely to be picked, but never guaranteed.
 * Every non-empty category has a chance of being selected.
 */
const CATEGORY_WEIGHTS = {
  overdue: 10,
  due: 6,
  weakness: 4,
  new: 3,
};

export function generateSession(
  problems: Problem[],
  config: SessionConfig
): SessionProblem[] {
  const allProgress = getAllProgress();
  const today = new Date(toLocalDateString());

  const pools: Record<string, SessionProblem[]> = {
    overdue: [],
    due: [],
    weakness: [],
    new: [],
  };

  for (const problem of problems) {
    // Apply filters
    if (config.difficultyFilter && config.difficultyFilter.length > 0) {
      if (!config.difficultyFilter.includes(problem.difficulty)) continue;
    }
    if (config.patternFilter && config.patternFilter.length > 0) {
      if (!problem.patterns.some((p) => config.patternFilter!.includes(p))) continue;
    }

    const progress = allProgress[problem.id];

    // New problem — never reviewed
    if (!progress || progress.history.length === 0) {
      if (config.includeNew) {
        pools.new.push({ problem, reason: 'new' });
      }
      continue;
    }

    // Cooldown: skip problems reviewed too recently
    if (progress.lastReviewDate) {
      const lastReview = new Date(progress.lastReviewDate);
      const daysSince = Math.floor((today.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince < COOLDOWN_DAYS) continue;
    }

    // Categorize: overdue and due are mutually exclusive
    if (isOverdue(progress)) {
      pools.overdue.push({ problem, reason: 'overdue' });
    } else if (isDue(progress)) {
      pools.due.push({ problem, reason: 'due' });
    }

    // Weakness: use recent quality (last 3 reviews)
    const recentHistory = progress.history.slice(-3);
    const recentAvg = recentHistory.reduce((sum, r) => sum + r.quality, 0) / recentHistory.length;
    if (recentAvg < 3 && progress.history.length >= 2) {
      pools.weakness.push({ problem, reason: 'weakness' });
    }
  }

  // Shuffle each pool
  for (const key of Object.keys(pools)) {
    shuffle(pools[key]);
  }

  // Weighted random selection across all categories
  const session: SessionProblem[] = [];
  const used = new Set<number>();

  while (session.length < config.maxProblems) {
    // Build weighted list of non-empty pools (excluding already-used problems)
    const available: { key: string; weight: number }[] = [];
    for (const [key, pool] of Object.entries(pools)) {
      if (key === 'new' && !config.includeNew) continue;
      // Check if pool has any unused problems left
      if (pool.some((p) => !used.has(p.problem.id))) {
        available.push({ key, weight: CATEGORY_WEIGHTS[key as keyof typeof CATEGORY_WEIGHTS] });
      }
    }

    // No more problems available
    if (available.length === 0) break;

    // Weighted random pick of category
    const totalWeight = available.reduce((sum, a) => sum + a.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosenKey = available[0].key;
    for (const { key, weight } of available) {
      roll -= weight;
      if (roll <= 0) {
        chosenKey = key;
        break;
      }
    }

    // Pick the next unused problem from that pool
    const pool = pools[chosenKey];
    const idx = pool.findIndex((p) => !used.has(p.problem.id));
    if (idx !== -1) {
      const picked = pool[idx];
      session.push(picked);
      used.add(picked.problem.id);
    }
  }

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
