
'use client';

import { useMemo } from 'react';
import { useCollection, useDoc, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { FeedPost } from '@/types';
import { FeedCard } from '@/components/FeedCard';
import { Card } from '@/components/ui/card';

export default function FeedPage() {
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    
    const userDocRef = useMemoFirebase(() => 
        (user && firestore) ? doc(firestore, `users/${user.uid}`) : null,
    [user, firestore]);
    
    const { data: userData, isLoading: isProfileLoading } = useDoc<{subscription?: { plan: 'standard' | 'plus' }}>(userDocRef);

    const isPlusUser = userData?.subscription?.plan === 'plus';

    const feedQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        
        const audienceFilter = isPlusUser 
            ? where('audience', 'in', ['all', 'standard', 'plus'])
            : where('audience', 'in', ['all', 'standard']);

        return query(
            collection(firestore, 'feed_posts'),
            where('isActive', '==', true),
            audienceFilter,
            orderBy('isPinned', 'desc'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, isPlusUser]);

    const { data: feedPosts, isLoading: isLoadingFeed } = useCollection<FeedPost>(feedQuery);

    const isLoading = isUserLoading || isProfileLoading || isLoadingFeed;

    return (
        <div className="flex flex-col gap-8">
             <header>
                <h1 className="text-3xl font-bold tracking-tight">Feed de Notícias</h1>
                <p className="text-muted-foreground">Fique por dentro das últimas novidades e avisos.</p>
            </header>
             <section className="space-y-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                    </div>
                ) : feedPosts && feedPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {feedPosts.map(post => <FeedCard key={post.id} post={post} />)}
                    </div>
                ) : (
                    <Card className="col-span-full flex items-center justify-center p-8 border-dashed min-h-[40vh]">
                        <p className="text-muted-foreground">Nenhuma novidade por aqui ainda.</p>
                    </Card>
                )}
            </section>
        </div>
    );
}
