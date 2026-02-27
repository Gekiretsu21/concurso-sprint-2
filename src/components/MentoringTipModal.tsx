'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lightbulb, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Achievement } from '@/lib/gamification';

interface MentoringTipModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  achievement: Achievement;
}

export function MentoringTipModal({ isOpen, onOpenChange, achievement }: MentoringTipModalProps) {
  // Extract color classes
  const colorBase = achievement.color.split(' ')[0]; // e.g. text-gray-700
  const bgClass = achievement.color.split(' ').find(c => c.startsWith('bg-')) || 'bg-accent';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
        <div className={cn("h-3 w-full", bgClass)} />
        
        <div className="p-8 space-y-8">
          <DialogHeader className="flex flex-col items-center text-center space-y-4">
            <div className={cn(
              "h-24 w-24 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border-4 border-white ring-1 ring-slate-100",
              bgClass.replace('bg-', 'bg-').replace('100', '50') || 'bg-slate-50'
            )}>
              {achievement.icon}
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight italic leading-tight text-slate-900">
                {achievement.title}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                Sua Fase Estratégica Atual
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="relative p-6 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group">
            <div className="absolute -top-4 -right-4 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                <Lightbulb className="h-24 w-24" />
            </div>
            
            <div className="flex items-center gap-2 mb-4">
                <div className={cn("p-1.5 rounded-lg bg-white shadow-sm border border-slate-100", colorBase)}>
                    <Lightbulb className="h-4 w-4 fill-current" />
                </div>
                <h4 className={cn("font-black text-[11px] uppercase tracking-widest", colorBase)}>
                    Dica da Mentoria
                </h4>
            </div>
            
            <p className="text-slate-700 text-sm leading-relaxed font-bold italic">
              "{achievement.mentoringTip}"
            </p>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button 
              onClick={() => onOpenChange(false)}
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-slate-950 text-white hover:bg-slate-900 shadow-xl border-b-4 border-slate-800 active:border-b-0 transition-all group"
            >
              Entendido, vamos pra cima!
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </DialogFooter>
        </div>
        
        <div className="bg-slate-50 p-4 border-t text-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">MentorIA Academy • Inteligência de Elite</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
