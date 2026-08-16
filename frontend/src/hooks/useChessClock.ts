import { useState, useEffect, useRef, useCallback } from 'react';
import type { PlayerColor } from '../types/chess';

interface UseChessClockProps {
  initialMinutes: number;
  activeColor: PlayerColor | null;
  isGameOver: boolean;
  onTimeOut?: (loserColor: PlayerColor) => void;
}

export function useChessClock({
  initialMinutes,
  activeColor,
  isGameOver,
  onTimeOut,
}: UseChessClockProps) {
  const initialSeconds = initialMinutes * 60;
  const [whiteTime, setWhiteTime] = useState<number>(initialSeconds);
  const [blackTime, setBlackTime] = useState<number>(initialSeconds);

  const timerRef = useRef<number | null>(null);

  const resetClock = useCallback(
    (minutes?: number) => {
      const secs = (minutes ?? initialMinutes) * 60;
      setWhiteTime(secs);
      setBlackTime(secs);
    },
    [initialMinutes]
  );

  useEffect(() => {
    resetClock(initialMinutes);
  }, [initialMinutes, resetClock]);

  useEffect(() => {
    // Stop clock immediately if game is over or activeColor is null
    if (isGameOver || !activeColor) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      if (activeColor === 'white') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            if (onTimeOut) onTimeOut('white');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            if (onTimeOut) onTimeOut('black');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeColor, isGameOver, onTimeOut]);

  const addIncrement = useCallback((color: PlayerColor, incrementSecs: number) => {
    if (incrementSecs <= 0) return;
    if (color === 'white') {
      setWhiteTime((prev) => prev + incrementSecs);
    } else {
      setBlackTime((prev) => prev + incrementSecs);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    whiteTime,
    blackTime,
    formattedWhiteTime: formatTime(whiteTime),
    formattedBlackTime: formatTime(blackTime),
    resetClock,
    addIncrement,
  };
}

