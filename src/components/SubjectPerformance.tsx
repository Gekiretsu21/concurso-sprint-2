'use client';

import { useUser, useDoc, useFirebase, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { 
  BookOpen, 
  PieChart, 
  Target, 
  Zap, 
  Award, 
  History, 
  Calendar as CalendarIcon, 
  Activity, 
  ChevronRight, 
  Trophy, 
  TrendingUp, 
  Sparkles,
  Gavel,
  Scale,
  Languages,
  Monitor,
  Shield,
  FileText,
  Brain
} from 'lucide-react';
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
import { Ripple } from './ui/material-design-3-ripple';
import { GlowingEffect } from './ui/glowing-effect';

interface Attempt {
    id: string;
    isCorrect: boolean;
    timestamp: Timestamp;
    subject: string;
    isBatch?: boolean;
    batchTotal?: number;
    batchCorrect?: number;
}

/**
 * Retorna um ícone específico baseado no nome da matéria para evitar repetição.
 */
function getSubjectIcon(subjectName: string) {
    const name = subjectName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (name.includes('administrativo')) return Gavel;
    if (name.includes('constitucional')) return Scale;
    if (name.includes('portugues')) return Languages;
    if (name.includes('informatica')) return Monitor;
    if (name.includes('operacional')) return Shield;
    if (name.includes('legislacao')) return FileText;
    if (name.includes('logico') || name.includes('matematica')) return Brain;
    
    return Award; // Ícone padrão
}

function SubjectDetailsModal({ subjectName, stats }: { subjectName: string, stats: any }) {
    const { user } = useUser();
    const { firestore } = useFirebase();
    
    const subjectVariations = useMemo(() => {
        if (!subjectName) return [];
        const base = subjectName.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const variants = [subjectName];
        if (base === 'lingua portuguesa') variants.push('Língua Portuguesa', 'Lingua Portuguesa');
        if (base === 'legislacao juridica') variants.push('Legislação Jurídica', 'Legislacao Juridica');
        if (base === 'legislacao institucional') variants.push('Legislação Institucional', 'Legislacao Institucional');
        if (base === 'raciocinio logico') variants.push('Raciocínio Lógico', 'Raciocinio Logico');
        return Array.from(new Set(variants));
    }, [subjectName]);

    const attemptsQuery = useMemoFirebase(() => {
        if (!firestore || !user || subjectVariations.length === 0) return null;
        return query(
            collection(firestore, `users/${user.uid}/question_attempts`),
            where('subject', 'in', subjectVariations),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, user, subjectVariations]);

    const { data: attempts, isLoading } = useCollection<Attempt>(attemptsQuery);

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

    const accuracy = calculatePercentage(stats.correct, stats.answered);
    const SubjectIcon = getSubjectIcon(subjectName);

    const modifiers = {
        active: (date: Date) => activeDays.has(format(date, 'yyyy-MM-dd')),
    };

    const modifiersClassNames = {
        active: "relative z-20 before:content-[''] before:absolute before:inset-0 before:bg-accent/15 before:rounded-full before:z-0 after:content-[''] after:absolute after:inset-[-2px] after:rounded-full after:border-2 after:border-accent after:shadow-[0_0_12px_rgba(197,148,40,0.6)] after:z-30 after:pointer-events-none after:animate-pulse"
    };

    return (
        <DialogContent className="sm:max-w-[750px] max-h-[92vh] overflow-hidden flex flex-col p-0 border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] bg-white rounded-[2.5rem]">
            <DialogHeader className="p-8 bg-slate-950 text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Trophy className="h-48 w-48 -rotate-12" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-accent rounded-[1.5rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[1.5rem] border border-white/10 shadow-2xl">
                            <SubjectIcon className="h-8 w-8 text-accent" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tight italic leading-none">
                            {subjectName}
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-accent fill-current" />
                            <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">
                                Mapeamento Estratégico de Evolução
                            </DialogDescription>
                        </div>
                    </div>
                </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50/30">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:scale-[1.03] transition-all">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Batalhas</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-slate-950">{stats.answered}</span>
                            <span className="text-xs font-bold text-slate-400">Q</span>
                        </div>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-emerald-50/30 border border-emerald-100 shadow-sm flex flex-col items-center text-center group hover:scale-[1.03] transition-all">
                        <span className="text-sm font-black text-emerald-600/60 uppercase tracking-widest mb-2">Vitórias</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-emerald-600">{stats.correct}</span>
                            <span className="text-xs font-bold text-emerald-400">Q</span>
                        </div>
                    </div>
                    <div className={cn(
                        "p-6 rounded-[2rem] border shadow-md flex flex-col items-center text-center group hover:scale-[1.03] transition-all",
                        accuracy >= 80 ? 'bg-emerald-600 text-white border-none' : 
                        accuracy >= 60 ? 'bg-accent text-white border-none' : 
                        'bg-destructive text-white border-none'
                    )}>
                        <span className="text-sm font-black uppercase tracking-widest mb-2 opacity-80">Precisão</span>
                        <span className="text-4xl font-black">{accuracy.toFixed(0)}%</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-5">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-accent" />
                                <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-950">Mapa de Constância</h4>
                            </div>
                            <Badge variant="outline" className="bg-white border-slate-200 text-[9px] font-black">{activeDays.size} DIAS ATIVOS</Badge>
                        </div>
                        <div className="p-6 rounded-[2.5rem] border-2 border-white bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent opacity-50" />
                            <Calendar
                                mode="single"
                                modifiers={modifiers}
                                modifiersClassNames={modifiersClassNames}
                                className="rounded-md scale-100 z-10"
                                locale={ptBR}
                            />
                        </div>
                        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-900 text-[10px] font-bold text-white uppercase tracking-widest border-b-4 border-slate-950 shadow-xl">
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-accent animate-pulse shadow-[0_0_8px_rgba(197,148,40,1)]" />
                            <span>Contorno VIP: Dia com Atividade</span>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center gap-2 px-2">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <h4 className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-950">Registro de Batalhas</h4>
                        </div>
                        <ScrollArea className="h-[360px] rounded-[2.5rem] border-2 border-white bg-slate-50/50 p-5 shadow-inner">
                            {isLoading ? (
                                <div className="space-y-4">
                                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[1.5rem]" />)}
                                </div>
                            ) : attempts && attempts.length > 0 ? (
                                <div className="space-y-4 pr-3">
                                    {attempts.map((a) => (
                                        <div key={a.id} className="relative group p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                                                        a.isCorrect ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                                    )}>
                                                        {a.isCorrect ? <Zap className="h-5 w-5 fill-current" /> : <Activity className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-black text-slate-900 uppercase">
                                                            {a.timestamp ? format(a.timestamp.toDate(), "dd 'de' MMMM", { locale: ptBR }) : 'Recentemente'}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                            {a.isBatch ? `Lote de ${a.batchTotal} questões` : 'Resolução Individual'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[9px] font-black px-3 py-1 rounded-full border-none shadow-sm",
                                                    a.isCorrect ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                                )}>
                                                    {a.isCorrect ? "VITORIA" : "DERROTA"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-30">
                                    <Sparkles className="h-12 w-12 text-slate-400" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-[150px]">Prepare-se para registrar sua primeira vitória</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </div>
            <div className="p-5 bg-slate-50 border-t text-center shrink-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">MENTORIA ACADEMY • A CONSTÂNCIA VENCE O TALENTO</p>
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
          <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />
        ))}
      </div>
    );
  }

  const subjectStats = userData?.stats?.performance?.questions?.bySubject || {};
  const activeSubjects = Object.entries(subjectStats);

  if (activeSubjects.length === 0) {
    return (
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-[3rem] overflow-hidden group">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-white p-8 rounded-full shadow-2xl mb-8 group-hover:scale-110 transition-transform">
            <BookOpen className="h-14 w-12 text-slate-300" />
          </div>
          <h3 className="text-3xl font-black text-slate-950 uppercase tracking-tight italic">Maestria por Disciplina</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-3 font-medium leading-relaxed">
            Seu mapeamento tático de evolução por matéria aparecerá aqui assim que você registrar sua primeira atividade hoje.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 p-3 rounded-2xl shadow-xl border-b-4 border-slate-800">
            <PieChart className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter italic leading-none">Domínio de Matérias</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status individual por disciplina</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-100 shadow-lg">
          <Sparkles className="h-3 w-3 text-accent fill-current animate-pulse" />
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sincronização Ativa</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeSubjects.map(([name, stats]: [string, any]) => {
          const percent = calculatePercentage(stats.correct, stats.answered);
          const SubjectIcon = getSubjectIcon(name);
          
          return (
            <div key={name} className="relative rounded-[2.5rem] border-[0.75px] border-border p-1 group">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <Card 
                className="relative z-10 group border-2 border-slate-100 bg-white rounded-[2.3rem] shadow-xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-accent/40 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none scale-150">
                  <SubjectIcon className="h-24 w-24 -rotate-12" />
                </div>

                <CardContent className="p-8 space-y-6 relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="font-black text-lg text-slate-950 leading-tight uppercase tracking-tight line-clamp-2 drop-shadow-sm">
                        {name}
                      </h4>
                      <div className="flex items-center gap-2">
                          <div className={cn(
                              "h-2 w-2 rounded-full animate-pulse",
                              percent >= 80 ? "bg-emerald-500" : percent >= 60 ? "bg-accent" : "bg-red-500"
                          )} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              Zona de Performance
                          </span>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "shrink-0 flex flex-col items-center justify-center h-16 w-16 rounded-[1.25rem] border-4 shadow-xl transition-all duration-500 group-hover:rotate-3 group-hover:scale-110",
                      percent >= 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                      percent >= 60 ? 'bg-amber-50 border-amber-100 text-amber-700' : 
                      'bg-red-50 border-red-100 text-red-700'
                    )}>
                      <span className="text-xl font-black leading-none italic">{percent.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-1.5">
                          <Target className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              Maestria Tática
                          </span>
                      </div>
                      <span className="text-xs font-black text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        {stats.correct} / <span className="text-slate-400">{stats.answered}</span>
                      </span>
                    </div>
                    
                    <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                      <div 
                        className={cn(
                          "h-full transition-all duration-[1.5s] ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-full relative",
                          percent >= 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 
                          percent >= 60 ? 'bg-accent shadow-[0_0_10px_rgba(197,148,40,0.4)]' : 
                          'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                        )} 
                        style={{ width: `${percent}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-[shimmer_2s_infinite]" />
                      </div>
                    </div>
                  </div>

                  <Dialog>
                      <DialogTrigger asChild>
                          <div className="w-full pt-2 cursor-pointer group/ripple">
                              <Ripple 
                                  className="w-full rounded-2xl overflow-visible" 
                                  color="text-accent"
                                  opacity={0.15}
                              >
                                  <div className="flex items-center justify-between opacity-40 group-hover/ripple:opacity-100 transition-all duration-500 group-hover/ripple:translate-y-[-2px]">
                                      <div className="h-px flex-1 bg-slate-100" />
                                      <div className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm group-hover/ripple:bg-accent group-hover/ripple:border-accent group-hover/ripple:text-white transition-all group-hover/ripple:shadow-lg group-hover/ripple:shadow-accent/20">
                                          <span className="text-[10px] font-black uppercase tracking-[0.25em]">Ver Raio-X</span>
                                          <ChevronRight className="h-4 w-4 transition-transform group-hover/ripple:translate-x-1" />
                                      </div>
                                      <div className="h-px flex-1 bg-slate-100" />
                                  </div>
                              </Ripple>
                          </div>
                      </DialogTrigger>
                      <SubjectDetailsModal subjectName={name} stats={stats} />
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
