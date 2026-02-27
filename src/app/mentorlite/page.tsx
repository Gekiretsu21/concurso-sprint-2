'use client';

import {
  BrainCircuit,
  ClipboardList,
  FileText,
  Flame,
  Layers,
  Lock,
  Sparkles,
  Timer,
  Shield,
  Users,
  Trophy,
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
import { PremiumFeature } from '@/components/PremiumFeature';
import { PerformanceScorecard } from '@/components/PerformanceScorecard';
import { SubjectPerformance } from '@/components/SubjectPerformance';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GlowingEffect } from '@/components/ui/glowing-effect';


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
    icon: Users,
    description: 'Resolva simulados criados por outros concurseiros.',
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

    const { data: userData, isLoading: isStatsLoading } = useDoc<{stats?: UserStats, subscription?: { plan: 'standard' | 'plus' }}>(userDocRef);
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

  return (
    <div className="flex flex-col gap-8">
      <section className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Seja bem-vindo, {welcomeName}!
          </h1>
          <p className="text-muted-foreground font-medium">O que você gostaria de fazer hoje?</p>
        </div>

        <div className="flex flex-col gap-6">
          <PerformanceScorecard />
          
          <SubjectPerformance />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {isLoading ? (
                <StatCardSkeleton />
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Strike de dias</CardTitle>
                    <Flame className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{dailyStreak} dias</div>
                    <p className="text-xs text-muted-foreground">
                        Sua sequência de estudos diários.
                    </p>
                    </CardContent>
                </Card>
            )}
            {isLoading ? (
                <StatCardSkeleton />
            ) : (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tempo total de estudo</CardTitle>
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{formatStudyTime(stats?.totalStudyTime)}</div>
                    <p className="text-xs text-muted-foreground">
                        Seu tempo de foco na plataforma.
                    </p>
                    </CardContent>
                </Card>
            )}
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="text-2xl font-bold tracking-tight mb-4 text-slate-950">
          Principais Ferramentas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mainFeatures.map(feature => (
            <div key={feature.title} className="relative rounded-[1.5rem] border-[0.75px] border-border p-1 group">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <Card className="relative z-10 h-full flex flex-col border-none hover:bg-slate-50/50 transition-all shadow-sm overflow-hidden">
                <CardHeader>
                  <div className="bg-primary/5 p-3 rounded-lg w-fit mb-4 group-hover:bg-primary/10 transition-colors">
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
            </div>
          ))}
            <div className="relative rounded-[1.5rem] border-[0.75px] border-border p-1 group">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <Card className="relative z-10 h-full flex flex-col border-none hover:bg-slate-50/50 transition-all shadow-sm overflow-hidden">
                <CardHeader>
                  <div className="bg-accent/5 p-3 rounded-lg w-fit mb-4 group-hover:bg-accent/10 transition-colors">
                    <Sparkles className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl">Gerar Relatório IA</CardTitle>
                  <CardDescription>Obtenha uma análise detalhada do seu desempenho com IA.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-end">
                  <PremiumFeature
                      fallback={
                          <Button className="w-full md:w-auto mt-auto" disabled>
                              <Lock className="mr-2" />
                              Exclusivo para MentorIA+
                          </Button>
                      }
                      >
                      <Button className="w-full md:w-auto mt-auto bg-accent text-accent-foreground hover:bg-accent/90">
                          Gerar Relatório
                      </Button>
                  </PremiumFeature>
                </CardContent>
              </Card>
            </div>
        </div>
      </section>
    </div>
  );
}
