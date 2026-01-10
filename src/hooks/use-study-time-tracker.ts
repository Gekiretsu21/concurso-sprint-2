'use client';

import { useEffect, useRef } from 'react';
import { updateUserStudyTime } from '@/app/actions/update-user-stats';

const UPDATE_INTERVAL_SECONDS = 60; // 60 seconds

export function useStudyTimeTracker(userId: string | undefined) {
  const accumulatedTimeRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to save accumulated time via Server Action
  const saveTime = () => {
    if (userId && accumulatedTimeRef.current > 0) {
      updateUserStudyTime(userId, accumulatedTimeRef.current);
      accumulatedTimeRef.current = 0; // Reset after saving
    }
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = () => {
    stopTimer(); // Ensure no multiple timers are running
    intervalRef.current = setInterval(() => {
      accumulatedTimeRef.current += 1;
      if (accumulatedTimeRef.current >= UPDATE_INTERVAL_SECONDS) {
        saveTime();
      }
    }, 1000);
  };
  
  // Effect to handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // When tab becomes hidden, save any remaining time and stop the timer
        saveTime();
        stopTimer();
      } else if (userId) {
        // When tab becomes visible again, restart the timer
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also handle when the window is closed or navigated away from
    const handleBeforeUnload = () => {
        saveTime();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final save on cleanup
      saveTime();
      stopTimer();
    };
  }, [userId]); // Rerun only if the user ID changes

  // Effect to manage the timer when the user logs in or out
  useEffect(() => {
    if (userId) {
      startTimer();
    } else {
      // If user logs out, save any remaining time and stop the timer
      saveTime();
      stopTimer();
    }
    
    // Cleanup function for when component unmounts or userId changes
    return () => {
        saveTime();
        stopTimer();
    };
  }, [userId]);
}
