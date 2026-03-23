import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Play,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Dumbbell,
  Swords,
} from 'lucide-react';
import { problems } from '../data/problems';
import { generateSession } from '../engine/session-generator';
import { calculateNextReview } from '../engine/spaced-repetition';
import { getOrCreateProgress, addReviewEntry, saveSessionRecord } from '../engine/storage';
import { SessionProblem, ReviewEntry, SessionConfig, SessionRecord } from '../types';
import { Timer } from '../components/Timer';
import { HintLadder } from '../components/HintLadder';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { PatternTag } from '../components/PatternTag';
import { PatternSpoiler } from '../components/PatternSpoiler';
import { ratingDescriptions, getQualityLabel, getQualityColor } from '../engine/quality';

type SessionPhase = 'config' | 'solving' | 'rating' | 'insight' | 'complexity' | 'summary';

export function Session() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState<SessionPhase>('config');
  const [sessionProblems, setSessionProblems] = useState<SessionProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [solvedCorrectly, setSolvedCorrectly] = useState<boolean | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);
  const [insight, setInsight] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('');
  const [spaceComplexity, setSpaceComplexity] = useState('');
  const [complexityChecked, setComplexityChecked] = useState(false);
  const [results, setResults] = useState<
    { problem: SessionProblem; quality: number; timeSpent: number; hintsUsed: number }[]
  >([]);
  const startTimeRef = useRef(0);
  const quickReviewHandled = useRef(false);
  const [mode, setMode] = useState<'practice' | 'mock-interview'>('practice');
  const [config, setConfig] = useState<SessionConfig>({
    maxProblems: 8,
    timerMinutes: 25,
    includeNew: true,
  });
  const isMockInterview = mode === 'mock-interview';

  // Handle quick review from overdue banner
  useEffect(() => {
    const state = location.state as { quickReview?: boolean; count?: number } | null;
    if (state?.quickReview && !quickReviewHandled.current) {
      quickReviewHandled.current = true;
      const quickConfig: SessionConfig = {
        maxProblems: state.count || 5,
        timerMinutes: 25,
        includeNew: false,
      };
      setConfig(quickConfig);
      const session = generateSession(problems, quickConfig);
      if (session.length > 0) {
        setSessionProblems(session);
        setCurrentIndex(0);
        setPhase('solving');
        startTimeRef.current = Date.now();
        setResults([]);
      }
      // Clear the state so refreshing doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const currentProblem = sessionProblems[currentIndex];

  const startSession = () => {
    const activeConfig = isMockInterview
      ? { maxProblems: 2, timerMinutes: 25, includeNew: true }
      : config;
    const session = generateSession(problems, activeConfig);
    if (session.length === 0) {
      const fallback = generateSession(problems, { ...activeConfig, includeNew: true });
      setSessionProblems(fallback);
    } else {
      setSessionProblems(session);
    }
    setCurrentIndex(0);
    setPhase('solving');
    startTimeRef.current = Date.now();
    setResults([]);
  };

  const handleHintRevealed = useCallback((level: number) => {
    setHintsUsed(level);
  }, []);

  const handleSolved = (correct: boolean) => {
    setSolvedCorrectly(correct);
    setPhase('rating');
  };

  const handleRatingComplete = (quality: number) => {
    setSelectedQuality(quality);
    setPhase('insight');
  };

  const submitReview = () => {
    if (!currentProblem || selectedQuality === null) return;

    const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const quality = selectedQuality;

    const progress = getOrCreateProgress(currentProblem.problem.id);
    const updatedProgress = calculateNextReview(progress, quality);

    const entry: ReviewEntry = {
      date: new Date().toISOString().split('T')[0],
      quality,
      timeSpent,
      hintsUsed,
      insight,
    };

    addReviewEntry(currentProblem.problem.id, entry, updatedProgress);

    const newResults = [
      ...results,
      { problem: currentProblem, quality, timeSpent, hintsUsed },
    ];
    setResults(newResults);

    // Move to next problem or summary
    if (currentIndex + 1 < sessionProblems.length) {
      setCurrentIndex((prev) => prev + 1);
      setPhase('solving');
      setHintsUsed(0);
      setSolvedCorrectly(null);
      setSelectedQuality(null);
      setInsight('');
      setTimeComplexity('');
      setSpaceComplexity('');
      setComplexityChecked(false);
      startTimeRef.current = Date.now();
    } else {
      // Save session record
      const totalTime = newResults.reduce((sum, r) => sum + r.timeSpent, 0);
      const avgQuality = newResults.reduce((sum, r) => sum + r.quality, 0) / newResults.length;
      const record: SessionRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString(),
        mode,
        problems: newResults.map((r) => ({
          problemId: r.problem.problem.id,
          quality: r.quality,
          timeSpent: r.timeSpent,
          hintsUsed: r.hintsUsed,
        })),
        totalTime,
        avgQuality,
      };
      saveSessionRecord(record);
      setPhase('summary');
    }
  };

  // === CONFIG PHASE ===
  if (phase === 'config') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card space-y-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Configure Session</h1>
            <p className="text-gray-400">
              {isMockInterview
                ? 'Simulate a real interview: 2 problems, 25 minutes each, no pattern tags shown.'
                : 'Customize your practice session. Problems are auto-selected based on spaced repetition schedule and pattern interleaving.'}
            </p>
          </div>

          {/* Mode selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setMode('practice')}
              className={`flex-1 p-4 rounded-lg border text-left transition-colors ${
                mode === 'practice'
                  ? 'bg-blue-950/50 border-blue-700 text-blue-300'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell size={18} />
                <span className="font-medium">Practice</span>
              </div>
              <p className="text-xs opacity-70">
                Customizable sessions with spaced repetition
              </p>
            </button>
            <button
              onClick={() => setMode('mock-interview')}
              className={`flex-1 p-4 rounded-lg border text-left transition-colors ${
                mode === 'mock-interview'
                  ? 'bg-purple-950/50 border-purple-700 text-purple-300'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Swords size={18} />
                <span className="font-medium">Mock Interview</span>
              </div>
              <p className="text-xs opacity-70">
                2 problems, 25 min each, no pattern hints
              </p>
            </button>
          </div>

          {!isMockInterview && (
          <div className="space-y-6">
            {/* Problem count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of problems
              </label>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {[1, 2, 4, 6, 8, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() =>
                        setConfig((prev) => ({ ...prev, maxProblems: n }))
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        config.maxProblems === n
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 text-sm">or</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={config.maxProblems}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(50, parseInt(e.target.value) || 1));
                      setConfig((prev) => ({ ...prev, maxProblems: val }));
                    }}
                    className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 text-center focus:outline-none focus:border-gray-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Timer */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timer per problem (minutes)
              </label>
              <div className="flex gap-2">
                {[15, 20, 25, 30, 45].map((m) => (
                  <button
                    key={m}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, timerMinutes: m }))
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      config.timerMinutes === m
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Include new */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Include new problems
                </p>
                <p className="text-sm text-gray-500">
                  Mix in problems you haven't seen before
                </p>
              </div>
              <button
                onClick={() =>
                  setConfig((prev) => ({
                    ...prev,
                    includeNew: !prev.includeNew,
                  }))
                }
                className={`w-12 h-7 rounded-full transition-colors ${
                  config.includeNew ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transform transition-transform mx-1 ${
                    config.includeNew ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
          )}

          <button
            onClick={startSession}
            className={`w-full flex items-center justify-center gap-2 text-lg font-medium px-6 py-3 rounded-lg transition-colors duration-150 ${
              isMockInterview
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {isMockInterview ? <Swords size={20} /> : <Play size={20} />}
            {isMockInterview ? 'Start Mock Interview' : 'Start Session'}
          </button>
        </div>
      </div>
    );
  }

  // === SUMMARY PHASE ===
  if (phase === 'summary') {
    const avgQuality =
      results.reduce((sum, r) => sum + r.quality, 0) / results.length;
    const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);
    const perfectCount = results.filter((r) => r.quality === 5).length;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="card space-y-6">
          <div className="text-center">
            <Trophy size={48} className="mx-auto text-amber-400 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Session Complete!</h1>
            <p className="text-gray-400">
              You reviewed {results.length} problem
              {results.length === 1 ? '' : 's'} in{' '}
              {Math.floor(totalTime / 60)} minutes.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-gray-950 border border-gray-800">
              <p className="text-2xl font-bold text-gray-100">
                {(avgQuality * 2).toFixed(1)}/10
              </p>
              <p className="text-sm text-gray-500">Avg Quality</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-950 border border-gray-800">
              <p className="text-2xl font-bold text-gray-100">{perfectCount}</p>
              <p className="text-sm text-gray-500">Perfect Recalls</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-gray-950 border border-gray-800">
              <p className="text-2xl font-bold text-gray-100">
                {Math.floor(totalTime / 60)}m
              </p>
              <p className="text-sm text-gray-500">Total Time</p>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-2">
            {results.map(({ problem, quality, timeSpent }, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-950 border border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <QualityIcon quality={quality} />
                  <span className="text-gray-200">{problem.problem.title}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{Math.floor(timeSpent / 60)}m</span>
                  <span className={`font-medium ${getQualityColor(quality)}`}>{getQualityLabel(quality)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPhase('config');
                setResults([]);
              }}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              New Session
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn-primary flex-1"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === SOLVING / RATING / INSIGHT PHASES ===
  if (!currentProblem) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-400">No problems available for this session.</p>
        <button
          onClick={() => setPhase('config')}
          className="btn-secondary mt-4"
        >
          Back to Config
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Timer
            key={currentIndex}
            minutes={config.timerMinutes}
            onTimeUp={() => {}}
          />
          <div className="text-sm text-gray-500">
            Problem {currentIndex + 1} of {sessionProblems.length}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {sessionProblems.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i < currentIndex
                  ? results[i]?.quality >= 3
                    ? 'bg-green-500'
                    : 'bg-red-500'
                  : i === currentIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Problem Card */}
      <div className="card space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-gray-500 font-mono">
                #{currentProblem.problem.leetcodeNumber}
              </span>
              <h2 className="text-xl font-bold text-gray-100">
                {currentProblem.problem.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <DifficultyBadge difficulty={currentProblem.problem.difficulty} size="md" />
              {!isMockInterview && (
                <PatternSpoiler patterns={currentProblem.problem.patterns} size="md" />
              )}
              {!isMockInterview && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    currentProblem.reason === 'overdue'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : currentProblem.reason === 'due'
                      ? 'bg-blue-950 text-blue-400 border border-blue-800'
                      : currentProblem.reason === 'weakness'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {currentProblem.reason}
                </span>
              )}
            </div>
          </div>
          <a
            href={currentProblem.problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center gap-2 text-sm shrink-0"
          >
            <ExternalLink size={14} />
            Open on LeetCode
          </a>
        </div>

        {/* Description */}
        <p className="text-gray-300">{currentProblem.problem.description}</p>

        {/* Hint Ladder — hidden in mock interview */}
        {phase === 'solving' && !isMockInterview && (
          <HintLadder
            hints={currentProblem.problem.hints}
            onHintRevealed={handleHintRevealed}
          />
        )}

        {/* Solving Actions */}
        {phase === 'solving' && (
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              onClick={() => handleSolved(true)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              Solved It
            </button>
            <button
              onClick={() => handleSolved(false)}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <XCircle size={18} />
              Couldn't Solve
            </button>
          </div>
        )}

        {/* Rating Phase */}
        {phase === 'rating' && (
          <RatingScale
            solvedCorrectly={solvedCorrectly!}
            onRate={(internalQuality) => handleRatingComplete(internalQuality)}
          />
        )}

        {/* Insight Phase */}
        {phase === 'insight' && (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                What's the key insight? (1-2 sentences)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Writing this helps consolidate your understanding. What's the "aha" moment?
              </p>
              <textarea
                value={insight}
                onChange={(e) => setInsight(e.target.value)}
                placeholder="e.g., Use a hash map to find complements in O(1) — the key is checking before inserting..."
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors resize-none"
                rows={3}
              />
            </div>

            <button
              onClick={() => setPhase('complexity')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <ChevronRight size={18} />
              Next: Complexity Analysis
            </button>
          </div>
        )}

        {/* Complexity Analysis */}
        {phase === 'complexity' && (() => {
          const currentProblem = sessionProblems[currentIndex].problem;
          const timeCorrect = complexityChecked && normalizeComplexity(timeComplexity) === normalizeComplexity(currentProblem.timeComplexity);
          const spaceCorrect = complexityChecked && normalizeComplexity(spaceComplexity) === normalizeComplexity(currentProblem.spaceComplexity);

          return (
          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                What's the time and space complexity?
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Interviewers almost always ask this. Practice articulating it.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Time Complexity</label>
                  <ComplexitySelector
                    value={timeComplexity}
                    onChange={(v) => { setTimeComplexity(v); setComplexityChecked(false); }}
                  />
                  {complexityChecked && (
                    <div className={`flex items-center gap-1.5 mt-1.5 text-sm ${timeCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {timeCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {timeCorrect ? 'Correct!' : `Expected: ${currentProblem.timeComplexity}`}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Space Complexity</label>
                  <ComplexitySelector
                    value={spaceComplexity}
                    onChange={(v) => { setSpaceComplexity(v); setComplexityChecked(false); }}
                  />
                  {complexityChecked && (
                    <div className={`flex items-center gap-1.5 mt-1.5 text-sm ${spaceCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {spaceCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {spaceCorrect ? 'Correct!' : `Expected: ${currentProblem.spaceComplexity}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!complexityChecked ? (
              <button
                onClick={() => setComplexityChecked(true)}
                disabled={!timeComplexity && !spaceComplexity}
                className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check Answer
              </button>
            ) : null}

            <button
              onClick={submitReview}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <ChevronRight size={18} />
              {currentIndex + 1 < sessionProblems.length
                ? 'Next Problem'
                : 'Finish Session'}
            </button>
          </div>
          );
        })()}
      </div>
    </div>
  );
}


function RatingScale({
  solvedCorrectly,
  onRate,
}: {
  solvedCorrectly: boolean;
  onRate: (internalQuality: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const activeScore = hovered ?? selected;
  const activeInfo = activeScore ? ratingDescriptions[activeScore] : null;

  const handleConfirm = () => {
    if (selected === null) return;
    // Convert 1-10 display scale to 0-5 internal SM-2 quality
    const internalQuality = Math.round((selected / 10) * 5);
    onRate(internalQuality);
  };

  return (
    <div className="space-y-4 pt-4 border-t border-gray-800">
      <p className="text-gray-300 font-medium">
        {solvedCorrectly
          ? 'How well did you solve it?'
          : 'How much did you understand?'}
      </p>

      {/* 1-10 buttons */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
          const isSelected = selected === score;
          const isHovered = hovered === score;
          const color =
            score <= 3
              ? isSelected || isHovered
                ? 'bg-red-600 border-red-500 text-white'
                : 'border-red-900 text-red-400 hover:bg-red-950'
              : score <= 5
              ? isSelected || isHovered
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'border-amber-900 text-amber-400 hover:bg-amber-950'
              : score <= 7
              ? isSelected || isHovered
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'border-blue-900 text-blue-400 hover:bg-blue-950'
              : isSelected || isHovered
              ? 'bg-green-600 border-green-500 text-white'
              : 'border-green-900 text-green-400 hover:bg-green-950';

          return (
            <button
              key={score}
              onClick={() => setSelected(score)}
              onMouseEnter={() => setHovered(score)}
              onMouseLeave={() => setHovered(null)}
              className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${color}`}
            >
              {score}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <div className="h-12 flex items-center">
        {activeInfo ? (
          <div>
            <p className="text-sm font-medium text-gray-200">{activeInfo.label}</p>
            <p className="text-xs text-gray-500">{activeInfo.description}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Select a score from 1-10</p>
        )}
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={selected === null}
        className={`w-full flex items-center justify-center gap-2 font-medium px-6 py-3 rounded-lg transition-colors ${
          selected !== null
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}
      >
        <ChevronRight size={18} />
        Confirm Rating
      </button>
    </div>
  );
}

function QualityIcon({ quality }: { quality: number }) {
  if (quality >= 4) return <CheckCircle2 size={18} className="text-green-500" />;
  if (quality >= 3) return <CheckCircle2 size={18} className="text-amber-500" />;
  return <XCircle size={18} className="text-red-500" />;
}

/** Normalize complexity strings for comparison (e.g. "O(n^2)" === "O(n²)") */
function normalizeComplexity(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/[\*x×]/g, '×')
    .replace('2^n', '2ⁿ')
    .replace('^n', 'ⁿ')
    .replace('^t', 'ᵗ')
    .replace('^l', 'ˡ');
}

const commonComplexities = [
  'O(1)',
  'O(log n)',
  'O(n)',
  'O(n log n)',
  'O(n²)',
  'O(n³)',
  'O(2ⁿ)',
  'O(n!)',
];

function ComplexitySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {commonComplexities.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
              value === c
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-950 border-gray-700 text-gray-400 hover:border-gray-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or type custom..."
        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
      />
    </div>
  );
}
