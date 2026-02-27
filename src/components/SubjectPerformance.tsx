'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { BookOpen, PieChart, Target, Zap, Award, History, Calendar as CalendarIcon, Activity, ChevronRight } from 'lucide-react';
import { Progress } from './ui/progress';
import { calculatePercentage } from '@/lib/gamification';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMemo } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

interface Attempt {
    id: string;
    isCorrect: boolean;
    timestamp: Timestamp;
    subject: string;
    isBatch?: boolean;
    batchTotal?: number;
    batchCorrect?: number;
}

function SubjectDetailsModal({ subjectName, stats }: { subjectName: string, stats: any }) {
    const { user } = useUser();
    const { firestore } = useFirebase();
    
    // Lista de variações de nomes de matérias para garantir que a busca encontre registros com ou sem acento
    const subjectVariations = useMemo(() => {
        if (!subjectName) return [];
        const base = subjectName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (base === 'lingua portuguesa') return ['Língua Portuguesa', 'Lingua Portuguesa'];
        if (base === 'legislacao juridica') return ['Legislação Jurídica', 'Legislacao Juridica'];
        if (base === 'legislacao institucional') return ['Legislação Institucional', 'Legislacao Institucional'];
        if (base === 'raciocinio logico') return ['Raciocínio Lógico', 'Raciocinio Logico'];
        if (base === 'direito constitucional') return ['Direito Constitucional', 'Direito Constitucional'];
        if (base === 'direito administrativo') return ['Direito Administrativo', 'Direito Administrativo'];
        
        return [subjectName];
    }, [subjectName]);

    // Busca todas as tentativas (individuais ou em lote) desta matéria específica usando as variações
    const attemptsQuery = useMemoFirebase(() => {
        if (!firestore || !user || subjectVariations.length === 0) return null;
        return query(
            collection(firestore, `users/${user.uid}/question_attempts`),
            where('subject', 'in', subjectVariations),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, user, subjectVariations]);

    const { data: attempts, isLoading } = useCollection<Attempt>(attemptsQuery);

    // Mapeia os dias em que houve qualquer tipo de atividade registrada
    const activeDays = useMemo(() => {
        if (!attempts) return new Set<string>();
        const days = new Set<string>();
        attempts.forEach(a => {
            if (a.timestamp && typeof a.timestamp.toDate === 'function') {
                days.add(format(a.timestamp.toDate(), 'yyyy-MM-dd'));
            }
        });
        return days;
    }, [attempts]);

    // Modificadores para o Contorno VIP no calendário
    const modifiers = {
        active: (date: Date) => activeDays.has(format(date, 'yyyy-MM-dd')),
    };

    // Estilo "Contorno VIP" - Dourado, Brilhante e com Sombra. 
    // CRITICAL: before e after PRECISAM de content-[''] para renderizar no Tailwind.
    const modifiersClassNames = {
        active: "relative z-20 before:content-[''] before:absolute before:inset-0 before:bg-accent/10 before:rounded-full before:z-0 after:content-[''] after:absolute after:inset-[-2px] after:rounded-full after:border-2 after:border-accent after:shadow-[0_0_15px_rgba(197,148,40,0.5)] after:z-30 after:pointer-events-none"
    };

    const accuracy = calculatePercentage(stats.correct, stats.answered);

    return (
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
            <DialogHeader className="p-6 pb-4 bg-slate-950 text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Activity className="h-32 w-32 -rotate-12" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-accent/20 rounded-2xl border border-accent/30 backdrop-blur-sm">
                        <History className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none mb-1">
                            Raio-X: {subjectName}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                            Mapeamento tático de performance e constância
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
                {/* Painel de Estatísticas Rápidas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-[1.5rem] bg-slate-50 border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:border-accent/20 transition-colors">
                        <span className="text-3xl font-black text-slate-950 mb-1">{stats.answered}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Questões Resolvidas</span>
                    </div>
                    <div className="p-5 rounded-[1.5rem] bg-emerald-50/50 border border-emerald-100 shadow-sm flex flex-col items-center text-center group hover:border-emerald-300 transition-colors">
                        <span className="text-3xl font-black text-emerald-600 mb-1">{stats.correct}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Acertos Totais</span>
                    </div>
                    <div className={cn(
                        "p-5 rounded-[1.5rem] border shadow-sm flex flex-col items-center text-center group transition-colors",
                        accuracy >= 80 ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' : 
                        accuracy >= 60 ? 'bg-amber-50 border-amber-100 hover:border-accent/30' : 
                        'bg-red-50 border-red-100 hover:border-red-300'
                    )}>
                        <span className={cn(
                            "text-3xl font-black mb-1",
                            accuracy >= 80 ? 'text-emerald-700' : accuracy >= 60 ? 'text-amber-700' : 'text-red-700'
                        )}>{accuracy.toFixed(0)}%</span>
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Precisão Tática</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Seção do Calendário com Contorno VIP */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <CalendarIcon className="h-4 w-4 text-accent" />
                            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-950">Mapa de Constância</h4>
                        </div>
                        <div className="p-4 rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 flex justify-center shadow-inner relative overflow-hidden">
                            <Calendar
                                mode="single"
                                modifiers={modifiers}
                                modifiersClassNames={modifiersClassNames}
                                className="rounded-md scale-95 sm:scale-100"
                                locale={ptBR}
                            />
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-950 text-[9px] font-black text-white uppercase tracking-widest border border-slate-800 shadow-xl">
                            <div className="h-3 w-3 rounded-full border-2 border-accent shadow-[0_0_5px_rgba(197,148,40,0.8)]" />
                            <span>Dias com atividade (Registro VIP)</span>
                        </div>
                    </div>

                    {/* Timeline Detalhada das Batalhas */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Activity className="h-4 w-4 text-accent" />
                            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-950">Histórico de Batalhas</h4>
                        </div>
                        <ScrollArea className="h-[320px] rounded-[2rem] border-2 border-slate-50 bg-slate-50/20 p-4 shadow-inner">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
                                </div>
                            ) : attempts && attempts.length > 0 ? (
                                <div className="space-y-3 pr-2">
                                    {attempts.map((a) => (
                                        <div key={a.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm group hover:border-accent/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-2.5 w-2.5 rounded-full shadow-sm animate-pulse",
                                                    a.isCorrect ? "bg-emerald-500 shadow-emerald-200" : "bg-destructive shadow-red-200"
                                                )} />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase">
                                                        {a.timestamp ? format(a.timestamp.toDate(), "dd 'de' MMMM", { locale: ptBR }) : 'Recentemente'}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {a.isBatch ? `Registro de ${a.batchTotal} questões` : 'Questão individual'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Badge className={cn(
                                                "text-[8px] font-black px-2.5 py-0.5 rounded-lg border-none",
                                                a.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {a.isCorrect ? "VITORIA" : "DERROTA"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 opacity-40">
                                    <BookOpen className="h-8 w-8" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Sem registros detalhados</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-slate-50 border-t text-center shrink-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Consistência Vence Talento • MentorIA Academy</p>
            </div>
        </DialogContent>
    );
}

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
                      <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite] mix-blend-overlay" />
                    </div>
                  </div>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <button className="w-full pt-1 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-all duration-300 hover:scale-[1.02]">
                            <div className="h-px flex-1 bg-slate-100" />
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors">
                                <span className="text-[9px] font-black text-slate-400 group-hover:text-accent uppercase tracking-[0.2em]">Ver Detalhes</span>
                                <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-accent" />
                            </div>
                            <div className="h-px flex-1 bg-slate-100" />
                        </button>
                    </DialogTrigger>
                    <SubjectDetailsModal subjectName={name} stats={stats} />
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
