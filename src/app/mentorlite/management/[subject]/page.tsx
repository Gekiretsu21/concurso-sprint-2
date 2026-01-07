'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { QuestionList } from '@/components/QuestionList';
import { useParams } from 'next/navigation';

function SubjectPageContent() {
  const params = useParams();
  const subjectParam = params.subject as string;

  // This will handle URL-encoded characters (like %C3%A7 for ç) and reconstruct the name.
  let subjectName = subjectParam
    ? decodeURIComponent(subjectParam).split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    : '';

  // Special cases to ensure correct accentuation for display
  if (subjectParam === 'lingua-portuguesa') {
    subjectName = 'Língua Portuguesa';
  }
  if (subjectParam === 'legislacao-juridica') {
    subjectName = 'Legislação Jurídica';
  }
  if (subjectParam === 'legislacao-institucional') {
    subjectName = 'Legislação Institucional';
  }
  
  // Special handling for variations
  const querySubjects = subjectParam === 'lingua-portuguesa' 
    ? ['Língua Portuguesa', 'Lingua Portuguesa']
    : subjectParam === 'legislacao-juridica'
    ? ['Legislação Jurídica', 'Legislacao Juridica']
    : subjectParam === 'legislacao-institucional'
    ? ['Legislação Institucional', 'Legislacao Institucional']
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


export default function SubjectPage() {
  return <SubjectPageContent />;
}
