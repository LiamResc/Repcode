const patternColors: Record<string, string> = {
  'Two Pointers': 'bg-sky-950 text-sky-400 border-sky-800',
  'Sliding Window': 'bg-teal-950 text-teal-400 border-teal-800',
  'Binary Search': 'bg-violet-950 text-violet-400 border-violet-800',
  'Stack': 'bg-orange-950 text-orange-400 border-orange-800',
  'Monotonic Stack': 'bg-orange-950 text-orange-400 border-orange-800',
  'Linked List': 'bg-pink-950 text-pink-400 border-pink-800',
  'Hash Map': 'bg-emerald-950 text-emerald-400 border-emerald-800',
  'Trees': 'bg-lime-950 text-lime-400 border-lime-800',
  'DFS': 'bg-cyan-950 text-cyan-400 border-cyan-800',
  'BFS': 'bg-cyan-950 text-cyan-400 border-cyan-800',
  'BST': 'bg-lime-950 text-lime-400 border-lime-800',
  'Graphs': 'bg-indigo-950 text-indigo-400 border-indigo-800',
  'Topological Sort': 'bg-indigo-950 text-indigo-400 border-indigo-800',
  'Dynamic Programming': 'bg-purple-950 text-purple-400 border-purple-800',
  'Greedy': 'bg-yellow-950 text-yellow-400 border-yellow-800',
  'Backtracking': 'bg-rose-950 text-rose-400 border-rose-800',
  'Heap': 'bg-fuchsia-950 text-fuchsia-400 border-fuchsia-800',
  'Trie': 'bg-amber-950 text-amber-400 border-amber-800',
  'Bit Manipulation': 'bg-gray-800 text-gray-300 border-gray-700',
  'Intervals': 'bg-blue-950 text-blue-400 border-blue-800',
  'Sorting': 'bg-stone-800 text-stone-300 border-stone-700',
  'Matrix': 'bg-emerald-950 text-emerald-400 border-emerald-800',
  'Bucket Sort': 'bg-stone-800 text-stone-300 border-stone-700',
  'Union Find': 'bg-indigo-950 text-indigo-400 border-indigo-800',
};

const defaultColor = 'bg-gray-800 text-gray-300 border-gray-700';

interface PatternTagProps {
  pattern: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export function PatternTag({ pattern, size = 'sm', onClick }: PatternTagProps) {
  const colors = patternColors[pattern] || defaultColor;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  const interactive = onClick ? 'cursor-pointer hover:opacity-80' : '';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full border font-medium ${colors} ${sizeClasses} ${interactive}`}
    >
      {pattern}
    </span>
  );
}
