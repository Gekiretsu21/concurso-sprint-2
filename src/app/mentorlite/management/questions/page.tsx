'use client';

import { useMemo } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection } from 'firebase/firestore';
import { SubjectCard } from '@/components/SubjectCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface Question {
  id: string;
  Materia: string;
  status?: 'active' | 'hidden';
}

interface SubjectWithCount {
    name: string;
    count: number;
}

// Helper to generate a URL-friendly slug from a subject name
const createSubjectSlug = (subject: string) => {
  return subject
    .toLowerCase()
    .replace(/ /g, '-') // Replace spaces with hyphens for URL
    .normalize('NFD') // Normalize accents to separate them from letters
    .replace(/[\u0300-\u036f]/g, '') // Remove the accents
    .replace(/[^a-z0-9-]/g, ''); // Remove any remaining special characters
};


export default function ManagementQuestionsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const questionsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'questoes') : null),
    [firestore, user]
  );
  const { data: allQuestions, isLoading: isLoadingSubjects } = useCollection<Question>(questionsQuery);
  
  const availableSubjects = useMemo((): SubjectWithCount[] => {
    if (!allQuestions) return [];

    const subjectCounts = allQuestions.reduce((acc, q) => {
        const subject = q.Materia;
        const isHidden = q.status === 'hidden';

        if (subject && subject.trim() && !isHidden) {
            let subjectName = subject.trim();
            
            if (subjectName.toLowerCase() !== 'materia') {
                if (!acc[subjectName]) {
                    acc[subjectName] = { name: subjectName, count: 0 };
                }
                acc[subjectName].count++;
            }
        }
        return acc;
    }, {} as Record<string, {name: string, count: number}>);
    
    // Unify "Língua Portuguesa" variations
    const portuguesComAcento = subjectCounts['Língua Portuguesa'];
    const portuguesSemAcento = subjectCounts['Lingua Portuguesa'];
    if (portuguesComAcento || portuguesSemAcento) {
        const total = (portuguesComAcento?.count || 0) + (portuguesSemAcento?.count || 0);
        if (portuguesComAcento) delete subjectCounts['Lingua Portuguesa'];
        if (portuguesSemAcento) delete subjectCounts['Língua Portuguesa'];
        subjectCounts['Língua Portuguesa'] = { name: 'Língua Portuguesa', count: total };
    }

    // Unify "Legislação Jurídica" variations
    const legislacaoComAcento = subjectCounts['Legislação Jurídica'];
    const legislacaoSemAcento = subjectCounts['Legislacao Juridica'];
     if (legislacaoComAcento || legislacaoSemAcento) {
        const total = (legislacaoComAcento?.count || 0) + (legislacaoSemAcento?.count || 0);
        if (legislacaoComAcento) delete subjectCounts['Legislacao Juridica'];
        if (legislacaoSemAcento) delete subjectCounts['Legislação Jurídica'];
        subjectCounts['Legislação Jurídica'] = { name: 'Legislação Jurídica', count: total };
    }
    
    // Unify "Legislação Institucional" variations
    const institucionalComAcento = subjectCounts['Legislação Institucional'];
    const institucionalSemAcento = subjectCounts['Legislacao Institucional'];
    if (institucionalComAcento || institucionalSemAcento) {
        const total = (institucionalComAcento?.count || 0) + (institucionalSemAcento?.count || 0);
        if (institucionalComAcento) delete subjectCounts['Legislacao Institucional'];
        if (institucionalSemAcento) delete subjectCounts['Legislação Institucional'];
        subjectCounts['Legislação Institucional'] = { name: 'Legislação Institucional', count: total };
    }


    return Object.values(subjectCounts)
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [allQuestions]);

  const totalQuestionsCount = useMemo(() => {
    return availableSubjects.reduce((total, subject) => total + subject.count, 0);
  }, [availableSubjects]);

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
          <h1 className="text-3xl font-bold tracking-tight">Banco de Questões</h1>
          <p className="text-muted-foreground">
            Total de {totalQuestionsCount} questões. Clique em uma matéria para visualizar e gerenciar.
          </p>
        </div>
      </header>
       {isLoadingSubjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableSubjects.map(subject => (
                    <SubjectCard 
                    key={subject.name}
                    subject={subject.name}
                    questionCount={subject.count}
                    href={`/mentorlite/management/${createSubjectSlug(subject.name)}`}
                    />
                ))}
            </div>
        )}
    </div>
  );
}
