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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { calculateLevel, calculatePercentage, getAchievement } from '@/lib/gamification';
import { EvolutionBadge } from './EvolutionBadge';
import { Crown, Layers, Target, CheckCircle2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  subscription?: {
    plan: 'standard' | 'plus' | 'mentoria_plus_plus';
    status: 'active' | 'inactive' | 'canceled';
  };
  stats?: any;
}

interface StudentFlashcardsModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentFlashcardsModal({ user, isOpen, onOpenChange }: StudentFlashcardsModalProps) {
  if (!user) return null;

  const stats = user.stats?.performance?.flashcards || {
    totalReviewed: 0,
    totalCorrect: 0,
    bySubject: {}
  };

  const questionStats = user.stats?.performance?.questions || { totalAnswered: 0 };
  const levelInfo = calculateLevel(questionStats.totalAnswered);
  const achievement = getAchievement(levelInfo.currentLevel);
  
  const overallAccuracy = calculatePercentage(stats.totalCorrect, stats.totalReviewed);
  const subjects = Object.entries(stats.bySubject || {});

  const planLabel = user.subscription?.plan === 'plus' ? 'MentorIA+' : 
                    user.subscription?.plan === 'mentoria_plus_plus' ? 'MentorIA++' : 'Standard';
  const isPlus = user.subscription?.plan === 'plus' || user.subscription?.plan === 'mentoria_plus_plus';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-amber-100 bg-amber-50/30 shrink-0">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-amber-200">
              <AvatarImage src={user.photoURL} />
              <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-bold">{user.name}</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">{user.email}</DialogDescription>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isPlus ? 'default' : 'secondary'} className={cn(isPlus && 'bg-accent text-accent-foreground')}>
                  {isPlus && <Crown className="mr-1 h-3 w-3" />}
                  {planLabel}
                </Badge>
                <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase", achievement.color)}>
                  {achievement.icon} {achievement.title}
                </div>
              </div>
            </div>
            <div className="ml-auto">
              <EvolutionBadge level={levelInfo.currentLevel} showLabel={false} />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 space-y-8 flex flex-col h-full">
            {/* Resumo de Flashcards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <Layers className="h-5 w-5 text-slate-400 mb-2" />
                <span className="text-2xl font-black text-slate-900">{stats.totalReviewed}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Total Revisados</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col items-center text-center">
                <CheckCircle2 className="h-5 w-5 text-amber-600 mb-2" />
                <span className="text-2xl font-black text-amber-700">{stats.totalCorrect}</span>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Total Acertos</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center text-center">
                <Target className="h-5 w-5 text-emerald-600 mb-2" />
                <span className="text-2xl font-black text-emerald-700">{overallAccuracy.toFixed(0)}%</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Aproveitamento</span>
              </div>
            </div>

            {/* Detalhamento por Disciplina */}
            <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 shrink-0">
                <BookOpen className="h-5 w-5 text-amber-600" />
                <h3 className="font-bold text-slate-900">Memorização por Disciplina</h3>
              </div>

              {subjects.length > 0 ? (
                <ScrollArea className="flex-1 w-full rounded-xl border border-amber-100 bg-amber-50/10 p-4">
                  <div className="grid gap-3 pr-2">
                    {subjects.map(([name, data]: [string, any]) => {
                      const accuracy = calculatePercentage(data.correct, data.reviewed);
                      return (
                        <div key={name} className="p-4 rounded-xl border bg-white shadow-sm space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-slate-800">{name}</span>
                            <span className={cn(
                              "text-xs font-black px-2 py-0.5 rounded-full",
                              accuracy >= 80 ? 'bg-emerald-100 text-emerald-700' :
                              accuracy >= 60 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            )}>
                              {accuracy.toFixed(0)}%
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                              <span>Acertos na Revisão</span>
                              <span>{data.correct}/{data.reviewed} cards</span>
                            </div>
                            <Progress value={accuracy} className="h-1.5 bg-slate-100" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl bg-slate-50/50">
                  <Layers className="h-12 w-12 text-slate-200 mb-4" />
                  <p className="text-slate-500 font-medium max-w-[250px]">
                    Este aluno ainda não revisou flashcards nesta plataforma.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
