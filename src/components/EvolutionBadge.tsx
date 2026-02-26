'use client';

import { getAchievement } from '@/lib/gamification';
import { cn } from '@/lib/utils';

interface EvolutionBadgeProps {
  level: number;
  showLabel?: boolean;
  size?: 'sm' | 'lg';
}

/**
 * Componente de Selo de Evolução baseado no Dicionário de Conquistas.
 * Agora maior e com mais destaque visual para celebrar a evolução do aluno.
 */
export function EvolutionBadge({ level, showLabel = true, size = 'lg' }: EvolutionBadgeProps) {
  const achievement = getAchievement(level);
  const isMaxTier = level >= 46;

  return (
    <div className="flex flex-col items-center gap-3 group">
      <div 
        className={cn(
          "relative flex items-center justify-center rounded-[2rem] border-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl shadow-black/10",
          achievement.color,
          size === 'lg' ? "h-24 w-24 sm:h-28 sm:w-28" : "h-14 w-14 shadow-md border-2 rounded-2xl"
        )}
      >
        <span className={cn(
          "select-none transition-transform duration-500 group-hover:scale-110 drop-shadow-md",
          size === 'lg' ? "text-5xl sm:text-6xl" : "text-2xl"
        )}>
          {achievement.icon}
        </span>
        
        {isMaxTier && (
          <div className="absolute -top-3 -right-3 flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-yellow-400 text-sm shadow-xl border-4 border-white">
            ⭐
          </div>
        )}

        {/* Efeito de brilho ao passar o mouse */}
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      
      {showLabel && (
        <div className="text-center space-y-1">
          <p className={cn(
            "font-black uppercase tracking-tight leading-tight px-3 py-1 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm border border-black/5",
            achievement.color.split(' ')[0], // Captura a classe de cor do texto (ex: text-amber-700)
            size === 'lg' ? "text-[11px] sm:text-xs" : "text-[8px]"
          )}>
            {achievement.title}
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-4 bg-slate-200 hidden sm:block" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NÍVEL {level}</p>
            <div className="h-px w-4 bg-slate-200 hidden sm:block" />
          </div>
        </div>
      )}
    </div>
  );
}
