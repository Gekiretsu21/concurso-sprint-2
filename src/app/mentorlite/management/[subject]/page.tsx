'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { QuestionList } from '@/components/QuestionList';
import { useParams } from 'next/navigation';

function SubjectPageContent({ subjectName }: { subjectName: string }) {
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
            Questões de {subjectName}
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as questões cadastradas para esta matéria.
          </p>
        </div>
      </header>
      <QuestionList subject={subjectName} />
    </div>
  );
}

export default function SubjectPage() {
  const params = useParams();
  const subjectSlug = params.subject as string;

  // Decode the URL component to handle special characters correctly
  // e.g., lingua-portuguesa -> lingua-portuguesa (no change)
  // but if it were 'L%C3%ADngua%20Portuguesa', it would become 'Língua Portuguesa'
  // The logic in createSubjectSlug normalizes it, so we need to reconstruct the likely name.
  const subjectName = subjectSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return <SubjectPageContent subjectName={subjectName} />;
}
