'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateLevel, calculatePercentage } from '@/lib/gamification';
import { AddQuestionsModal } from './AddQuestionsModal';
import { Trophy, Target, Calendar, TrendingUp, Users, Crown } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useEffect, useState } from 'react';
import { getUserGlobalRank } from '@/app/actions/update-user-stats';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MONTHLY_GOAL = 200;
const WEEKLY_GOAL = 50;

export function PerformanceScorecard() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [rankInfo, setRankInfo] = useState<{ position: number; totalStudents: number } | null>(null);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, `users/${user.uid}`) : null),
    [user, firestore]
  );

  const { data: userData, isLoading } = useDoc<any>(userDocRef);

  useEffect(() => {
    if (user) {
      // Busca o ranking global via Server Action (acessível a todos)
      const totalDone = userData?.stats?.performance?.questions?.totalAnswered || 0;
      getUserGlobalRank(totalDone).then(setRankInfo);
    }
  }, [userData, user]);

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const stats = userData?.stats?.performance?.questions || {
    totalAnswered: 0,
    totalCorrect: 0,
    weeklyQuestionsDone: 0,
    weeklyCorrectAnswers: 0,
    monthlyQuestionsDone: 0,
    monthlyCorrectAnswers: 0,
  };

  const overallPercent = calculatePercentage(stats.totalCorrect, stats.totalAnswered);
  const weeklyAccuracy = calculatePercentage(stats.weeklyCorrectAnswers, stats.weeklyQuestionsDone);
  const monthlyAccuracy = calculatePercentage(stats.monthlyCorrectAnswers, stats.monthlyQuestionsDone);
  
  const weeklyProgress = Math.min((stats.weeklyQuestionsDone / WEEKLY_GOAL) * 100, 100);
  const monthlyProgress = Math.min((stats.monthlyQuestionsDone / MONTHLY_GOAL) * 100, 100);
  
  const levelInfo = calculateLevel(stats.totalAnswered);

  return (
    <Card className="border-accent/20 shadow-xl bg-gradient-to-br from-white to-slate-50/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5">
        <Trophy className="h-24 w-24" />
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-950">
          <Trophy className="h-5 w-5 text-accent" /> Placar de Desempenho
        </CardTitle>
        <AddQuestionsModal />
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-accent/10 bg-white shadow-inner cursor-help">
                  <div className="text-center">
                    <span className="text-2xl font-black text-slate-900 leading-none">{overallPercent.toFixed(0)}%</span>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter leading-tight mt-1">Acerto<br/>Histórico</p>
                  </div>
                  <Target className="absolute -top-1 -right-1 h-5 w-5 text-accent bg-white rounded-full p-0.5 border border-accent/20" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">Sua taxa de acerto total, contabilizada desde a sua primeira questão até a última resolvida hoje.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div className="p-3 rounded-xl bg-slate-100/50 border border-slate-200/60 group hover:border-accent/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Semana</span>
              </div>
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-800">{weeklyProgress.toFixed(0)}%</span>
                  <span className="text-[10px] text-slate-400">da meta</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-600">{weeklyAccuracy.toFixed(0)}% acerto</span>
              </div>
              <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">{stats.weeklyQuestionsDone}/{WEEKLY_GOAL} questões</p>
            </div>
            
            <div className="p-3 rounded-xl bg-slate-100/50 border border-slate-200/60 group hover:border-accent/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Mês</span>
              </div>
              <div className="flex items-baseline justify-between mb-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-800">{monthlyProgress.toFixed(0)}%</span>
                  <span className="text-[10px] text-slate-400">da meta</span>
                </div>
                <span className="text-[10px] font-medium text-emerald-600">{monthlyAccuracy.toFixed(0)}% acerto</span>
              </div>
              <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${monthlyProgress}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 mt-1">{stats.monthlyQuestionsDone}/{MONTHLY_GOAL} questões</p>
            </div>

            {/* Ranking Aberto: Visível para todos os níveis de acesso */}
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 group hover:bg-accent/10 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3 w-3 text-accent" />
                <span className="text-[10px] font-bold text-accent uppercase">Sua Posição</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-900">
                  {rankInfo ? `${rankInfo.position}º` : '...'}
                </span>
                <span className="text-[10px] text-slate-500">
                  de {rankInfo?.totalStudents || '...'} alunos
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center bg-accent text-accent-foreground h-6 w-6 rounded-md shadow-lg shadow-accent/20">
                <Crown className="h-3.5 w-3.5" />
              </div>
              <span className="font-black text-slate-900 uppercase text-sm">Nível {levelInfo.currentLevel}</span>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {levelInfo.questionsInCurrentLevel}/{levelInfo.questionsRequiredForNextLevel} questões para o Nível {levelInfo.currentLevel + 1}
            </span>
          </div>
          <div className="relative h-3 w-full bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent via-amber-500 to-accent transition-all duration-1000 ease-out"
              style={{ width: `${levelInfo.progressPercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}