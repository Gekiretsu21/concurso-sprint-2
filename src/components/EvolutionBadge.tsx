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
 */
export function EvolutionBadge({ level, showLabel = true, size = 'lg' }: EvolutionBadgeProps) {
  const achievement = getAchievement(level);
  const isMaxTier = level >= 46;

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div 
        className={cn(
          "relative flex items-center justify-center rounded-2xl border-2 transition-all duration-500 group-hover:scale-110",
          achievement.color,
          size === 'lg' ? "h-20 w-20 shadow-sm" : "h-12 w-12 shadow-none"
        )}
      >
        <span className={cn(
          "select-none",
          size === 'lg' ? "text-4xl" : "text-xl"
        )}>
          {achievement.icon}
        </span>
        
        {isMaxTier && (
          <div className="absolute -top-2 -right-2 flex h-6 w-6 animate-bounce items-center justify-center rounded-full bg-yellow-400 text-[10px] shadow-lg">
            ⭐
          </div>
        )}
      </div>
      
      {showLabel && (
        <div className="text-center">
          <p className={cn(
            "font-black uppercase tracking-tighter leading-tight",
            achievement.color.split(' ')[0],
            size === 'lg' ? "text-[10px]" : "text-[8px]"
          )}>
            {achievement.title}
          </p>
          <p className="text-[9px] font-bold text-slate-400">NÍVEL {level}</p>
        </div>
      )}
    </div>
  );
}
