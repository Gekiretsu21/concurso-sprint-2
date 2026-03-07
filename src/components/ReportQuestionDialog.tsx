'use client';

import { useState } from 'react';
import { useFirebase, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from './ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';

interface Report {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    text: string;
    createdAt: Timestamp;
}

export function ReportQuestionDialog({ questionId }: { questionId: string }) {
    const { firestore, user } = useFirebase();
    const [newReport, setNewReport] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const isAdmin = user?.email === 'amentoriaacademy@gmail.com';

    const reportsQuery = useMemoFirebase(
        () =>
            firestore && isAdmin && isOpen
                ? query(collection(firestore, 'questoes', questionId, 'reports'), orderBy('createdAt', 'desc'))
                : null,
        [firestore, questionId, isAdmin, isOpen]
    );

    const { data: reports, isLoading } = useCollection<Report>(reportsQuery);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !user || !newReport.trim()) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'questoes', questionId, 'reports'), {
                userId: user.uid,
                userName: user.displayName || 'Anônimo',
                userPhotoURL: user.photoURL || '',
                text: newReport,
                createdAt: serverTimestamp()
            });
            setNewReport('');
            setSuccessMsg('Obrigado! Seu relato foi enviado aos desenvolvedores e será analisado.');
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (error) {
            console.error('Failed to add report:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600 hover:bg-red-50 text-xs sm:text-sm" title="Reportar Erro na Questão">
                    <Flag className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{isAdmin ? 'Relatos de Erros da Questão' : 'Reportar Erro na Questão'}</DialogTitle>
                    {!isAdmin && <DialogDescription>
                        Encontrou algum problema nesta questão? (Ex: desatualizada, gabarito errado, erro de digitação). Detalhe abaixo e nossa equipe irá analisar.
                    </DialogDescription>}
                </DialogHeader>

                {!isAdmin ? (
                    <div className="space-y-4">
                        {successMsg && <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-sm">{successMsg}</div>}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                            <Textarea
                                value={newReport}
                                onChange={(e) => setNewReport(e.target.value)}
                                placeholder="Descreva o erro que você encontrou..."
                                className="w-full"
                                rows={4}
                                disabled={!user || isSubmitting}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={!user || !newReport.trim() || isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Flag className="mr-2 h-4 w-4" />}
                                    Enviar Relato
                                </Button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {isLoading && Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                        {!isLoading && reports && reports.length > 0 ? (
                            reports.map((report) => (
                                <div key={report.id} className="flex items-start gap-4 p-3 border rounded-lg bg-red-50/50 border-red-100">
                                    <Avatar className="h-10 w-10 border border-red-200">
                                        <AvatarImage src={report.userPhotoURL} />
                                        <AvatarFallback>{getInitials(report.userName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <p className="font-bold text-sm text-red-900">{report.userName}</p>
                                            <p className="text-xs text-red-500 font-medium">
                                                {report.createdAt ? formatDistanceToNow(report.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'agora'}
                                            </p>
                                        </div>
                                        <p className="text-sm mt-1 text-slate-800">{report.text}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !isLoading && <p className="text-sm text-center text-muted-foreground py-8">Nenhum erro reportado para esta questão ainda.</p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
