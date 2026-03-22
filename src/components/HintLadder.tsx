import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronRight, Eye } from 'lucide-react';

interface HintLadderProps {
  hints: [string, string, string, string];
  onHintRevealed?: (hintLevel: number) => void;
}

const hintLabels = [
  'Nudge — What to think about',
  'Direction — The approach',
  'Outline — Pseudocode',
  'Solution — Full approach',
];

const hintColors = [
  'border-green-800 bg-green-950/50',
  'border-yellow-800 bg-yellow-950/50',
  'border-orange-800 bg-orange-950/50',
  'border-red-800 bg-red-950/50',
];

const hintDotColors = [
  'bg-green-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
];

export function HintLadder({ hints, onHintRevealed }: HintLadderProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const revealNext = () => {
    if (revealedCount < 4) {
      const newCount = revealedCount + 1;
      setRevealedCount(newCount);
      setIsExpanded(true);
      onHintRevealed?.(newCount);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Lightbulb size={16} />
          <span className="text-sm font-medium">
            Hints {revealedCount > 0 ? `(${revealedCount}/4 revealed)` : ''}
          </span>
        </button>

        {revealedCount < 4 && (
          <button
            onClick={revealNext}
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Eye size={14} />
            Reveal hint {revealedCount + 1}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-2 pl-2">
          {hints.map((hint, i) => (
            <div
              key={i}
              className={`border rounded-lg p-3 transition-all duration-300 ${
                i < revealedCount
                  ? hintColors[i]
                  : 'border-gray-800 bg-gray-900/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    i < revealedCount ? hintDotColors[i] : 'bg-gray-700'
                  }`}
                />
                <span className="text-xs font-medium text-gray-500">
                  {hintLabels[i]}
                </span>
              </div>
              {i < revealedCount ? (
                <p className="text-sm text-gray-300 pl-4">{hint}</p>
              ) : (
                <p className="text-sm text-gray-700 pl-4 italic">
                  Click "Reveal hint {i + 1}" to see this hint
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
