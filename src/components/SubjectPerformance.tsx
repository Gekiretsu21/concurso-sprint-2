'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { BookOpen, PieChart } from 'lucide-react';
import { Progress } from './ui/progress';
import { calculatePercentage } from '@/lib/gamification';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const subjectStats = userData?.stats?.performance?.questions?.bySubject || {};
  const activeSubjects = Object.entries(subjectStats);

  if (activeSubjects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900">Desempenho por Disciplina</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Suas estatísticas por matéria aparecerão aqui assim que você registrar suas primeiras questões.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PieChart className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold text-slate-950">Desempenho por Disciplina</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeSubjects.map(([name, stats]: [string, any]) => {
          const percent = calculatePercentage(stats.correct, stats.answered);
          return (
            <Card key={name} className="hover:border-accent/30 transition-colors">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 truncate pr-2">{name}</h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    percent >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                    percent >= 60 ? 'bg-amber-100 text-amber-700' : 
                    'bg-red-100 text-red-700'
                  }`}>
                    {percent.toFixed(0)}%
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    <span>Precisão</span>
                    <span>{stats.correct}/{stats.answered} questões</span>
                  </div>
                  <Progress value={percent} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
