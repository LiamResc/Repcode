import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerProps {
  minutes: number;
  onTimeUp?: () => void;
  onTick?: (secondsElapsed: number) => void;
}

export function Timer({ minutes, onTimeUp, onTick }: TimerProps) {
  const totalSeconds = minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const pausedRemainingRef = useRef(totalSeconds);
  const timeUpFiredRef = useRef(false);

  const stop = useCallback(() => {
    if (startedAtRef.current !== null) {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      pausedRemainingRef.current = Math.max(0, pausedRemainingRef.current - elapsed);
    }
    startedAtRef.current = null;
    setIsRunning(false);
  }, []);

  // Tick using real clock time
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (startedAtRef.current === null) return;
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const remaining = Math.max(0, pausedRemainingRef.current - elapsed);
      setSecondsLeft(Math.ceil(remaining));

      const totalElapsed = totalSeconds - remaining;
      onTick?.(Math.floor(totalElapsed));

      if (remaining <= 0 && !timeUpFiredRef.current) {
        timeUpFiredRef.current = true;
        setIsRunning(false);
        startedAtRef.current = null;
        pausedRemainingRef.current = 0;
        onTimeUp?.();
      }
    };

    tick();
    const id = setInterval(tick, 250); // check frequently to catch up after tab switch
    return () => clearInterval(id);
  }, [isRunning, totalSeconds, onTick, onTimeUp]);

  const start = () => {
    if (pausedRemainingRef.current <= 0) return;
    startedAtRef.current = Date.now();
    timeUpFiredRef.current = false;
    setIsRunning(true);
  };

  const toggle = () => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  };

  const reset = () => {
    stop();
    pausedRemainingRef.current = totalSeconds;
    startedAtRef.current = null;
    timeUpFiredRef.current = false;
    setSecondsLeft(totalSeconds);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const isWarning = secondsLeft <= 300 && secondsLeft > 60; // last 5 min
  const isDanger = secondsLeft <= 60; // last minute

  return (
    <div className="flex items-center gap-4">
      {/* Progress ring */}
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-800"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className={`transition-all duration-500 ${
              isDanger
                ? 'text-red-500'
                : isWarning
                ? 'text-amber-500'
                : 'text-blue-500'
            }`}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-sm font-mono font-bold ${
              isDanger
                ? 'text-red-400'
                : isWarning
                ? 'text-amber-400'
                : 'text-gray-200'
            }`}
          >
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-1">
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
          title={isRunning ? 'Pause' : 'Start'}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={reset}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
          title="Reset"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
