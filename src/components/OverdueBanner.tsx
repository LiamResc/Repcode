import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Zap } from 'lucide-react';
import { problems } from '../data/problems';
import { getAllProgress } from '../engine/storage';
import { isDue, isOverdue } from '../engine/spaced-repetition';

export function OverdueBanner() {
  const navigate = useNavigate();
  const allProgress = getAllProgress();

  let overdueCount = 0;
  let dueCount = 0;

  for (const problem of problems) {
    const progress = allProgress[problem.id];
    if (!progress || progress.history.length === 0) continue;
    if (isOverdue(progress)) {
      overdueCount++;
    } else if (isDue(progress)) {
      dueCount++;
    }
  }

  if (overdueCount === 0) return null;

  return (
    <div className="max-w-6xl mx-auto mb-6">
      <div className="bg-amber-950/60 border border-amber-800/60 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-900/50 rounded-lg">
            <AlertTriangle size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-amber-200 font-medium">
              {overdueCount} overdue problem{overdueCount !== 1 ? 's' : ''} need
              {overdueCount === 1 ? 's' : ''} review
            </p>
            <p className="text-amber-400/70 text-sm">
              These are past their scheduled review date — reviewing now prevents forgetting.
              {dueCount > 0 && ` (${dueCount} more due today)`}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            // Navigate to session with just overdue count pre-configured
            navigate('/session', { state: { quickReview: true, count: overdueCount } });
          }}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shrink-0"
        >
          <Zap size={16} />
          Quick Review
        </button>
      </div>
    </div>
  );
}
