'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { QuestionList } from '@/components/QuestionList';

function SubjectPageContent({ subjectName, subjectParam }: { subjectName: string, subjectParam: string }) {
  
  // Special handling for 'lingua-portuguesa' to query variations
  const querySubjects = subjectParam === 'lingua-portuguesa' 
    ? ['Língua Portuguesa', 'Lingua Portuguesa']
    : [subjectName];


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
      <QuestionList subject={querySubjects} />
    </div>
  );
}

export default function SubjectPage({ params }: { params: { subject: string } }) {

  // This will handle URL-encoded characters (like %C3%A7 for ç) and reconstruct the name.
  // We use params.subject directly to avoid the Next.js direct access warning.
  const subjectName = params.subject
    ? decodeURIComponent(params.subject).split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  // Specific case to ensure correct accentuation for display
  const finalSubjectName = params.subject === 'lingua-portuguesa' ? 'Língua Portuguesa' : subjectName;
  
  return <SubjectPageContent subjectName={finalSubjectName} subjectParam={params.subject}/>;
}
