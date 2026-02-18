'use client';

import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, DocumentData } from 'firebase/firestore';
import React, { ReactNode, useEffect, useState } from 'react';
import { useFirebase } from '@/firebase/provider';

interface Subscription {
  plan: 'standard' | 'plus' | 'mentoria_plus_plus';
  status: 'active' | 'inactive' | 'canceled';
}

interface UserProfile {
    id: string;
    subscription?: Subscription;
}

interface PremiumFeatureProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function PremiumFeature({ children, fallback = null }: PremiumFeatureProps) {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const { firestore } = useFirebase();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const userDocRef = useMemoFirebase(
    () => (firestore && authUser) ? doc(firestore, `users/${authUser.uid}`) : null,
    [firestore, authUser]
  );
  
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const isLoading = isAuthLoading || isProfileLoading;
  
  if (!isClient || isLoading) {
    return null; 
  }
  
  // MentorIA++ also counts as premium for all "Plus" features
  const isPremium = authUser && 
    (userProfile?.subscription?.plan === 'plus' || userProfile?.subscription?.plan === 'mentoria_plus_plus') && 
    userProfile?.subscription?.status === 'active';

  return isPremium ? <>{children}</> : <>{fallback}</>;
}
