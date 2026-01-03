'use client';

import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

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
    <div className="relative w-full max-w-4xl group">
      <Link href={href} className="relative z-10 h-full flex flex-col bg-black/80 border border-white/10 p-8 min-h-[160px] rounded-3xl shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02] group-hover:border-white/20">
        <div className="flex-grow">
          <h2 className="flex items-center justify-between text-xl font-bold text-white">
            {subject}
          </h2>
          <p className="text-sm text-gray-300 mt-2">
            Clique aqui para visualizar todas as questões cadastradas para esta matéria.
          </p>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{questions?.length ?? 0}</p>
              <p className="text-xs text-gray-400">Questões</p>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
