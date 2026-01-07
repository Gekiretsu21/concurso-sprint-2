'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SubjectCardProps {
  subject: string;
  href: string;
  questionCount: number;
}

export function SubjectCard({ subject, href, questionCount }: SubjectCardProps) {
  return (
    <Card>
      <Link href={href}>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{subject}</CardTitle>
            <CardDescription className="mt-1">
              Clique para visualizar todas as questões desta matéria.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold">{questionCount}</p>
              <p className="text-xs text-muted-foreground">Questões</p>
            </div>
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
      </Link>
    </Card>
  );
}
