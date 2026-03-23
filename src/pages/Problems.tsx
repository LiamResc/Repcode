import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { problems } from '../data/problems';
import { getAllProgress } from '../engine/storage';
import { DifficultyBadge } from '../components/DifficultyBadge';
import { PatternTag } from '../components/PatternTag';
import { PatternSpoiler } from '../components/PatternSpoiler';
import { MasteryIndicator } from '../components/MasteryIndicator';
import { getAllPatterns } from '../engine/session-generator';

export function Problems() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [patternFilter, setPatternFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const allProgress = getAllProgress();
  const allPatterns = useMemo(() => getAllPatterns(problems), []);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      // Search
      if (search) {
        const s = search.toLowerCase();
        const matchesTitle = problem.title.toLowerCase().includes(s);
        const matchesNumber = problem.leetcodeNumber.toString().includes(s);
        const matchesPattern = problem.patterns.some((p) =>
          p.toLowerCase().includes(s)
        );
        if (!matchesTitle && !matchesNumber && !matchesPattern) return false;
      }

      // Difficulty filter
      if (difficultyFilter.length > 0) {
        if (!difficultyFilter.includes(problem.difficulty)) return false;
      }

      // Pattern filter
      if (patternFilter.length > 0) {
        if (!problem.patterns.some((p) => patternFilter.includes(p))) return false;
      }

      return true;
    });
  }, [search, difficultyFilter, patternFilter]);

  const toggleDifficulty = (d: string) => {
    setDifficultyFilter((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  const togglePattern = (p: string) => {
    setPatternFilter((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Problem Bank</h1>
        <span className="text-gray-500 text-sm">
          {filteredProblems.length} of {problems.length} problems
        </span>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Search by title, number, or pattern..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${
              showFilters ? 'border-blue-600 text-blue-400' : ''
            }`}
          >
            <Filter size={16} />
            Filters
            {(difficultyFilter.length > 0 || patternFilter.length > 0) && (
              <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {difficultyFilter.length + patternFilter.length}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="card space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Difficulty</p>
              <div className="flex gap-2">
                {['Easy', 'Medium', 'Hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      difficultyFilter.includes(d)
                        ? d === 'Easy'
                          ? 'bg-green-950 border-green-700 text-green-400'
                          : d === 'Medium'
                          ? 'bg-amber-950 border-amber-700 text-amber-400'
                          : 'bg-red-950 border-red-700 text-red-400'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Patterns</p>
              <div className="flex flex-wrap gap-2">
                {allPatterns.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePattern(p)}
                    className={`transition-opacity ${
                      patternFilter.length > 0 && !patternFilter.includes(p)
                        ? 'opacity-40'
                        : ''
                    }`}
                  >
                    <PatternTag pattern={p} />
                  </button>
                ))}
              </div>
            </div>
            {(difficultyFilter.length > 0 || patternFilter.length > 0) && (
              <button
                onClick={() => {
                  setDifficultyFilter([]);
                  setPatternFilter([]);
                }}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Problem List */}
      <div className="space-y-2">
        {filteredProblems.map((problem) => {
          const progress = allProgress[problem.id] || null;
          return (
            <div
              key={problem.id}
              onClick={() => navigate(`/problems/${problem.id}`)}
              className="card p-4 hover:border-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <span className="text-gray-600 font-mono text-sm w-10 shrink-0">
                    #{problem.leetcodeNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-gray-200 font-medium truncate">
                        {problem.title}
                      </span>
                      <DifficultyBadge difficulty={problem.difficulty} />
                      <MasteryIndicator progress={progress} />
                    </div>
                    <PatternSpoiler patterns={problem.patterns} />
                  </div>
                </div>
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
                  title="Open on LeetCode"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
