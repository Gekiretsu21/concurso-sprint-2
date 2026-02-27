'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { BookOpen, PieChart, Target, Zap, Award } from 'lucide-react';
import { Progress } from './ui/progress';
import { calculatePercentage } from '@/lib/gamification';
import { cn } from '@/lib/utils';

export function SubjectPerformance() {
  const { user } = useUser();
  const { firestore } = useFirebase();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, `users/${user.uid}`) : null),
    [user, firestore]
  );

  const { data: userData, isLoading } = useDoc<any>(userDocRef);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[2rem]" />
        ))}
      </div>
    );
  }

  const subjectStats = userData?.stats?.performance?.questions?.bySubject || {};
  const activeSubjects = Object.entries(subjectStats);

  if (activeSubjects.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[2.5rem] overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-white p-6 rounded-full shadow-xl mb-6">
            <BookOpen className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Maestria por Disciplina</h3>
          <p className="text-sm text-slate-500 max-w-xs mt-2 font-medium">
            Seu raio-x de evolução aparecerá aqui assim que você registrar suas primeiras batalhas de hoje.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 p-2 rounded-xl shadow-lg">
            <PieChart className="h-5 w-5 text-accent" />
          </div>
          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter italic">Domínio de Matérias</h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-100 shadow-sm">
          <Zap className="h-3 w-3 text-accent fill-current" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atualizado em tempo real</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeSubjects.map(([name, stats]: [string, any]) => {
          const percent = calculatePercentage(stats.correct, stats.answered);
          
          return (
            <Card 
              key={name} 
              className="group relative border-2 border-slate-100 bg-white rounded-[2rem] shadow-xl hover:shadow-2xl hover:border-accent/30 transition-all duration-500 overflow-hidden"
            >
              {/* Efeito de background sutil */}
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <Award className="h-24 w-24 -rotate-12" />
              </div>

              <CardContent className="p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-black text-base text-slate-900 leading-tight uppercase tracking-tight line-clamp-2">
                      {name}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Precisão Tática
                      </span>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "shrink-0 flex flex-col items-center justify-center h-14 w-14 rounded-2xl border-2 shadow-inner transition-transform group-hover:scale-110",
                    percent >= 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                    percent >= 60 ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                    'bg-red-50 border-red-100 text-red-700'
                  )}>
                    <span className="text-lg font-black leading-none">{percent.toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Progresso na Matéria
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {stats.correct} / <span className="text-slate-400">{stats.answered} questões</span>
                    </span>
                  </div>
                  
                  <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out rounded-full",
                        percent >= 80 ? 'bg-emerald-500' : 
                        percent >= 60 ? 'bg-accent' : 
                        'bg-destructive'
                      )} 
                      style={{ width: `${percent}%` }}
                    >
                      {/* Brilho animado na barra */}
                      <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite] mix-blend-overlay" />
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="h-px flex-1 bg-slate-100" />
                   <span className="px-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Detalhes</span>
                   <div className="h-px flex-1 bg-slate-100" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
