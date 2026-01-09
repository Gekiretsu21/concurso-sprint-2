'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';

interface SubjectCardProps {
  subject: string;
  href: string;
  questionCount: number;
}

export function SubjectCard({ subject, href, questionCount }: SubjectCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between p-6">
        <Link href={href} className="flex-grow group">
          <div className="pr-4">
            <CardTitle className="group-hover:text-primary transition-colors">{subject}</CardTitle>
            <CardDescription className="mt-1 group-hover:text-primary/80 transition-colors">
              Clique para visualizar todas as questões desta matéria.
            </CardDescription>
          </div>
        </Link>
        <div className="flex items-center gap-4 ml-4 shrink-0">
          <div className="text-right">
            <p className="text-2xl font-bold">{questionCount}</p>
            <p className="text-xs text-muted-foreground">Questões</p>
          </div>
          <Link href={href} aria-label={`Ver questões de ${subject}`}>
            <ExternalLink className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
