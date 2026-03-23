import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  Clock,
  Lightbulb,
  TrendingUp,
  History,
  CheckCircle2,
  XCircle,
  GitBranch,
} from 'lucide-react';
import { problems } from '../data/problems';
import { getProgress, getAllProgress } from '../engine/storage';
import { getMasteryLevel } from '../engine/spaced-repetition';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { PatternTag } from '../components/PatternTag';
import { PatternSpoiler } from '../components/PatternSpoiler';
import { MasteryIndicator } from '../components/MasteryIndicator';
import { formatDistanceToNow, format } from 'date-fns';
import { getQualityLabel, getQualityColor } from '../engine/quality';

export function ProblemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const problem = problems.find((p) => p.id === Number(id));
  if (!problem) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-gray-400">Problem not found.</p>
        <button onClick={() => navigate('/problems')} className="btn-secondary mt-4">
          Back to Problems
        </button>
      </div>
    );
  }

  const allProgress = getAllProgress();
  const progress = allProgress[problem.id] || null;
  const mastery = progress ? getMasteryLevel(progress) : 'new';
  const reviews = progress?.history || [];
  const totalTime = reviews.reduce((sum, r) => sum + r.timeSpent, 0);
  const avgQuality = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.quality, 0) / reviews.length
    : 0;

  // Collect unique insights written by the user
  const userInsights = reviews
    .filter((r) => r.insight && r.insight.trim().length > 0)
    .map((r) => ({ date: r.date, insight: r.insight }));

  // Quality trend (last reviews)
  const qualityTrend = reviews.length >= 2
    ? reviews[reviews.length - 1].quality - reviews[reviews.length - 2].quality
    : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/problems')}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Back to Problems
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-gray-500 font-mono text-lg">
                #{problem.leetcodeNumber}
              </span>
              <h1 className="text-2xl font-bold text-gray-100">
                {problem.title}
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <DifficultyBadge difficulty={problem.difficulty} size="md" />
              <MasteryIndicator progress={progress} size="md" />
              <PatternSpoiler patterns={problem.patterns} size="md" />
            </div>
            <p className="text-gray-300">{problem.description}</p>
          </div>
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2 text-sm shrink-0"
          >
            <ExternalLink size={14} />
            LeetCode
          </a>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat
          icon={<History size={16} />}
          label="Reviews"
          value={reviews.length.toString()}
          color="text-blue-400"
        />
        <MiniStat
          icon={<TrendingUp size={16} />}
          label="Avg Quality"
          value={reviews.length > 0 ? (avgQuality * 2).toFixed(1) + '/10' : '—'}
          color="text-purple-400"
          trend={qualityTrend !== 0 ? qualityTrend * 2 : 0}
        />
        <MiniStat
          icon={<Clock size={16} />}
          label="Total Time"
          value={totalTime > 0 ? `${Math.round(totalTime / 60)}m` : '—'}
          color="text-amber-400"
        />
        <MiniStat
          icon={<Calendar size={16} />}
          label="Next Review"
          value={
            progress && progress.nextReviewDate
              ? isToday(progress.nextReviewDate)
                ? 'Today'
                : formatDistanceToNow(new Date(progress.nextReviewDate), {
                    addSuffix: true,
                  })
              : '—'
          }
          color="text-green-400"
        />
      </div>

      {/* Spaced Repetition State */}
      {progress && reviews.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" />
            Spaced Repetition State
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Interval</p>
              <p className="text-lg font-bold text-gray-200">
                {progress.interval} day{progress.interval !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Mastery Score</p>
              <p className="text-lg font-bold text-gray-200">
                {Math.min(10, ((progress.easeFactor - 1.3) / (2.5 - 1.3)) * 6 + (progress.repetitions > 0 ? Math.min(4, progress.interval / 7) : 0)).toFixed(1)}/10
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Successful Reps</p>
              <p className="text-lg font-bold text-gray-200">
                {progress.repetitions}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Your Notes */}
      {userInsights.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-400" />
            Your Notes
          </h2>
          <div className="space-y-2">
            {userInsights.map((ui, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 rounded-lg bg-gray-950 border border-gray-800"
              >
                <span className="text-xs text-gray-600 shrink-0 mt-0.5">
                  {format(new Date(ui.date), 'MMM d')}
                </span>
                <p className="text-sm text-gray-400">{ui.insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review History */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History size={18} className="text-blue-400" />
          Review History
        </h2>
        {reviews.length > 0 ? (
          <div className="space-y-2">
            {[...reviews].reverse().map((review, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  {review.quality >= 3 ? (
                    <CheckCircle2
                      size={16}
                      className={
                        review.quality >= 4
                          ? 'text-green-500'
                          : 'text-amber-500'
                      }
                    />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <span className="text-gray-300 text-sm">
                    {format(new Date(review.date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span className="text-gray-500">
                    {review.hintsUsed > 0
                      ? `${review.hintsUsed} hint${review.hintsUsed > 1 ? 's' : ''}`
                      : 'No hints'}
                  </span>
                  <span className="text-gray-500">
                    {Math.floor(review.timeSpent / 60)}m {review.timeSpent % 60}s
                  </span>
                  <span className={`font-medium ${getQualityColor(review.quality)}`}>
                    {getQualityLabel(review.quality)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <History size={32} className="mx-auto mb-2 opacity-50" />
            <p>No reviews yet</p>
            <p className="text-sm mt-1">
              This problem will appear in your next session
            </p>
          </div>
        )}
      </div>

      {/* Related Problems */}
      {problem.relatedProblems && problem.relatedProblems.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitBranch size={18} className="text-teal-400" />
            Related Problems
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Problems that use similar patterns — practice these to build transfer learning.
          </p>
          <div className="space-y-2">
            {problem.relatedProblems
              .map((relId) => problems.find((p) => p.id === relId))
              .filter(Boolean)
              .map((rel) => {
                const relProgress = allProgress[rel!.id] || null;
                return (
                  <div
                    key={rel!.id}
                    onClick={() => navigate(`/problems/${rel!.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 font-mono text-sm w-8">
                        #{rel!.leetcodeNumber}
                      </span>
                      <span className="text-gray-200 text-sm">{rel!.title}</span>
                      <DifficultyBadge difficulty={rel!.difficulty} />
                      <MasteryIndicator progress={relProgress} />
                    </div>
                    <div className="flex items-center gap-2">
                      {rel!.patterns.map((p) => (
                        <PatternTag key={p} pattern={p} />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Hint ladder reference */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Hint Ladder</h2>
        <div className="space-y-2">
          {problem.hints.map((hint, i) => (
            <details key={i} className="group">
              <summary className="flex items-center gap-2 p-3 rounded-lg bg-gray-950 border border-gray-800 cursor-pointer hover:border-gray-700 transition-colors">
                <span
                  className={`w-2 h-2 rounded-full ${
                    i === 0
                      ? 'bg-green-500'
                      : i === 1
                      ? 'bg-yellow-500'
                      : i === 2
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-400">
                  Hint {i + 1} —{' '}
                  {['Nudge', 'Direction', 'Outline', 'Full Approach'][i]}
                </span>
              </summary>
              <p className="text-sm text-gray-300 px-4 py-3 ml-4 border-l-2 border-gray-800">
                {hint}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

function MiniStat({
  icon,
  label,
  value,
  color,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  trend?: number;
}) {
  return (
    <div className="card py-4">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xl font-bold text-gray-100">{value}</p>
        {trend !== undefined && trend !== 0 && (
          <span
            className={`text-xs font-medium ${
              trend > 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {trend > 0 ? '+' : ''}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
