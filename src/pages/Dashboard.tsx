import { useNavigate } from 'react-router-dom';
import {
  Play,
  Target,
  Flame,
  Brain,
  AlertTriangle,
  Calendar,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { problems } from '../data/problems';
import { getAllProgress, getStats } from '../engine/storage';
import { getDueCount, getWeakPatterns } from '../engine/session-generator';
import { isDue, getMasteryLevel } from '../engine/spaced-repetition';
import { OverdueBanner } from '../components/OverdueBanner';
import { PatternTag } from '../components/PatternTag';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { formatDistanceToNow } from 'date-fns';

export function Dashboard() {
  const navigate = useNavigate();
  const allProgress = getAllProgress();
  const stats = getStats();
  const dueCount = getDueCount(problems);
  const weakPatterns = getWeakPatterns(problems);

  // Compute stats
  const startedCount = Object.keys(allProgress).length;
  const masteredCount = Object.values(allProgress).filter(
    (p) => getMasteryLevel(p) === 'mastered'
  ).length;
  const learningCount = Object.values(allProgress).filter(
    (p) => getMasteryLevel(p) === 'learning'
  ).length;

  // Get upcoming reviews
  const upcomingReviews = problems
    .map((problem) => ({
      problem,
      progress: allProgress[problem.id],
    }))
    .filter(({ progress }) => progress && isDue(progress))
    .sort((a, b) => {
      return a.progress!.nextReviewDate.localeCompare(b.progress!.nextReviewDate);
    })
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto">
      <OverdueBanner />
      <div className="space-y-8">
      {/* Hero */}
      <div className="card bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              {dueCount > 0
                ? `${dueCount} problem${dueCount === 1 ? '' : 's'} due for review`
                : startedCount === 0
                ? 'Ready to start practicing?'
                : 'All caught up!'}
            </h1>
            <p className="text-gray-400">
              {dueCount > 0
                ? 'Start a session to review them with spaced repetition.'
                : startedCount === 0
                ? 'Begin your first session to build your review queue.'
                : 'Great work! Start a session with new problems to keep growing.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/session')}
            className="btn-primary flex items-center gap-2 text-lg px-8 py-4 shrink-0"
          >
            <Play size={20} />
            Start Session
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Target size={20} />}
          label="Problems Started"
          value={startedCount}
          subtitle={`of ${problems.length}`}
          color="text-blue-400"
        />
        <StatCard
          icon={<Brain size={20} />}
          label="Mastered"
          value={masteredCount}
          subtitle={learningCount > 0 ? `${learningCount} learning` : ''}
          color="text-green-400"
        />
        <StatCard
          icon={<Flame size={20} />}
          label="Day Streak"
          value={stats.currentStreak}
          subtitle={stats.longestStreak > 0 ? `best: ${stats.longestStreak}` : ''}
          color="text-orange-400"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Total Reviews"
          value={stats.totalReviews}
          subtitle={
            stats.lastPracticeDate
              ? `last: ${formatDistanceToNow(new Date(stats.lastPracticeDate), { addSuffix: true })}`
              : ''
          }
          color="text-purple-400"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Due for Review */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-blue-400" />
            <h2 className="text-lg font-semibold">Due for Review</h2>
          </div>
          {upcomingReviews.length > 0 ? (
            <div className="space-y-3">
              {upcomingReviews.map(({ problem, progress }) => (
                <div
                  key={problem.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-gray-500 text-sm font-mono w-8">
                      #{problem.leetcodeNumber}
                    </span>
                    <span className="text-gray-200 truncate">{problem.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                </div>
              ))}
              {dueCount > 5 && (
                <p className="text-sm text-gray-500 text-center pt-1">
                  +{dueCount - 5} more due
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
              <p>No reviews due right now</p>
              <p className="text-sm mt-1">Start a session with new problems</p>
            </div>
          )}
        </div>

        {/* Weak Patterns */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-400" />
            <h2 className="text-lg font-semibold">Patterns to Improve</h2>
          </div>
          {weakPatterns.length > 0 ? (
            <div className="space-y-3">
              {weakPatterns.slice(0, 5).map(({ pattern, avgQuality, count }) => (
                <div
                  key={pattern}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <PatternTag pattern={pattern} />
                    <span className="text-gray-500 text-sm">{count} problems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          avgQuality < 2
                            ? 'bg-red-500'
                            : avgQuality < 3.5
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${(avgQuality / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 font-mono w-8">
                      {avgQuality.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Brain size={32} className="mx-auto mb-2 opacity-50" />
              <p>No data yet</p>
              <p className="text-sm mt-1">Complete some reviews to see patterns</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtitle: string;
  color: string;
}) {
  return (
    <div className="card">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-sm font-medium text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-100">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
