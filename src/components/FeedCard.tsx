'use client';

import { FeedPost } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Pin, Link as LinkIcon } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

interface FeedCardProps {
  post: FeedPost;
}

function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function FeedCard({ post }: FeedCardProps) {
  const { type, title, body, contentUrl, actionLabel, isPinned } = post;

  const cardContent = () => {
    switch (type) {
      case 'video':
        const videoId = contentUrl ? getYouTubeVideoId(contentUrl) : null;
        if (!videoId) return <p className="text-destructive">Link do vídeo do YouTube inválido.</p>;
        return (
          <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        );
      case 'link':
        return (
            <>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p>
                {contentUrl && (
                    <div className="mt-4">
                        <Button asChild>
                            <Link href={contentUrl} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="mr-2"/>
                                {actionLabel || 'Acessar'}
                            </Link>
                        </Button>
                    </div>
                )}
            </>
        );
      case 'notice':
        return <p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p>;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("flex flex-col", type === 'notice' && 'border-l-4 border-l-primary')}>
      <CardHeader>
        {isPinned && (
            <Badge variant="secondary" className="w-fit mb-2">
                <Pin className="mr-1 h-3 w-3 -rotate-45" />
                Fixo
            </Badge>
        )}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        {cardContent()}
      </CardContent>
    </Card>
  );
}
