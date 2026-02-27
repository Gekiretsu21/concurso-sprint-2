'use client';

import { FeedPost } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Link as LinkIcon, Youtube, Crown, Calendar, Pin } from 'lucide-react';
import Link from 'next/link';
import { GlowingEffect } from './ui/glowing-effect';
import { Badge } from './ui/badge';

function extractYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function FeedCard({ post }: { post: FeedPost }) {
  const isYoutube = post.type === 'youtube';
  const isLink = post.type === 'link';
  const videoId = isYoutube && post.url ? extractYouTubeVideoId(post.url) : null;

  return (
    <div className="relative rounded-[2.5rem] border-[0.75px] border-border p-1 group">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={3}
      />
      <Card className={cn(
        "relative z-10 h-full border-2 overflow-hidden rounded-[2.3rem] transition-all duration-500 bg-white",
        post.isPinned ? "border-accent/40 shadow-[0_20px_50px_rgba(197,148,40,0.1)]" : "border-slate-100 shadow-xl shadow-black/5 hover:shadow-2xl hover:border-slate-200"
      )}>
        {post.isPinned && (
            <div className="absolute top-0 right-0 z-20">
                <div className="bg-accent text-accent-foreground px-6 py-1.5 rounded-bl-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg">
                    <Crown className="h-3 w-3 fill-current" />
                    Destaque
                </div>
            </div>
        )}

        <CardHeader className="p-8 pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-2.5 rounded-xl shadow-sm",
                        isYoutube ? "bg-red-50 text-red-600" : isLink ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                    )}>
                        {isYoutube ? <Youtube className="h-5 w-5" /> : isLink ? <LinkIcon className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                            {isYoutube ? 'VÍDEO TÁTICO' : isLink ? 'RECURSO EXTERNO' : 'INFORME GERAL'}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span className="text-[10px] font-bold uppercase">
                                {new Date(post.createdAt.seconds * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <CardTitle className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight italic leading-tight group-hover:text-accent transition-colors">
                {post.title}
            </CardTitle>
        </CardHeader>

        <CardContent className="p-8 pt-0 space-y-6">
            <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                {post.content}
            </p>

            {isYoutube && videoId ? (
                <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-100 group/media">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={post.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                    <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-[2rem]" />
                </div>
            ) : isLink && post.imageUrl ? (
                <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-100 group/media">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
            ) : null}

            {isLink && post.url && (
                <div className="pt-4">
                    <Link 
                        href={post.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent hover:text-accent-foreground transition-all shadow-xl group/btn"
                    >
                        Acessar Conteúdo 
                        <LinkIcon className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

function Newspaper({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
            <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
        </svg>
    )
}
