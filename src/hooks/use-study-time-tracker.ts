'use client';

import { useEffect, useRef, useState } from 'react';
import { updateStudyTime } from '@/firebase/actions';
import { Firestore } from 'firebase/firestore';

const UPDATE_INTERVAL = 60 * 1000; // 60 seconds

export function useStudyTimeTracker(userId: string | undefined, firestore: Firestore | null) {
  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Function to save accumulated time
  const saveTime = (timeToSave: number) => {
    if (userId && firestore && timeToSave > 0) {
      updateStudyTime(firestore, userId, Math.floor(timeToSave / 1000));
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
  }, [userId, time]); // Rerun if userId or time changes to save correctly

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
      saveTime(time);
    };
  }, [time]); // Depends on the final value of time
}
