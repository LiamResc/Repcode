import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PatternTag } from './PatternTag';

interface PatternSpoilerProps {
  patterns: string[];
  size?: 'sm' | 'md';
}

export function PatternSpoiler({ patterns, size = 'sm' }: PatternSpoilerProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {revealed ? (
        <>
          {patterns.map((p) => (
            <PatternTag key={p} pattern={p} size={size} />
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRevealed(false);
            }}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            <EyeOff size={12} />
          </button>
        </>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRevealed(true);
          }}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-0.5 rounded-full border border-gray-800 hover:border-gray-700"
        >
          <Eye size={12} />
          <span>Show {patterns.length} pattern{patterns.length !== 1 ? 's' : ''}</span>
        </button>
      )}
    </div>
  );
}
