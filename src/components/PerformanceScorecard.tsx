'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateLevel, calculatePercentage, getAchievement } from '@/lib/gamification';
import { AddQuestionsModal } from './AddQuestionsModal';
import { Trophy, Target, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { EvolutionBadge } from './EvolutionBadge';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const MONTHLY_GOAL = 200;
const WEEKLY_GOAL = 50;

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
  const weeklyAccuracy = calculatePercentage(stats.weeklyCorrectAnswers, stats.weeklyQuestionsDone);
  const monthlyAccuracy = calculatePercentage(stats.monthlyCorrectAnswers, stats.monthlyQuestionsDone);
  
  const weeklyProgress = Math.min((stats.weeklyQuestionsDone / WEEKLY_GOAL) * 100, 100);
  const monthlyProgress = Math.min((stats.monthlyQuestionsDone / MONTHLY_GOAL) * 100, 100);
  
  const levelInfo = calculateLevel(stats.totalAnswered);
  const achievement = getAchievement(levelInfo.currentLevel);

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
                <div className="relative flex items-center justify-center h-24 w-24 rounded-full border-4 border-accent/10 bg-white shadow-inner cursor-help group transition-transform hover:scale-105">
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

            <div className="p-2 rounded-xl flex flex-col items-center justify-center min-h-[140px]">
              <EvolutionBadge level={levelInfo.currentLevel} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm transition-all duration-500",
                achievement.color
              )}>
                <span className="text-lg">{achievement.icon}</span>
                <span className="text-xs font-black uppercase tracking-tight">{achievement.title}</span>
              </div>
              <span className="text-sm font-black text-slate-900">NÍVEL {levelInfo.currentLevel}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {levelInfo.questionsInCurrentLevel} / {levelInfo.questionsRequiredForNextLevel} para o Nível {levelInfo.currentLevel + 1}
            </span>
          </div>
          <div className="relative h-4 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner border border-white">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent via-amber-500 to-accent transition-all duration-1000 ease-out"
              style={{ width: `${levelInfo.progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_2s_linear_infinite]" />
            </div>
          </div>
        </div>
      </CardContent>
      <style jsx global>{`
        @keyframes progress-stripe {
          from { background-position: 0 0; }
          to { background-position: 20px 0; }
        }
      `}</style>
    </Card>
  );
}
