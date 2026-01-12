
'use client';

import { useMemo } from 'react';
import { useCollection, useDoc, useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
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

    // This query now only depends on the user being logged in, making it stable.
    const feedQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        
        return query(
            collection(firestore, 'feed_posts'),
            where('isActive', '==', true),
            orderBy('isPinned', 'desc'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: allFeedPosts, isLoading: isLoadingFeed } = useCollection<FeedPost>(feedQuery);

    // We filter the posts on the client side based on the user's plan.
    const filteredFeedPosts = useMemo(() => {
        if (!allFeedPosts || isProfileLoading) return null; // Wait for profile data

        const isPlusUser = userData?.subscription?.plan === 'plus';

        if (isPlusUser) {
            return allFeedPosts; // Plus users see everything
        }
        
        // Standard users see 'all' and 'standard' posts
        return allFeedPosts.filter(post => post.audience === 'all' || post.audience === 'standard');
    }, [allFeedPosts, userData, isProfileLoading]);


    const isLoading = isUserLoading || isLoadingFeed || isProfileLoading;

    return (
        <div className="flex flex-col gap-8">
             <header>
                <h1 className="text-3xl font-bold tracking-tight">Feed de Notícias</h1>
                <p className="text-muted-foreground">Fique por dentro das últimas novidades e avisos.</p>
            </header>
             <section className="space-y-6">
                {isLoading ? (
                    <div className="flex flex-col gap-8">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                    </div>
                ) : filteredFeedPosts && filteredFeedPosts.length > 0 ? (
                    <div className="flex flex-col max-w-4xl mx-auto w-full">
                        {filteredFeedPosts.map(post => <FeedCard key={post.id} post={post} />)}
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
