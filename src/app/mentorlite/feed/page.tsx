'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { FeedPost } from '@/types';
import { FeedCard } from '@/components/FeedCard';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeedPage() {
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();

    const userDocRef = useMemoFirebase(() => 
        (user && firestore) ? doc(firestore, `users/${user.uid}`) : null,
    [user, firestore]);
    
    const { data: userData, isLoading: isProfileLoading } = useDoc<{subscription?: { plan: 'standard' | 'plus' }}>(userDocRef);

    const feedQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        
        let audienceFilter = ['all'];
        if (userData?.subscription?.plan) {
            audienceFilter.push('standard');
            if (userData.subscription.plan === 'plus') {
                audienceFilter.push('plus');
            }
        } else {
             audienceFilter.push('standard'); // Default for users without subscription info yet
        }
        
        return query(
            collection(firestore, 'feed_posts'),
            where('audience', 'in', audienceFilter),
            where('isActive', '==', true)
        );
    }, [firestore, user, userData]);

    const { data: feedPosts, isLoading: isLoadingFeed } = useCollection<FeedPost>(feedQuery);
    
    const sortedFeed = useMemo(() => {
        if (!feedPosts) return [];
        return [...feedPosts].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.createdAt.seconds - a.createdAt.seconds;
        });
    }, [feedPosts]);

    const isLoading = isUserLoading || isProfileLoading || isLoadingFeed;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Feed de Notícias</h1>
        <p className="text-muted-foreground">Fique por dentro das últimas novidades e avisos.</p>
      </header>
      <section className="space-y-6">
        {isLoading ? (
             <div className="flex flex-col max-w-4xl mx-auto w-full space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
             </div>
        ) : sortedFeed && sortedFeed.length > 0 ? (
          <div className="flex flex-col max-w-4xl mx-auto w-full">
            {sortedFeed.map(post => <FeedCard key={post.id} post={post} />)}
          </div>
        ) : (
          <div className="col-span-full flex items-center justify-center p-8 border-dashed border rounded-lg min-h-[40vh]">
            <p className="text-muted-foreground">Nenhuma novidade por aqui ainda.</p>
          </div>
        )}
      </section>
    </div>
  );
}
