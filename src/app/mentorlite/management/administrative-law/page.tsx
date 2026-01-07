'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { QuestionList } from '@/components/QuestionList';

export default function AdministrativeLawPage() {
  const subject = 'Direito Administrativo';

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/mentorlite/management">
            <ChevronLeft />
            <span className="sr-only">Voltar</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Questões de {subject}
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as questões cadastradas para esta matéria.
          </p>
        </div>
      </header>
      <QuestionList subject={subject} />
    </div>
  );
}
