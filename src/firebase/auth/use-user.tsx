'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useFirebase } from '../provider';

/**
 * A hook that provides the currently authenticated user.
 *
 * This hook listens for changes in the authentication state and provides the
 * current user object. It also provides a boolean `loading` state that is true
 * while the initial authentication state is being determined.
 *
 * @returns An object containing the current user and a loading state.
 */
export function useUser() {
  const { auth } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}