'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { FeedPost } from '@/types';
import { FeedCard } from '@/components/FeedCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper, Sparkles, Bell } from 'lucide-react';

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
             audienceFilter.push('standard'); 
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
    <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-20">
      <header className="space-y-4 px-2">
        <div className="flex items-center gap-2">
            <div className="bg-slate-950 p-2 rounded-xl shadow-lg border-b-2 border-accent">
                <Bell className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Comunicados Oficiais</span>
        </div>
        <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 italic uppercase">
                Feed de <span className="text-accent">Inteligência</span>
            </h1>
            <p className="text-slate-600 font-medium mt-2">
                Acompanhe atualizações de edital, novos materiais e avisos da mentoria em tempo real.
            </p>
        </div>
      </header>

      <section className="space-y-8 px-2">
        {isLoading ? (
             <div className="flex flex-col w-full space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-12 w-3/4 rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-[2.5rem]" />
                    </div>
                ))}
             </div>
        ) : sortedFeed && sortedFeed.length > 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {sortedFeed.map(post => <FeedCard key={post.id} post={post} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed rounded-[3rem] bg-slate-50/50">
            <Newspaper className="h-16 w-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-400 uppercase tracking-widest">Silêncio no Front</h3>
            <p className="text-slate-400 mt-2 font-medium">Nenhuma novidade por aqui ainda. Fique atento!</p>
          </div>
        )}
      </section>

      <footer className="flex items-center justify-center gap-2 py-10 opacity-30">
          <Sparkles className="h-4 w-4 text-slate-400" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">MentorIA Academy • Conexão Elite</p>
      </footer>
    </div>
  );
}
