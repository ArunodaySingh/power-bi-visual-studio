import { useState, useCallback, useEffect } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
}

export function useUndoHistory<T>(initialState: T, maxHistory = 50) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
  });

  // Set new state and push current to history
  const set = useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const nextState = typeof newState === "function" 
        ? (newState as (prev: T) => T)(prev.present) 
        : newState;
      
      // Don't add to history if state hasn't changed (shallow compare)
      if (JSON.stringify(nextState) === JSON.stringify(prev.present)) {
        return prev;
      }

      return {
        past: [...prev.past.slice(-maxHistory + 1), prev.present],
        present: nextState,
      };
    });
  }, [maxHistory]);

  // Undo: restore previous state
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      
      const newPast = [...prev.past];
      const previousState = newPast.pop()!;
      
      return {
        past: newPast,
        present: previousState,
      };
    });
  }, []);

  // Check if undo is available
  const canUndo = history.past.length > 0;

  // Keyboard shortcut for Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo]);

  // Reset history (used when loading a new dashboard)
  const reset = useCallback((newState: T) => {
    setHistory({
      past: [],
      present: newState,
    });
  }, []);

  return {
    state: history.present,
    set,
    undo,
    canUndo,
    reset,
  };
}
