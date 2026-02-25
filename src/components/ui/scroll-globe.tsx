'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Globe from "@/components/ui/globe";
import { cn } from "@/lib/utils";

interface ScrollGlobeProps {
  sections: {
    id: string;
    badge?: string;
    title: string;
    subtitle?: string;
    description: string;
    align?: 'left' | 'center' | 'right';
    features?: { title: string; description: string }[];
    actions?: { label: string; variant: 'primary' | 'secondary'; onClick?: () => void }[];
  }[];
  globeConfig?: {
    positions: {
      top: string;
      left: string;
      scale: number;
    }[];
  };
  className?: string;
}

const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },  // Section 1
    { top: "25%", left: "50%", scale: 0.9 },  // Section 2
    { top: "15%", left: "90%", scale: 2 },    // Section 3
    { top: "50%", left: "50%", scale: 1.8 },  // Section 4
  ]
};

const parsePercent = (str: string): number => parseFloat(str.replace('%', ''));

export function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }: ScrollGlobeProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameId = useRef<number>(null);

  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map(pos => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale
    }));
  }, [globeConfig.positions]);

  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);
    setScrollProgress(progress);

    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      }
    });

    const currentPos = calculatedPositions[newActiveSection];
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
    setGlobeTransform(transform);
    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [updateScrollPosition]);

  return (
    <div ref={containerRef} className={cn("relative w-full overflow-x-hidden min-h-screen", className)}>
      <div className="fixed top-0 left-0 w-full h-1 bg-border/20 z-50">
        <div 
          className="h-full bg-primary transition-transform duration-150" 
          style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left' }}
        />
      </div>

      <div className="hidden sm:flex fixed right-8 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col gap-4">
          {sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className={cn(
                "w-3 h-3 rounded-full border-2 transition-all duration-300",
                activeSection === index ? "bg-primary border-primary scale-125 shadow-lg" : "bg-transparent border-slate-400"
              )}
              aria-label={`Go to ${section.badge || section.title}`}
            />
          ))}
        </div>
      </div>

      <div
        className="fixed z-10 pointer-events-none transition-all duration-[1400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ transform: globeTransform, opacity: activeSection === 3 ? 0.4 : 0.85 }}
      >
        <Globe />
      </div>

      {sections.map((section, index) => (
        <section
          key={section.id}
          ref={(el) => (sectionRefs.current[index] = el)}
          className={cn(
            "relative min-h-screen flex flex-col justify-center px-6 sm:px-12 z-20 py-20",
            section.align === 'center' && "items-center text-center",
            section.align === 'right' && "items-end text-right",
            (!section.align || section.align === 'left') && "items-start text-left"
          )}
        >
          <div className={cn(
            "w-full max-w-4xl bg-white/60 backdrop-blur-md p-8 sm:p-12 rounded-[2.5rem] border border-white/40 shadow-2xl shadow-black/5 transition-all duration-500",
            activeSection === index ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          )}>
            {section.badge && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 animate-pulse">
                {section.badge}
              </div>
            )}
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight leading-[1.1] text-slate-950">
              {section.title}
              {section.subtitle && <span className="block text-slate-700 text-[0.6em] mt-2 font-medium">{section.subtitle}</span>}
            </h1>
            <p className="text-lg sm:text-xl text-slate-900 mb-10 max-w-2xl font-normal leading-relaxed">
              {section.description}
            </p>

            {section.features && (
              <div className="grid gap-4 mb-10">
                {section.features.map((feature) => (
                  <div key={feature.title} className="p-5 rounded-2xl border border-slate-200 bg-white/80 shadow-sm">
                    <h3 className="font-bold text-slate-950 text-lg mb-1">{feature.title}</h3>
                    <p className="text-slate-800 text-sm leading-relaxed font-medium">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}

            {section.actions && (
              <div className="flex flex-wrap gap-4">
                {section.actions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      "px-8 py-4 rounded-xl font-bold transition-all duration-300",
                      action.variant === 'primary' 
                        ? "bg-primary text-primary-foreground hover:shadow-lg hover:scale-105" 
                        : "border-2 border-slate-300 bg-white/50 backdrop-blur-sm hover:bg-slate-100 text-slate-900"
                    )}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
