'use client';

import Link from 'next/link';
import { ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteQuestionsBySubject } from '@/firebase/actions';

interface SubjectCardProps {
  subject: string;
  href: string;
  questionCount: number;
}

export function SubjectCard({ subject, href, questionCount }: SubjectCardProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!firestore) return;
    setIsDeleting(true);
    try {
      const deletedCount = await deleteQuestionsBySubject(firestore, subject);
      toast({
        title: 'Sucesso!',
        description: `${deletedCount} questões de "${subject}" foram excluídas.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Excluir',
        description: `Não foi possível excluir as questões de "${subject}".`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todas as {questionCount} questões da matéria "{subject}" serão permanentemente excluídas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2" />}
                    Sim, excluir tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link href={href} aria-label={`Ver questões de ${subject}`}>
                 <ExternalLink className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
            </Link>
        </div>
      </div>
    </Card>
  );
}
