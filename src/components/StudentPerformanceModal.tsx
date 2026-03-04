'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { calculateLevel, calculatePercentage, getAchievement } from '@/lib/gamification';
import { EvolutionBadge } from './EvolutionBadge';
import { Crown, BookOpen, Target, CheckCircle2, LayoutGrid, PieChart, Layers, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  subscription?: {
    plan: 'standard' | 'academy' | 'plus';
    status: 'active' | 'inactive' | 'canceled';
  };
  stats?: any;
}

interface StudentPerformanceModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: 'questions' | 'flashcards';
}

export function StudentPerformanceModal({ user, isOpen, onOpenChange, initialView = 'questions' }: StudentPerformanceModalProps) {
  const [activeTab, setActiveTab] = useState<'questions' | 'flashcards'>(initialView);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialView);
    }
  }, [isOpen, initialView]);

  if (!user) return null;

  // Questões Stats
  const qStats = user.stats?.performance?.questions || {
    totalAnswered: 0,
    totalCorrect: 0,
    bySubject: {}
  };

  // Flashcards Stats
  const fStats = user.stats?.performance?.flashcards || {
    totalReviewed: 0,
    totalCorrect: 0,
    bySubject: {}
  };

  const levelInfo = calculateLevel(qStats.totalAnswered);
  const achievement = getAchievement(levelInfo.currentLevel);

  const qAccuracy = calculatePercentage(qStats.totalCorrect, qStats.totalAnswered);
  const fAccuracy = calculatePercentage(fStats.totalCorrect, fStats.totalReviewed);

  const qSubjects = Object.entries(qStats.bySubject || {});
  const fSubjects = Object.entries(fStats.bySubject || {});

  const planLabel = user.subscription?.plan === 'plus' ? 'MentorIA+' :
    user.subscription?.plan === 'academy' ? 'MentorIA Academy' : 'Standard';
  const isPlus = user.subscription?.plan === 'plus' || user.subscription?.plan === 'academy';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white sm:rounded-[2rem] p-0 overflow-hidden shadow-2xl border-0 h-[85vh] flex flex-col">
        <DialogHeader className="p-6 sm:p-8 bg-slate-950 text-white border-b border-slate-900 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 mb-2 relative z-10">
              <Avatar className="h-16 w-16 border-2 border-slate-700 shadow-xl">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback className="bg-slate-800 text-white font-bold">{user.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-100 mb-1">{user.name}</DialogTitle>
                <DialogDescription className="text-slate-300 font-medium mb-2">{user.email}</DialogDescription>
                <div className="flex items-center gap-2">
                  <Badge variant={isPlus ? 'default' : 'secondary'} className={cn(isPlus ? 'bg-accent text-accent-foreground' : 'bg-slate-800 text-slate-300')}>
                    {isPlus && <Crown className="mr-1 h-3 w-3" />}
                    {planLabel}
                  </Badge>
                  <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase", achievement.color)}>
                    {achievement.icon} <span className="text-white font-black">{achievement.title}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="hidden sm:block">
                <EvolutionBadge level={levelInfo.currentLevel} showLabel={false} />
              </div>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('questions')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    activeTab === 'questions' ? "bg-accent text-accent-foreground shadow-lg" : "text-slate-400 hover:text-white"
                  )}
                >
                  <LayoutGrid className="h-3 w-3" /> Questões
                </button>
                <button
                  onClick={() => setActiveTab('flashcards')}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    activeTab === 'flashcards' ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Layers className="h-3 w-3" /> Flashcards
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
          <div className="p-6 sm:p-8 space-y-6 flex flex-col h-full">

            {activeTab === 'questions' ? (
              <>
                {/* Questions Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 -mt-2">
                  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
                    <LayoutGrid className="h-5 w-5 text-slate-400 mb-2" />
                    <span className="text-3xl font-black text-slate-900">{qStats.totalAnswered}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Questões</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
                    <span className="text-3xl font-black text-emerald-600">{qStats.totalCorrect}</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Total Acertos</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center text-center relative overflow-hidden">
                    <div className={cn("absolute inset-0 opacity-10", qAccuracy >= 80 ? 'bg-emerald-500' : qAccuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500')} />
                    <Target className={cn("h-5 w-5 mb-2 relative z-10", qAccuracy >= 80 ? 'text-emerald-500' : qAccuracy >= 60 ? 'text-amber-500' : 'text-rose-500')} />
                    <span className={cn("text-3xl font-black relative z-10", qAccuracy >= 80 ? 'text-emerald-600' : qAccuracy >= 60 ? 'text-amber-600' : 'text-rose-600')}>{qAccuracy.toFixed(0)}%</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 relative z-10">Aproveitamento</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  <div className="flex items-center gap-3 shrink-0 px-1">
                    <div className="p-2 bg-accent/20 rounded-xl">
                      <PieChart className="h-5 w-5 text-accent animate-pulse" />
                    </div>
                    <h3 className="font-black text-slate-950 uppercase tracking-tight text-lg">Evolução por Disciplina (Maestria Tática)</h3>
                  </div>

                  {qSubjects.length > 0 ? (
                    <ScrollArea className="flex-1 w-full rounded-2xl">
                      <div className="flex flex-col gap-4 pr-4">
                        {qSubjects.sort((a: any, b: any) => b[1].answered - a[1].answered).map(([subject, data]: [string, any]) => {
                          const accuracy = calculatePercentage(data.correct, data.answered);
                          const incorrect = data.answered - data.correct;

                          return (
                            <div key={subject} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900 text-[15px] group-hover:text-amber-600 transition-colors uppercase tracking-tight">{subject}</h3>
                                <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-2">
                                  <Target className="h-3 w-3 text-slate-400" />
                                  <span className="text-xs font-black text-slate-700">{accuracy.toFixed(0)}% precisão</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100/50">
                                  <div className="text-xl font-black text-slate-700">{data.answered}</div>
                                  <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Resolvidas</div>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100/50">
                                  <div className="text-xl font-black text-emerald-600">{data.correct}</div>
                                  <div className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mt-1">Vitórias</div>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100/50">
                                  <div className="text-xl font-black text-rose-600">{incorrect}</div>
                                  <div className="text-[9px] uppercase tracking-widest text-rose-500 font-bold mt-1">Derrotas</div>
                                </div>
                              </div>

                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  style={{ width: `${accuracy}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="p-4 bg-slate-50 rounded-full mb-4">
                        <BookOpen className="h-10 w-10 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium max-w-[250px] text-sm">
                        Este aluno ainda não registrou nenhuma atividade na plataforma.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Flashcards Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0 -mt-2">
                  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
                    <Layers className="h-5 w-5 text-slate-400 mb-2" />
                    <span className="text-3xl font-black text-slate-900">{fStats.totalReviewed}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Revisados</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-2" />
                    <span className="text-3xl font-black text-emerald-600">{fStats.totalCorrect}</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Total Acertos</span>
                  </div>
                  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center text-center relative overflow-hidden">
                    <div className={cn("absolute inset-0 opacity-10", fAccuracy >= 80 ? 'bg-emerald-500' : fAccuracy >= 60 ? 'bg-amber-500' : 'bg-rose-500')} />
                    <Target className={cn("h-5 w-5 mb-2 relative z-10", fAccuracy >= 80 ? 'text-emerald-500' : fAccuracy >= 60 ? 'text-amber-500' : 'text-rose-500')} />
                    <span className={cn("text-3xl font-black relative z-10", fAccuracy >= 80 ? 'text-emerald-600' : fAccuracy >= 60 ? 'text-amber-600' : 'text-rose-600')}>{fAccuracy.toFixed(0)}%</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 relative z-10">Aproveitamento</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 space-y-4">
                  <div className="flex items-center gap-3 shrink-0 px-1">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <BrainCircuit className="h-5 w-5 text-purple-600 animate-pulse" />
                    </div>
                    <h3 className="font-black text-slate-950 uppercase tracking-tight text-lg">Evolução na Retenção (Mapeamento VIP)</h3>
                  </div>

                  {fSubjects.length > 0 ? (
                    <ScrollArea className="flex-1 w-full rounded-2xl">
                      <div className="flex flex-col gap-4 pr-4">
                        {fSubjects.sort((a: any, b: any) => b[1].reviewed - a[1].reviewed).map(([subject, data]: [string, any]) => {
                          const accuracy = calculatePercentage(data.correct, data.reviewed);
                          const incorrect = data.reviewed - data.correct;

                          return (
                            <div key={subject} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-900 text-[15px] group-hover:text-purple-600 transition-colors uppercase tracking-tight">{subject}</h3>
                                <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-2">
                                  <Target className="h-3 w-3 text-slate-400" />
                                  <span className="text-xs font-black text-slate-700">{accuracy.toFixed(0)}% precisão</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mb-4">
                                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100/50">
                                  <div className="text-xl font-black text-slate-700">{data.reviewed}</div>
                                  <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Revisados</div>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100/50">
                                  <div className="text-xl font-black text-emerald-600">{data.correct}</div>
                                  <div className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold mt-1">Acertos</div>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-3 text-center border border-rose-100/50">
                                  <div className="text-xl font-black text-rose-600">{incorrect}</div>
                                  <div className="text-[9px] uppercase tracking-widest text-rose-500 font-bold mt-1">Erros</div>
                                </div>
                              </div>

                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  style={{ width: `${accuracy}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="p-4 bg-slate-50 rounded-full mb-4">
                        <Layers className="h-10 w-10 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium max-w-[250px] text-sm">
                        Este aluno ainda não revisou nenhum flashcard.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
