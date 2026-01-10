'use client';

import { useEffect, useRef, useState } from 'react';
import { updateUserStudyTime } from '@/app/actions/update-user-stats';

const UPDATE_INTERVAL = 60 * 1000; // 60 seconds

export function useStudyTimeTracker(userId: string | undefined) {
  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Function to save accumulated time via Server Action
  const saveTime = (timeToSave: number) => {
    if (userId && timeToSave > 0) {
      // No need to pass firestore instance anymore
      updateUserStudyTime(userId, Math.floor(timeToSave / 1000));
    }
  };

  // Effect to handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isVisibleRef.current = false;
        // When tab becomes hidden, stop the timer and save any remaining time
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          saveTime(time);
          setTime(0);
        }
      } else {
        isVisibleRef.current = true;
        // When tab becomes visible, restart the timer
        if (userId && !intervalRef.current) {
          intervalRef.current = setInterval(() => {
            setTime(prevTime => prevTime + 1000);
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId, time]);

  // Effect to manage the timer and periodic updates
  useEffect(() => {
    if (userId) {
      // Start timer
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          setTime(prevTime => prevTime + 1000);
        }, 1000);
      }

      // Logic to save time periodically
      if (time >= UPDATE_INTERVAL) {
        saveTime(UPDATE_INTERVAL);
        setTime(time => time - UPDATE_INTERVAL); // Reset timer but keep remainder
      }
    } else {
      // If user logs out, stop timer and clear everything
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTime(0);
    }

    // Cleanup on unmount or when userId changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        // Save any remaining time before unmounting
        saveTime(time);
        setTime(0);
      }
    };
  }, [userId, time]);

  // Save any remaining time when the user navigates away
  useEffect(() => {
    return () => {
      if (time > 0) {
        saveTime(time);
      }
    };
  }, [time]);
}
