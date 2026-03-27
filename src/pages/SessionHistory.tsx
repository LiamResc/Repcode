import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Swords,
  Dumbbell,
} from 'lucide-react';
import { getSessionHistory } from '../engine/storage';
import { problems } from '../data/problems';
import { format, formatDistanceToNow } from 'date-fns';
import { getQualityLabel, getQualityColor } from '../engine/quality';

export function SessionHistory() {
  const navigate = useNavigate();
  const sessions = useMemo(() => {
    return getSessionHistory().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  if (sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Session History</h1>
        <div className="card text-center py-16">
          <History size={48} className="mx-auto text-gray-700 mb-4" />
          <p className="text-gray-400 text-lg">No sessions yet</p>
          <p className="text-gray-600 mt-2">
            Complete a practice session to see it here.
          </p>
        </div>
      </div>
    );
  }

  // Aggregate stats
  const totalSessions = sessions.length;
  const totalProblemsReviewed = sessions.reduce(
    (sum, s) => sum + s.problems.length,
    0
  );
  const totalTime = sessions.reduce((sum, s) => sum + s.totalTime, 0);
  const overallAvgQuality = totalProblemsReviewed > 0
    ? sessions.reduce((sum, s) => sum + s.avgQuality * s.problems.length, 0) / totalProblemsReviewed
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Session History</h1>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-100">{totalSessions}</p>
          <p className="text-sm text-gray-500">Sessions</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-100">
            {totalProblemsReviewed}
          </p>
          <p className="text-sm text-gray-500">Problems Reviewed</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-100">
            {Math.round(totalTime / 60)}m
          </p>
          <p className="text-sm text-gray-500">Total Time</p>
        </div>
        <div className="card text-center py-4">
          <p className="text-2xl font-bold text-gray-100">
            {(overallAvgQuality * 2).toFixed(1)}/10
          </p>
          <p className="text-sm text-gray-500">Avg Quality</p>
        </div>
      </div>

      {/* Session list */}
      <div className="space-y-4">
        {sessions.map((session) => {
          const sessionDate = new Date(session.date);
          const perfectCount = session.problems.filter(
            (p) => p.quality >= 4
          ).length;
          const failedCount = session.problems.filter(
            (p) => p.quality < 3
          ).length;

          return (
            <div key={session.id} className="card">
              {/* Session header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {session.mode === 'mock-interview' ? (
                    <div className="p-2 bg-purple-950 rounded-lg">
                      <Swords size={18} className="text-purple-400" />
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-950 rounded-lg">
                      <Dumbbell size={18} className="text-blue-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-200">
                      {session.mode === 'mock-interview'
                        ? 'Mock Interview'
                        : 'Practice Session'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {format(sessionDate, 'MMM d, yyyy · h:mm a')} ·{' '}
                      {formatDistanceToNow(sessionDate, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock size={14} />
                    {Math.floor(session.totalTime / 60)}m
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <TrendingUp size={14} />
                    {(session.avgQuality * 2).toFixed(1)}/10
                  </div>
                </div>
              </div>

              {/* Problem results */}
              <div className="space-y-1.5">
                {session.problems.map((sp, i) => {
                  const prob = problems.find((p) => p.id === sp.problemId);
                  if (!prob) return null;
                  return (
                    <div
                      key={i}
                      onClick={() => navigate(`/problems/${prob.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-950 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        {sp.quality >= 4 ? (
                          <CheckCircle2 size={15} className="text-green-500" />
                        ) : sp.quality >= 3 ? (
                          <CheckCircle2 size={15} className="text-amber-500" />
                        ) : (
                          <XCircle size={15} className="text-red-500" />
                        )}
                        <span className="text-gray-500 font-mono text-xs w-7">
                          #{prob.leetcodeNumber}
                        </span>
                        <span className="text-gray-300 text-sm">
                          {prob.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {sp.hintsUsed > 0 && (
                          <span>
                            {sp.hintsUsed} hint{sp.hintsUsed > 1 ? 's' : ''}
                          </span>
                        )}
                        <span>{Math.floor(sp.timeSpent / 60)}m</span>
                        <span className={`font-medium ${getQualityColor(sp.quality)}`}>
                          {getQualityLabel(sp.quality)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Session summary bar */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800 text-sm text-gray-500">
                <span>{session.problems.length} problems</span>
                {perfectCount > 0 && (
                  <span className="text-green-400">
                    {perfectCount} perfect
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="text-red-400">{failedCount} failed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
