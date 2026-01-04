'use client';

import Link from 'next/link';
import { Loader2, ExternalLink } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface SubjectCardProps {
  subject: string;
  href: string;
}

interface Question {
  id: string;
}

export function SubjectCard({ subject, href }: SubjectCardProps) {
  const { firestore } = useFirebase();

  const questionsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'questoes'), where('Materia', '==', subject))
        : null,
    [firestore, subject]
  );

  const { data: questions, isLoading } = useCollection<Question>(questionsQuery);

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
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-right">
                <p className="text-2xl font-bold">{questions?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">Questões</p>
              </div>
            )}
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
      </Link>
    </Card>
  );
}
