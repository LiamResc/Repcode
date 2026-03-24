import { useMemo } from 'react';
import {
  BarChart3,
  Target,
  Brain,
  TrendingUp,
  Clock,
  Zap,
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

    // Activity heatmap data (last 365 days, grouped into weeks)
    // Build grid: each column is a week, each row is a day (0=Sun, 6=Sat)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    // Go back to fill 52 full weeks + partial current week
    const totalDays = 52 * 7 + dayOfWeek + 1;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    const heatmapData: { date: string; count: number; day: number; week: number }[] = [];
    let maxDayCount = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = toLocalDateString(d);
      const count = reviewsByDate[dateStr] || 0;
      if (count > maxDayCount) maxDayCount = count;
      heatmapData.push({
        date: dateStr,
        count,
        day: d.getDay(),
        week: Math.floor(i / 7),
      });
    }

    return {
      masteryBreakdown,
      totalReviews,
      totalTime,
      avgQuality: totalQualityCount > 0 ? totalQualitySum / totalQualityCount : 0,
      patternProgress,
      heatmapData,
      maxDayCount,
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
          <div className="card overflow-visible">
            <h2 className="text-lg font-semibold mb-4">Activity</h2>
            <ContributionHeatmap data={stats.heatmapData} maxCount={stats.maxDayCount} />
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat'];

function getHeatmapColor(count: number, maxCount: number): string {
  if (count === 0) return 'bg-gray-800/40';
  if (maxCount <= 0) return 'bg-green-900';
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 'bg-green-900';
  if (ratio <= 0.5) return 'bg-green-700';
  if (ratio <= 0.75) return 'bg-green-500';
  return 'bg-green-400';
}

function ContributionHeatmap({
  data,
  maxCount,
}: {
  data: { date: string; count: number; day: number; week: number }[];
  maxCount: number;
}) {
  // Group by week
  const weeks: { date: string; count: number; day: number }[][] = [];
  for (const cell of data) {
    if (!weeks[cell.week]) weeks[cell.week] = [];
    weeks[cell.week].push(cell);
  }

  // Compute month labels: find the first week where a month starts
  const monthLabels: { label: string; weekIdx: number }[] = [];
  let lastMonth = -1;
  for (const cell of data) {
    const month = new Date(cell.date).getMonth();
    if (month !== lastMonth && cell.day === 0) {
      monthLabels.push({ label: MONTHS[month], weekIdx: cell.week });
      lastMonth = month;
    }
  }

  const totalReviews = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  const totalWeeks = weeks.length;

  return (
    <div className="overflow-visible">
      {/* Month labels */}
      <div
        className="grid mb-1"
        style={{
          marginLeft: '32px',
          gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`,
        }}
      >
        {monthLabels.map(({ label, weekIdx }) => (
          <span
            key={`${label}-${weekIdx}`}
            className="text-xs text-gray-500"
            style={{ gridColumnStart: weekIdx + 1 }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1.5 shrink-0">
          {DAYS.map((day, i) => (
            <span key={i} className="text-xs text-gray-600 h-[11px] leading-[11px] w-6 text-right">
              {day}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div
          className="grid flex-1 gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${totalWeeks}, 1fr)`,
            gridTemplateRows: 'repeat(7, 11px)',
          }}
        >
          {weeks.flatMap((week, wi) =>
            Array.from({ length: 7 }, (_, dayIdx) => {
              const cell = week.find((c) => c.day === dayIdx);
              if (!cell) {
                return (
                  <div
                    key={`${wi}-${dayIdx}`}
                    style={{ gridColumn: wi + 1, gridRow: dayIdx + 1 }}
                  />
                );
              }
              return (
                <div
                  key={`${wi}-${dayIdx}`}
                  className={`rounded-sm ${getHeatmapColor(cell.count, maxCount)} group relative`}
                  style={{ gridColumn: wi + 1, gridRow: dayIdx + 1 }}
                >
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-xs text-gray-300 px-2 py-1 rounded whitespace-nowrap border border-gray-700 z-20 pointer-events-none">
                    {cell.count} review{cell.count !== 1 ? 's' : ''} on {cell.date}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">
          {totalReviews} review{totalReviews !== 1 ? 's' : ''} in the last year
          {activeDays > 0 && ` · ${activeDays} active day${activeDays !== 1 ? 's' : ''}`}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>Less</span>
          <div className="w-[11px] h-[11px] rounded-sm bg-gray-800/40" />
          <div className="w-[11px] h-[11px] rounded-sm bg-green-900" />
          <div className="w-[11px] h-[11px] rounded-sm bg-green-700" />
          <div className="w-[11px] h-[11px] rounded-sm bg-green-500" />
          <div className="w-[11px] h-[11px] rounded-sm bg-green-400" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
