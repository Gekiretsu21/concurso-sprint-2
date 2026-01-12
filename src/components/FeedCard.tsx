
'use client';

import { FeedPost } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Pin, Link as LinkIcon, Youtube } from 'lucide-react';
import Link from 'next/link';

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
    <div className={cn(
        "relative flex flex-col py-6 border-b", 
        post.isPinned && "border-l-4 border-primary pl-6 bg-primary/5"
    )}>
        {post.isPinned && <Pin className="absolute top-4 right-4 h-4 w-4 text-primary" />}
        
        {isYoutube && videoId ? (
            <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={post.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        ) : isLink && post.imageUrl ? (
            <div className="aspect-video mb-4 rounded-lg overflow-hidden">
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
            </div>
        ) : null}
      
        <div className="space-y-2">
            <h3 className="text-xl font-bold">{post.title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
        </div>

        <div className="mt-4">
            {isLink && post.url ? (
                <Link href={post.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline flex items-center gap-2">
                    <LinkIcon className="h-4 w-4"/>
                    Acessar Link
                </Link>
            ) : isYoutube ? (
                <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-600"/>
                    Vídeo do YouTube
                </div>
            ) : (
                <p className="text-xs text-muted-foreground">
                    Postado em {new Date(post.createdAt.seconds * 1000).toLocaleDateString()}
                </p>
            )}
        </div>
    </div>
  );
}
