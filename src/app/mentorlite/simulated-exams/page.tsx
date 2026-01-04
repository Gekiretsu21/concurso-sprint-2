'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { collection, query } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SimulatedExam {
  id: string;
  name: string;
  questionCount: number;
}

export default function SimulatedExamsPage() {
  const { firestore } = useFirebase();
  const { user } = useUser();

  const examsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, `users/${user.uid}/simulatedExams`))
        : null,
    [firestore, user]
  );

  const { data: exams, isLoading } =
    useCollection<SimulatedExam>(examsQuery);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Simulados</h1>
        <p className="text-muted-foreground">
          Crie e acesse seus simulados para testar seus conhecimentos.
        </p>
      </header>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Meus Simulados</h2>
        {isLoading && (
          <div className="flex items-center justify-center h-40 rounded-3xl border border-dashed border-white/20 bg-black/60">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && exams && exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id} className="relative group">
                <Link
                  href={`/mentorlite/simulated-exams/${exam.id}`}
                  className="relative z-10 h-full flex flex-col bg-black/60 border border-white/10 p-6 min-h-[120px] rounded-3xl shadow-lg shadow-black/30 transition-transform duration-300 group-hover:scale-[1.02] group-hover:border-white/20"
                >
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-white">
                      {exam.name}
                    </h3>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    {exam.questionCount} questões
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center h-40 rounded-3xl border border-dashed border-white/20 bg-black/60">
              <p className="text-muted-foreground">
                Nenhum simulado criado ainda.
              </p>
              <Button variant="link" asChild>
                <Link href="/mentorlite/management">
                  Crie seu primeiro simulado
                </Link>
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
