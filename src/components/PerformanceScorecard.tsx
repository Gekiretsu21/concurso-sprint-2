'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateLevel, calculatePercentage, getAchievement } from '@/lib/gamification';
import { AddQuestionsModal } from './AddQuestionsModal';
import { Trophy, Target, Calendar, TrendingUp, Zap, Star, Info } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { EvolutionBadge } from './EvolutionBadge';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { useState } from 'react';
import { MentoringTipModal } from './MentoringTipModal';

const MONTHLY_GOAL = 200;
const WEEKLY_GOAL = 50;

export function PerformanceScorecard() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);

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
    <div className="relative rounded-[2rem] border-[0.75px] border-border p-1 group">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <Card className="relative z-10 border-accent/20 shadow-2xl bg-gradient-to-br from-white via-white to-slate-50/80 overflow-hidden border-t-4 border-t-accent rounded-[1.8rem]">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <Trophy className="h-40 w-40 -rotate-12" />
        </div>
        
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
          <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-950 uppercase tracking-wider">
            <Trophy className="h-5 w-5 text-accent" /> Status de Elite
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 relative z-10">
          {/* Top Row: Mastery & Goals */}
          <div className="flex flex-col lg:flex-row items-center gap-8">
            
            {/* Accuracy Circle - Re-styled for Maximum Emphasis */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative flex items-center justify-center h-36 w-36 rounded-full border-[8px] border-slate-50 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] cursor-help group transition-all hover:scale-110 active:scale-95">
                    <div className="text-center px-3 z-10">
                      <span className="text-4xl font-black text-slate-950 leading-none drop-shadow-md italic">
                        {overallPercent.toFixed(0)}%
                      </span>
                      <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest leading-tight mt-2 max-w-[80px] mx-auto">
                        Histórico de<br/>acertos totais
                      </p>
                    </div>
                    
                    <div className="absolute -top-3 -right-1 bg-slate-950 text-accent rounded-full p-2 shadow-xl border-2 border-white z-20 group-hover:rotate-12 transition-transform">
                      <Target className="h-4 w-4" />
                    </div>

                    {/* Dynamic Modern Ring */}
                    <svg className="absolute inset-[-8px] h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90 pointer-events-none drop-shadow-lg">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="72"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray="452"
                        strokeDashoffset={452 - (452 * overallPercent) / 100}
                        className={cn(
                          "transition-all duration-1000 ease-out",
                          overallPercent >= 80 ? "text-emerald-500" : overallPercent >= 60 ? "text-accent" : "text-slate-200"
                        )}
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Inner Glow */}
                    <div className={cn(
                        "absolute inset-0 rounded-full opacity-5 transition-opacity duration-500 group-hover:opacity-10",
                        overallPercent >= 80 ? "bg-emerald-500" : "bg-accent"
                    )} />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="max-w-xs text-xs font-bold leading-relaxed">
                    Este é o seu índice de maestria global. Ele reflete sua precisão em cada questão resolvida na plataforma.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Quick Metrics */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-accent/40 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Calendar className="h-4 w-4" /></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta Semanal</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{weeklyAccuracy.toFixed(0)}% precisão</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-slate-900">{stats.weeklyQuestionsDone}</span>
                  <span className="text-sm font-bold text-slate-400">/ {WEEKLY_GOAL}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${weeklyProgress}%` }} />
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-accent/40 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600"><TrendingUp className="h-4 w-4" /></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta Mensal</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{monthlyAccuracy.toFixed(0)}% precisão</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-black text-slate-900">{stats.monthlyQuestionsDone}</span>
                  <span className="text-sm font-bold text-slate-400">/ {MONTHLY_GOAL}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-700" style={{ width: `${monthlyProgress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Level Up Section */}
          <div className="bg-slate-950 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden group/lvlsec">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent/20 via-transparent to-transparent opacity-50" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              
              {/* Rank Shield */}
              <div className="relative group/shield">
                <div className="absolute inset-0 bg-accent rounded-3xl blur-2xl opacity-20 group-hover/lvlsec:opacity-40 transition-opacity" />
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] border-b-8 border-slate-950 shadow-2xl rotate-3 group-hover/shield:rotate-0 transition-transform duration-500">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[9px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-[0.2em] whitespace-nowrap">
                    <Star className="h-2 w-2 fill-current" /> RANK ATUAL
                  </div>
                  <span className="text-5xl sm:text-6xl font-black italic text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                    {levelInfo.currentLevel}
                  </span>
                </div>
              </div>

              {/* Achievement Info */}
              <div className="flex-1 space-y-4 w-full">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-1">
                    <button 
                      onClick={() => setIsTipModalOpen(true)}
                      className={cn(
                        "inline-flex items-center gap-3 px-5 py-2 rounded-2xl border-2 font-black text-sm uppercase tracking-wider shadow-xl transition-all duration-500 hover:scale-105 active:scale-95 relative group/badge cursor-pointer",
                        achievement.color
                      )}
                    >
                      <span className="text-2xl">{achievement.icon}</span>
                      <span className="drop-shadow-sm">{achievement.title}</span>
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 animate-bounce">
                        <Info className="h-2.5 w-2.5 text-slate-400" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-current opacity-0 group-hover/badge:opacity-5 transition-opacity" />
                    </button>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                      <Zap className="h-3 w-3 text-accent fill-current" /> Rumo ao Nível {levelInfo.currentLevel + 1}
                    </p>
                  </div>
                  
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      {levelInfo.questionsInCurrentLevel} / {levelInfo.questionsRequiredForNextLevel} QUESTÕES
                    </span>
                  </div>
                </div>

                {/* Chunky Progress Bar */}
                <div className="relative h-6 w-full bg-white/5 rounded-2xl p-1 border border-white/10 shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-accent via-amber-400 to-accent rounded-xl transition-all duration-1000 ease-out relative group/bar"
                    style={{ width: `${levelInfo.progressPercentage}%` }}
                  >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:30px_30px] animate-[progress-stripe_2s_linear_infinite]" />
                    
                    {/* Percentage Tooltip */}
                    <div className="absolute -top-10 right-0 bg-accent text-accent-foreground text-[10px] font-black px-2 py-1 rounded-md opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {levelInfo.progressPercentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center sm:hidden">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {levelInfo.questionsInCurrentLevel} FEITAS
                   </span>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      FALTAM {levelInfo.questionsRequiredForNextLevel - levelInfo.questionsInCurrentLevel}
                   </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="pt-2 flex justify-center">
             <AddQuestionsModal />
          </div>
        </CardContent>
      </Card>

      {/* Modal de Dica de Mentoria */}
      <MentoringTipModal 
        isOpen={isTipModalOpen} 
        onOpenChange={setIsTipModalOpen} 
        achievement={achievement} 
      />

      <style jsx global>{`
        @keyframes progress-stripe {
          from { background-position: 0 0; }
          to { background-position: 30px 0; }
        }
      `}</style>
    </div>
  );
}
