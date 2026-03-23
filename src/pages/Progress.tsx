import { useMemo } from 'react';
import {
  BarChart3,
  Target,
  Brain,
  TrendingUp,
  Clock,
  Zap,
  Calendar,
} from 'lucide-react';
import { problems } from '../data/problems';
import { toLocalDateString } from '../engine/date-utils';
import { getAllProgress } from '../engine/storage';
import { getMasteryLevel, getAverageQuality } from '../engine/spaced-repetition';
import { getAllPatterns, getWeakPatterns } from '../engine/session-generator';
import { PatternTag } from '../components/PatternTag';

export function Progress() {
  const allProgress = getAllProgress();

  const stats = useMemo(() => {
    const progressEntries = Object.values(allProgress);

    const masteryBreakdown = {
      new: 0,
      learning: 0,
      reviewing: 0,
      mastered: 0,
    };

    let totalReviews = 0;
    let totalTime = 0;
    let totalQualitySum = 0;
    let totalQualityCount = 0;
    const reviewsByDate: Record<string, number> = {};

    for (const progress of progressEntries) {
      const level = getMasteryLevel(progress);
      masteryBreakdown[level]++;

      for (const review of progress.history) {
        totalReviews++;
        totalTime += review.timeSpent;
        totalQualitySum += review.quality;
        totalQualityCount++;

        reviewsByDate[review.date] = (reviewsByDate[review.date] || 0) + 1;
      }
    }

    // New problems (never reviewed)
    masteryBreakdown.new = problems.length - progressEntries.length +
      progressEntries.filter(p => p.history.length === 0).length;

    // Pattern mastery
    const patternProgress: Record<
      string,
      { total: number; mastered: number; avgQuality: number; reviews: number }
    > = {};

    for (const problem of problems) {
      const progress = allProgress[problem.id];
      for (const pattern of problem.patterns) {
        if (!patternProgress[pattern]) {
          patternProgress[pattern] = {
            total: 0,
            mastered: 0,
            avgQuality: 0,
            reviews: 0,
          };
        }
        patternProgress[pattern].total++;
        if (progress) {
          const level = getMasteryLevel(progress);
          if (level === 'mastered') patternProgress[pattern].mastered++;
          const avg = getAverageQuality(progress);
          if (progress.history.length > 0) {
            patternProgress[pattern].avgQuality += avg;
            patternProgress[pattern].reviews++;
          }
        }
      }
    }

    // Finalize averages
    for (const key of Object.keys(patternProgress)) {
      const pp = patternProgress[key];
      if (pp.reviews > 0) {
        pp.avgQuality = pp.avgQuality / pp.reviews;
      }
    }

    // Activity heatmap data (last 30 days)
    const last30Days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateString(d);
      last30Days.push({ date: dateStr, count: reviewsByDate[dateStr] || 0 });
    }

    return {
      masteryBreakdown,
      totalReviews,
      totalTime,
      avgQuality: totalQualityCount > 0 ? totalQualitySum / totalQualityCount : 0,
      patternProgress,
      last30Days,
    };
  }, [allProgress]);

  const totalStarted =
    stats.masteryBreakdown.learning +
    stats.masteryBreakdown.reviewing +
    stats.masteryBreakdown.mastered;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Progress</h1>

      {totalStarted === 0 ? (
        <div className="card text-center py-16">
          <BarChart3 size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-400 text-lg">No data yet</p>
          <p className="text-gray-600 mt-2">
            Complete some practice sessions to see your progress.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <Target size={20} className="mx-auto text-blue-400 mb-2" />
              <p className="text-2xl font-bold">{totalStarted}</p>
              <p className="text-sm text-gray-500">Problems Attempted</p>
            </div>
            <div className="card text-center">
              <Brain size={20} className="mx-auto text-green-400 mb-2" />
              <p className="text-2xl font-bold">{stats.masteryBreakdown.mastered}</p>
              <p className="text-sm text-gray-500">Mastered</p>
            </div>
            <div className="card text-center">
              <TrendingUp size={20} className="mx-auto text-purple-400 mb-2" />
              <p className="text-2xl font-bold">{(stats.avgQuality * 2).toFixed(1)}/10</p>
              <p className="text-sm text-gray-500">Avg Quality Score</p>
            </div>
            <div className="card text-center">
              <Clock size={20} className="mx-auto text-amber-400 mb-2" />
              <p className="text-2xl font-bold">
                {Math.round(stats.totalTime / 60)}m
              </p>
              <p className="text-sm text-gray-500">Total Practice Time</p>
            </div>
          </div>

          {/* Mastery Breakdown */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-400" />
              Mastery Breakdown
            </h2>
            <div className="space-y-4">
              {/* Bar */}
              <div className="h-6 rounded-full overflow-hidden flex bg-gray-800">
                {stats.masteryBreakdown.mastered > 0 && (
                  <div
                    className="bg-green-600 transition-all"
                    style={{
                      width: `${
                        (stats.masteryBreakdown.mastered / problems.length) * 100
                      }%`,
                    }}
                  />
                )}
                {stats.masteryBreakdown.reviewing > 0 && (
                  <div
                    className="bg-amber-600 transition-all"
                    style={{
                      width: `${
                        (stats.masteryBreakdown.reviewing / problems.length) * 100
                      }%`,
                    }}
                  />
                )}
                {stats.masteryBreakdown.learning > 0 && (
                  <div
                    className="bg-blue-600 transition-all"
                    style={{
                      width: `${
                        (stats.masteryBreakdown.learning / problems.length) * 100
                      }%`,
                    }}
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-gray-400">
                    Mastered ({stats.masteryBreakdown.mastered})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-600" />
                  <span className="text-gray-400">
                    Reviewing ({stats.masteryBreakdown.reviewing})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-gray-400">
                    Learning ({stats.masteryBreakdown.learning})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-700" />
                  <span className="text-gray-400">
                    Not Started ({stats.masteryBreakdown.new})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Heatmap */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Last 30 Days</h2>
            {stats.last30Days.every((d) => d.count === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>No reviews in the last 30 days</p>
                <p className="text-sm mt-1">Complete a session to start tracking activity</p>
              </div>
            ) : (
              <>
                <div className="flex gap-1 h-24">
                  {stats.last30Days.map(({ date, count }) => {
                    const maxCount = Math.max(
                      ...stats.last30Days.map((d) => d.count),
                      1
                    );
                    const height = count > 0 ? Math.max(30, (count / maxCount) * 100) : 8;
                    return (
                      <div
                        key={date}
                        className="flex-1 group relative flex flex-col justify-end"
                        title={`${date}: ${count} reviews`}
                      >
                        <div
                          className={`w-full rounded-sm transition-all ${
                            count === 0
                              ? 'bg-gray-800/50'
                              : count <= 2
                              ? 'bg-blue-600'
                              : count <= 5
                              ? 'bg-blue-500'
                              : 'bg-blue-400'
                          }`}
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded whitespace-nowrap border border-gray-700 z-10">
                          {date}: {count} review{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </>
            )}
          </div>

          {/* Pattern Progress */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Pattern Mastery</h2>
            <div className="space-y-3">
              {Object.entries(stats.patternProgress)
                .sort(
                  (a, b) =>
                    b[1].mastered / b[1].total - a[1].mastered / a[1].total
                )
                .map(([pattern, data]) => (
                  <div
                    key={pattern}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-950 border border-gray-800"
                  >
                    <div className="w-36 shrink-0">
                      <PatternTag pattern={pattern} />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-green-500 rounded-full transition-all"
                          style={{
                            width: `${(data.mastered / data.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 w-20 text-right shrink-0">
                      {data.mastered}/{data.total}
                    </div>
                    <div className="text-sm font-mono text-gray-400 w-16 text-right shrink-0">
                      {data.reviews > 0 ? `${(data.avgQuality * 2).toFixed(1)}/10` : '—/10'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
