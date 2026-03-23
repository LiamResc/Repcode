// Display labels for quality scores (internal 0-5 scale → display 1-10 scale)

const displayLabels: Record<number, string> = {
  1: 'No clue',
  2: 'Vague idea',
  3: 'Struggled',
  4: 'Needed help',
  5: 'Slow but OK',
  6: 'Decent',
  7: 'Good',
  8: 'Strong',
  9: 'Excellent',
  10: 'Nailed it',
};

export const ratingDescriptions: Record<number, { label: string; description: string }> = {
  1: { label: 'No clue', description: 'Complete blank — no idea where to start' },
  2: { label: 'Vague idea', description: 'Recognized the category but couldn\'t make progress' },
  3: { label: 'Struggled', description: 'Had the right direction but got stuck on implementation' },
  4: { label: 'Needed help', description: 'Solved it but needed significant hints' },
  5: { label: 'Slow but OK', description: 'Got there eventually — took longer than it should' },
  6: { label: 'Decent', description: 'Solved it with some hesitation or minor hints' },
  7: { label: 'Good', description: 'Solid solution with only brief pauses to think' },
  8: { label: 'Strong', description: 'Solved confidently with a clear approach' },
  9: { label: 'Excellent', description: 'Quick and clean — knew the pattern right away' },
  10: { label: 'Nailed it', description: 'Instant recall, optimal solution, could explain it in your sleep' },
};

/** Convert internal quality (0-5) to display label */
export function getQualityLabel(internalQuality: number): string {
  const displayScore = internalQuality * 2;
  return displayLabels[displayScore] || `${displayScore}/10`;
}

/** Get color class for internal quality (0-5) */
export function getQualityColor(internalQuality: number): string {
  if (internalQuality >= 4) return 'text-green-400';
  if (internalQuality >= 3) return 'text-amber-400';
  return 'text-red-400';
}
