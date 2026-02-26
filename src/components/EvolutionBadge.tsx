'use client';

import { Hexagon, Shield, Award, Crown, Star, Circle } from 'lucide-react';

interface EvolutionBadgeProps {
  level: number;
  showLabel?: boolean;
}

/**
 * Componente de Selo de Evolução que muda visualmente a cada 5 níveis.
 * Compartilhado entre a Dashboard do aluno e o Painel do Mentor.
 */
export function EvolutionBadge({ level, showLabel = true }: EvolutionBadgeProps) {
  const tier = Math.floor((level - 1) / 5);
  
  let icon = <Circle className="h-7 w-7 text-slate-500" />;
  let label = "Recruta";
  let containerClass = "bg-slate-100 border-slate-300";
  let labelClass = "text-slate-500";
  let style = {};

  if (tier === 1) { // 6-10
    icon = <Hexagon className="h-8 w-8 text-orange-600" />;
    label = "Guerreiro";
    containerClass = "bg-orange-100 border-orange-400 shadow-md";
    labelClass = "text-orange-600";
    style = { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
  } else if (tier === 2) { // 11-15
    icon = <Shield className="h-9 w-9 text-blue-500" />;
    label = "Elite";
    containerClass = "bg-blue-50 border-blue-300 shadow-lg";
    labelClass = "text-blue-500";
    style = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' };
  } else if (tier === 3) { // 16-20
    icon = <Award className="h-10 w-10 text-amber-600" />;
    label = "Mestre";
    containerClass = "bg-amber-50 border-amber-400 shadow-xl shadow-amber-200/50";
    labelClass = "text-amber-600";
    style = { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
  } else if (tier >= 4) { // 21+
    icon = <Crown className="h-12 w-12 text-white" />;
    label = "Lenda Viva";
    containerClass = "bg-indigo-600 border-white shadow-2xl shadow-indigo-500/50 animate-pulse-glow";
    labelClass = "text-indigo-600 font-black";
  }

  return (
    <div className="flex flex-col items-center gap-1 group">
      <div 
        className={`relative flex items-center justify-center h-16 w-16 rounded-full border-2 transition-transform group-hover:scale-110 ${containerClass}`}
        style={style}
      >
        {icon}
        {tier >= 4 && <Star className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 fill-yellow-400 animate-bounce" />}
      </div>
      {showLabel && (
        <span className={`text-[10px] font-bold uppercase tracking-tighter ${labelClass}`}>
          {label}
        </span>
      )}
    </div>
  );
}
