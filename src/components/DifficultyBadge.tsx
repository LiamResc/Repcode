interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  size?: 'sm' | 'md';
}

const colorMap = {
  Easy: 'bg-green-950 text-green-400 border-green-800',
  Medium: 'bg-amber-950 text-amber-400 border-amber-800',
  Hard: 'bg-red-950 text-red-400 border-red-800',
};

export function DifficultyBadge({ difficulty, size = 'sm' }: DifficultyBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colorMap[difficulty]} ${sizeClasses}`}>
      {difficulty}
    </span>
  );
}
