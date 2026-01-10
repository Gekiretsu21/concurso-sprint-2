'use client';

import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useFirebase } from '../provider';
import { doc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

/**
 * A hook that provides the currently authenticated user.
 *
 * This hook listens for changes in the authentication state and provides the
 * current user object. It also provides a boolean `loading` state that is true
 * while the initial authentication state is being determined.
 *
 * It also syncs user profile information from the auth provider to Firestore.
 *
 * @returns An object containing the current user and a loading state.
 */
export function useUser() {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);

      // When user logs in, sync their profile info to Firestore.
      if (user && firestore) {
        const userRef = doc(firestore, 'users', user.uid);
        const userData = {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };
        
        // Use setDoc with merge to create/update without overwriting other fields.
        setDoc(userRef, userData, { merge: true }).catch(serverError => {
            const permissionError = new FirestorePermissionError({
              path: userRef.path,
              operation: 'write', 
              requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return { user, isUserLoading: loading, user: user };
}
    