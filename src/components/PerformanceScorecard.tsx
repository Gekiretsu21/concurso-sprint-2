'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { calculateLevel, calculatePercentage } from '@/lib/gamification';
import { AddQuestionsModal } from './AddQuestionsModal';
import { Trophy, Target, Calendar, TrendingUp, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

export function PerformanceScorecard() {
  const { user } = useUser();
  const { firestore } = useFirebase();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, `users/${user.uid}`) : null),
    [user, firestore]
  );

  const { data: userData, isLoading } = useDoc<any>(userDocRef);

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
  const weeklyPercent = calculatePercentage(stats.weeklyCorrectAnswers, stats.weeklyQuestionsDone);
  const monthlyPercent = calculatePercentage(stats.monthlyCorrectAnswers, stats.monthlyQuestionsDone);
  
  const levelInfo = calculateLevel(stats.totalAnswered);

  return (
    <Card className="border-accent/20 shadow-xl bg-gradient-to-br from-white to-slate-50/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-accent" /> Placar de Desempenho
        </CardTitle>
        <AddQuestionsModal />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Destaque Central: % Geral */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-accent/10 bg-white shadow-inner">
            <div className="text-center">
              <span className="text-2xl font-black text-slate-900 leading-none">{overallPercent.toFixed(0)}%</span>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Geral</p>
            </div>
            <Target className="absolute -top-1 -right-1 h-5 w-5 text-accent bg-white rounded-full p-0.5 border border-accent/20" />
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="p-3 rounded-xl bg-slate-100/50 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Semana</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-800">{weeklyPercent.toFixed(0)}%</span>
                <span className="text-[10px] text-slate-400">({stats.weeklyQuestionsDone} q)</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-100/50 border border-slate-200/60">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Mês</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-800">{monthlyPercent.toFixed(0)}%</span>
                <span className="text-[10px] text-slate-400">({stats.monthlyQuestionsDone} q)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gamificação: Barra de Nível */}
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
