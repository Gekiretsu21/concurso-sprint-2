'use client';

import {
  BrainCircuit,
  ClipboardList,
  FileText,
  Flame,
  Layers,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { doc } from 'firebase/firestore';
import { updateDailyStreak } from '../actions/update-user-stats';

const mainFeatures = [
  {
    title: 'Questões',
    href: '/mentorlite/questions',
    icon: ClipboardList,
    description: 'Pratique com milhares de questões de concurso.',
    cta: 'Começar a praticar',
  },
  {
    title: 'Simulados da Comunidade',
    href: '/mentorlite/community-simulados',
    icon: FileText,
    description: 'Resolva simulados criados por outros usuários.',
    cta: 'Escolher um Simulado',
  },
  {
    title: 'Flashcards',
    href: '/mentorlite/flashcards',
    icon: Layers,
    description: 'Memorize conceitos chave com nosso sistema de flashcards.',
    cta: 'Estudar Flashcards',
  },
  {
    title: 'Provas Anteriores',
    href: '/mentorlite/previous-exams',
    icon: FileText,
    description: 'Resolva provas completas de concursos passados.',
    cta: 'Acessar Provas',
  },
];

interface UserStats {
  totalStudyTime?: number;
  dailyStreak?: number;
  level?: number;
  performance?: {
    questions?: {
        totalAnswered?: number;
        totalCorrect?: number;
    }
  }
}

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-1/2 mb-1" />
                <Skeleton className="h-3 w-1/3" />
            </CardContent>
        </Card>
    );
}

function formatStudyTime(totalSeconds: number = 0) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}


export default function Home() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    const userDocRef = useMemoFirebase(() => 
        (user && firestore) ? doc(firestore, `users/${user.uid}`) : null,
    [user, firestore]);

    const { data: userData, isLoading: isStatsLoading } = useDoc<{stats?: UserStats}>(userDocRef);
    const [dailyStreak, setDailyStreak] = useState(userData?.stats?.dailyStreak ?? 0);

    useEffect(() => {
        if (user && !isUserLoading) {
            updateDailyStreak(user.uid).then(result => {
                setDailyStreak(result.dailyStreak);
            });
        }
    }, [user, isUserLoading]);

    const isLoading = isUserLoading || isStatsLoading;
    
    const getFirstName = (displayName: string | null | undefined) => {
        if (!displayName) return 'Concurseiro';
        return displayName.split(' ')[0];
    };

    const welcomeName = isUserLoading ? 'Concurseiro' : getFirstName(user?.displayName);

    const stats = userData?.stats;
  
    const statCards = [
      {
          title: 'Tempo total de estudo',
          value: formatStudyTime(stats?.totalStudyTime),
          icon: Timer,
          description: "Seu tempo de foco na plataforma."
      },
      {
          title: 'Strike de dias',
          value: `${dailyStreak} dias`,
          icon: Flame,
          color: 'text-amber-500',
          description: "Sua sequência de estudos diários."
      },
    ];


  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Seja bem-vindo, {welcomeName}!
          </h1>
          <p className="text-muted-foreground">O que você gostaria de fazer hoje?</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {isLoading ? (
                <>
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </>
            ) : (
                statCards.map(stat => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon
                        className={`h-4 w-4 text-muted-foreground ${stat.color || ''}`}
                    />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                        {stat.description}
                    </p>
                    </CardContent>
                </Card>
                ))
            )}
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4">
          Principais Ferramentas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mainFeatures.map(feature => (
            <Card key={feature.title} className="flex flex-col">
              <CardHeader>
                <div className="bg-primary/10 p-3 rounded-lg w-fit mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-end">
                <Button asChild className="w-full md:w-auto mt-auto">
                  <Link href={feature.href}>{feature.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
