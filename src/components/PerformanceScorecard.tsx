
'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateLevel, calculatePercentage } from '@/lib/gamification';
import { AddQuestionsModal } from './AddQuestionsModal';
import { Trophy, Target, Calendar, TrendingUp, Users, Crown, Shield, Hexagon, Circle, Star, Award } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useEffect, useState } from 'react';
import { getGlobalRankingData } from '@/app/actions/update-user-stats';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const MONTHLY_GOAL = 200;
const WEEKLY_GOAL = 50;

/**
 * Componente de Selo de Evolução que muda visualmente a cada 5 níveis.
 */
function EvolutionBadge({ level }: { level: number }) {
  const tier = Math.floor((level - 1) / 5);
  
  // Nível 1-5: Slate Recruta
  if (tier === 0) {
    return (
      <div className="flex flex-col items-center gap-1 group">
        <div className="relative flex items-center justify-center h-14 w-14 rounded-full bg-slate-100 border-2 border-slate-300 shadow-sm transition-transform group-hover:scale-110">
          <Circle className="h-7 w-7 text-slate-500" />
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Recruta</span>
      </div>
    );
  }
  
  // Nível 6-10: Bronze Guerreiro
  if (tier === 1) {
    return (
      <div className="flex flex-col items-center gap-1 group">
        <div className="relative flex items-center justify-center h-16 w-16 bg-orange-100 border-2 border-orange-400 shadow-md transition-transform group-hover:scale-110" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}>
          <Hexagon className="h-8 w-8 text-orange-600" />
        </div>
        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">Guerreiro</span>
      </div>
    );
  }

  // Nível 11-15: Prata Elite
  if (tier === 2) {
    return (
      <div className="flex flex-col items-center gap-1 group">
        <div className="relative flex items-center justify-center h-18 w-18 bg-blue-50 border-2 border-blue-300 shadow-lg transition-transform group-hover:scale-110" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
          <Shield className="h-9 w-9 text-blue-500" />
        </div>
        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Elite</span>
      </div>
    );
  }

  // Nível 16-20: Ouro Mestre
  if (tier === 3) {
    return (
      <div className="flex flex-col items-center gap-1 group">
        <div className="relative flex items-center justify-center h-20 w-20 bg-amber-50 border-2 border-amber-400 shadow-xl shadow-amber-200/50 transition-transform group-hover:scale-110" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}>
          <Award className="h-10 w-10 text-amber-600" />
        </div>
        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Mestre</span>
      </div>
    );
  }

  // Nível 21+: Platina Lenda
  return (
    <div className="flex flex-col items-center gap-1 group">
      <div className="relative flex items-center justify-center h-24 w-24 rounded-2xl bg-indigo-600 border-2 border-white shadow-2xl shadow-indigo-500/50 animate-pulse-glow transition-transform group-hover:scale-110">
        <Crown className="h-12 w-12 text-white" />
        <Star className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 fill-yellow-400 animate-bounce" />
      </div>
      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">Lenda Viva</span>
    </div>
  );
}

export function PerformanceScorecard() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  // const [rankInfo, setRankInfo] = useState<{ position: number; totalStudents: number } | null>(null);

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, `users/${user.uid}`) : null),
    [user, firestore]
  );

  const { data: userData, isLoading } = useDoc<any>(userDocRef);

  /* 
  useEffect(() => {
    if (user) {
      const totalDone = userData?.stats?.performance?.questions?.totalAnswered || 0;
      getGlobalRankingData(user.uid, totalDone).then(data => {
          setRankInfo({ position: data.position, totalStudents: data.totalStudents });
      });
    }
  }, [userData, user]);
  */

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

            {/* Selo de Evolução Dinâmico: Substitui o ranking temporariamente */}
            <div className="p-2 rounded-xl bg-accent/5 border border-accent/20 flex flex-col items-center justify-center min-h-[80px]">
              <EvolutionBadge level={levelInfo.currentLevel} />
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
