import { useState, useMemo, useCallback } from 'react';
import {
  Brain,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  Shuffle,
  Trophy,
} from 'lucide-react';
import { problems } from '../data/problems';
import { getAllPatterns } from '../engine/session-generator';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { PatternTag } from '../components/PatternTag';
import { Problem } from '../types';

type Phase = 'intro' | 'guess' | 'result' | 'summary';

interface RoundResult {
  problem: Problem;
  guessedPatterns: string[];
  correctPatterns: string[];
  isCorrect: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function PatternTrainer() {
  const allPatterns = useMemo(() => getAllPatterns(problems), []);
  const [phase, setPhase] = useState<Phase>('intro');
  const [queue, setQueue] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [roundCount, setRoundCount] = useState(10);

  const currentProblem = queue[currentIndex];

  const startTraining = () => {
    const shuffled = shuffleArray(problems).slice(0, roundCount);
    setQueue(shuffled);
    setCurrentIndex(0);
    setSelectedPatterns([]);
    setResults([]);
    setPhase('guess');
  };

  const togglePattern = useCallback((pattern: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(pattern)
        ? prev.filter((p) => p !== pattern)
        : [...prev, pattern]
    );
  }, []);

  const submitGuess = () => {
    if (!currentProblem || selectedPatterns.length === 0) return;

    const correctPatterns = currentProblem.patterns;
    // Correct if at least one selected pattern matches
    const isCorrect = selectedPatterns.some((p) =>
      correctPatterns.includes(p)
    );

    setResults((prev) => [
      ...prev,
      {
        problem: currentProblem,
        guessedPatterns: [...selectedPatterns],
        correctPatterns,
        isCorrect,
      },
    ]);
    setPhase('result');
  };

  const nextProblem = () => {
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedPatterns([]);
      setPhase('guess');
    } else {
      setPhase('summary');
    }
  };

  // === INTRO ===
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain size={32} className="text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Pattern Recognition Trainer</h1>
            <p className="text-gray-400 max-w-md mx-auto">
              The hardest part of interviews is identifying which technique to
              use. Read the problem description and guess the pattern — no tags,
              no hints.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of problems
            </label>
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setRoundCount(n)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    roundCount === n
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startTraining}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <Shuffle size={20} />
            Start Training
          </button>
        </div>
      </div>
    );
  }

  // === SUMMARY ===
  if (phase === 'summary') {
    const correctCount = results.filter((r) => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="card space-y-6">
          <div className="text-center">
            <Trophy size={48} className="mx-auto text-amber-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Training Complete</h1>
            <p className="text-gray-400">
              You identified {correctCount} of {results.length} patterns
              correctly.
            </p>
          </div>

          {/* Accuracy */}
          <div className="text-center p-6 rounded-xl bg-gray-950 border border-gray-800">
            <p
              className={`text-5xl font-bold ${
                accuracy >= 80
                  ? 'text-green-400'
                  : accuracy >= 50
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {accuracy}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Pattern Recognition Accuracy</p>
          </div>

          {/* Results */}
          <div className="space-y-2">
            {results.map((result, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  {result.isCorrect ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <span className="text-gray-300 text-sm">
                    {result.problem.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {result.correctPatterns.map((p) => (
                    <PatternTag key={p} pattern={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Missed patterns analysis */}
          {results.some((r) => !r.isCorrect) && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-2">
                Patterns you missed:
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(
                  new Set(
                    results
                      .filter((r) => !r.isCorrect)
                      .flatMap((r) => r.correctPatterns)
                  )
                ).map((p) => (
                  <PatternTag key={p} pattern={p} size="md" />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPhase('intro');
                setResults([]);
              }}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              Train Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === GUESS / RESULT ===
  if (!currentProblem) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Problem {currentIndex + 1} of {queue.length}
        </span>
        <span>
          {results.filter((r) => r.isCorrect).length}/{results.length} correct
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 rounded-full transition-all"
          style={{ width: `${((currentIndex + (phase === 'result' ? 1 : 0)) / queue.length) * 100}%` }}
        />
      </div>

      {/* Problem card */}
      <div className="card space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-gray-500 font-mono">
                #{currentProblem.leetcodeNumber}
              </span>
              <h2 className="text-xl font-bold text-gray-100">
                {currentProblem.title}
              </h2>
              <DifficultyBadge difficulty={currentProblem.difficulty} size="md" />
            </div>
          </div>
          <a
            href={currentProblem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2 text-sm shrink-0"
          >
            <ExternalLink size={14} />
            LeetCode
          </a>
        </div>

        <p className="text-gray-300 text-lg leading-relaxed">
          {currentProblem.description}
        </p>

        {/* Pattern selection */}
        {phase === 'guess' && (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <p className="text-sm font-medium text-gray-300">
              What pattern(s) would you use to solve this?
            </p>
            <div className="flex flex-wrap gap-2">
              {allPatterns.map((pattern) => (
                <button
                  key={pattern}
                  onClick={() => togglePattern(pattern)}
                  className={`transition-all ${
                    selectedPatterns.includes(pattern)
                      ? 'ring-2 ring-purple-500 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <PatternTag pattern={pattern} size="md" />
                </button>
              ))}
            </div>

            <button
              onClick={submitGuess}
              disabled={selectedPatterns.length === 0}
              className={`w-full flex items-center justify-center gap-2 font-medium px-6 py-3 rounded-lg transition-colors ${
                selectedPatterns.length > 0
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              Check Answer
            </button>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            {results[results.length - 1]?.isCorrect ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-950/50 border border-green-800">
                <CheckCircle2 size={24} className="text-green-400 shrink-0" />
                <div>
                  <p className="font-medium text-green-300">Correct!</p>
                  <p className="text-sm text-green-400/70">
                    You identified the right pattern.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-950/50 border border-red-800">
                <XCircle size={24} className="text-red-400 shrink-0" />
                <div>
                  <p className="font-medium text-red-300">Not quite</p>
                  <p className="text-sm text-red-400/70">
                    The pattern recognition will come with practice.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Your guess</p>
                <div className="flex flex-wrap gap-1.5">
                  {results[results.length - 1]?.guessedPatterns.map((p) => (
                    <PatternTag key={p} pattern={p} />
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-950 border border-gray-800">
                <p className="text-xs text-gray-500 mb-2">Actual pattern</p>
                <div className="flex flex-wrap gap-1.5">
                  {currentProblem.patterns.map((p) => (
                    <PatternTag key={p} pattern={p} />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={nextProblem}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ChevronRight size={18} />
              {currentIndex + 1 < queue.length ? 'Next Problem' : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
