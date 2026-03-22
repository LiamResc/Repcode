import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, BookOpen, BarChart3, Settings as SettingsIcon, History, Brain } from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Session } from './pages/Session';
import { Problems } from './pages/Problems';
import { ProblemDetail } from './pages/ProblemDetail';
import { Progress } from './pages/Progress';
import { SessionHistory } from './pages/SessionHistory';
import { Settings } from './pages/Settings';
import { PatternTrainer } from './pages/PatternTrainer';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Navigation */}
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Dumbbell size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-gray-100">Repcode</span>
            </NavLink>

            <div className="flex items-center gap-1">
              <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
              <NavItem to="/session" icon={<Dumbbell size={18} />} label="Practice" />
              <NavItem to="/patterns" icon={<Brain size={18} />} label="Patterns" />
              <NavItem to="/problems" icon={<BookOpen size={18} />} label="Problems" />
              <NavItem to="/progress" icon={<BarChart3 size={18} />} label="Progress" />
              <NavItem to="/history" icon={<History size={18} />} label="History" />
              <NavItem to="/settings" icon={<SettingsIcon size={18} />} label="Settings" />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 px-6 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/session" element={<Session />} />
            <Route path="/patterns" element={<PatternTrainer />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/history" element={<SessionHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-4 text-center text-sm text-gray-600">
          Repcode — Spaced repetition for LeetCode mastery
        </footer>
      </div>
    </BrowserRouter>
  );
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-gray-800 text-gray-100'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
        }`
      }
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </NavLink>
  );
}

export default App;
