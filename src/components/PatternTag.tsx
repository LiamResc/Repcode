// Pattern difficulty tiers: fundamentals → intermediate → advanced
type Tier = 'fundamental' | 'intermediate' | 'advanced';

const patternTiers: Record<string, Tier> = {
  // Fundamental — core building blocks
  'Hash Map': 'fundamental',
  'Sorting': 'fundamental',
  'Two Pointers': 'fundamental',
  'Binary Search': 'fundamental',
  'Stack': 'fundamental',
  'Sliding Window': 'fundamental',
  'Greedy': 'fundamental',
  'Bucket Sort': 'fundamental',

  // Intermediate — require combining ideas
  'Linked List': 'intermediate',
  'Trees': 'intermediate',
  'BST': 'intermediate',
  'BFS': 'intermediate',
  'DFS': 'intermediate',
  'Heap': 'intermediate',
  'Intervals': 'intermediate',
  'Matrix': 'intermediate',
  'Monotonic Stack': 'intermediate',
  'Bit Manipulation': 'intermediate',

  // Advanced — complex reasoning or multiple techniques
  'Dynamic Programming': 'advanced',
  'Graphs': 'advanced',
  'Topological Sort': 'advanced',
  'Backtracking': 'advanced',
  'Trie': 'advanced',
  'Union Find': 'advanced',
};

const tierColors: Record<Tier, string> = {
  fundamental: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  intermediate: 'bg-amber-950 text-amber-400 border-amber-800',
  advanced: 'bg-red-950 text-red-400 border-red-800',
};

const defaultColor = 'bg-gray-800 text-gray-300 border-gray-700';

interface PatternTagProps {
  pattern: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function PatternTag({ pattern, size = 'sm', onClick }: PatternTagProps) {
  const tier = patternTiers[pattern];
  const colors = tier ? tierColors[tier] : defaultColor;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const interactive = onClick ? 'cursor-pointer hover:opacity-80' : '';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center whitespace-nowrap rounded-full border font-medium ${colors} ${sizeClasses} ${interactive}`}
    >
      {pattern}
    </span>
  );
}
