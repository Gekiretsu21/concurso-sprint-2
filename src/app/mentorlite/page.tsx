
'use client';

import {
  BarChart2,
  BrainCircuit,
  ClipboardList,
  FileText,
  Flame,
  Gauge,
  Layers,
  Loader2,
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
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import { getUserAnalytics } from '../actions/get-user-analytics';
import { Skeleton } from '@/components/ui/skeleton';

const mainFeatures = [
  {
    title: 'Questões',
    href: '/mentorlite/questions',
    icon: ClipboardList,
    description: 'Pratique com milhares de questões de concurso.',
    cta: 'Começar a praticar',
  },
  {
    title: 'Simulados',
    href: '/mentorlite/simulated-exams',
    icon: FileText,
    description: 'Crie e realize simulados personalizados.',
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
    title: 'Plano de Estudo IA',
    href: '/mentorlite/study-plan',
    icon: BrainCircuit,
    description: 'Receba um plano de estudo personalizado pela nossa IA.',
    cta: 'Gerar Plano',
  },
];

interface DashboardStats {
  totalStudyTime: string;
  overallAccuracy: number;
  dailyStreak: number;
  level: number;
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

export default function Home() {
    const { user, isUserLoading } = useUser();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isUserLoading) return;
        if (!user) {
            setIsLoading(false);
            // Set default stats for logged-out users
             setStats({
                totalStudyTime: '0h 0m',
                overallAccuracy: 0,
                dailyStreak: 0,
                level: 1,
            });
            return;
        }

        async function fetchStats() {
            try {
                const analytics = await getUserAnalytics(user!.uid);
                setStats({
                    totalStudyTime: analytics.totalStudyTime,
                    overallAccuracy: analytics.overallAccuracy,
                    dailyStreak: analytics.dailyStreak,
                    level: analytics.level,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
                // Optionally set error state to show in UI
            } finally {
                setIsLoading(false);
            }
        }
        
        fetchStats();

    }, [user, isUserLoading]);
    
    const getFirstName = (displayName: string | null | undefined) => {
        if (!displayName) return 'Concurseiro';
        return displayName.split(' ')[0];
    };

    const welcomeName = isUserLoading ? 'Concurseiro' : getFirstName(user?.displayName);


  const statCards = [
    {
        title: 'Tempo total de estudo',
        value: stats?.totalStudyTime,
        icon: Timer,
        description: "Atualizado em tempo real"
    },
    {
        title: 'Estatísticas Gerais',
        value: stats ? `${stats.overallAccuracy.toFixed(1)}% Acerto` : '0% Acerto',
        icon: BarChart2,
        href: '/mentorlite/analytics',
        description: ""
    },
    {
        title: 'Strike de dias',
        value: `${stats?.dailyStreak || 0} dias`,
        icon: Flame,
        color: 'text-amber-500',
        description: "Mantenha a chama acesa!"
    },
    {
        title: 'Nível',
        value: `Nível ${stats?.level || 1}`,
        icon: Gauge,
        description: "Continue estudando para subir"
    },
  ];


  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Seja bem-vindo, {welcomeName}!
        </h1>
        <p className="text-muted-foreground">O que você gostaria de fazer hoje?</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
            <>
                <StatCardSkeleton />
                <StatCardSkeleton />
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
                    {stat.href ? (
                        <Link href={stat.href} className="hover:underline">
                            {stat.description}
                        </Link>
                    ) : (
                       stat.description
                    )}
                </p>
                </CardContent>
            </Card>
            ))
        )}
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
