import { getMasteryLevel } from '../engine/spaced-repetition';
import { ProblemProgress } from '../types';

interface MasteryIndicatorProps {
  progress: ProblemProgress | null;
  size?: 'sm' | 'md';
}

const masteryConfig = {
  new: { label: 'New', color: 'text-gray-500', bg: 'bg-gray-800', ring: 'ring-gray-700' },
  learning: { label: 'Learning', color: 'text-blue-400', bg: 'bg-blue-950', ring: 'ring-blue-800' },
  reviewing: { label: 'Reviewing', color: 'text-amber-400', bg: 'bg-amber-950', ring: 'ring-amber-800' },
  mastered: { label: 'Mastered', color: 'text-green-400', bg: 'bg-green-950', ring: 'ring-green-800' },
};

export function MasteryIndicator({ progress, size = 'sm' }: MasteryIndicatorProps) {
  const level = progress ? getMasteryLevel(progress) : 'new';
  const config = masteryConfig[level];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 font-medium ${config.color} ${config.bg} ${config.ring} ${sizeClasses}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          level === 'new'
            ? 'bg-gray-500'
            : level === 'learning'
            ? 'bg-blue-400'
            : level === 'reviewing'
            ? 'bg-amber-400'
            : 'bg-green-400'
        }`}
      />
      {config.label}
    </span>
  );
}
