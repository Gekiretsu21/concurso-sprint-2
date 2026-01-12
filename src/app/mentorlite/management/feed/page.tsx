'use client';

import { useMemo, useState } from 'react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { FeedPost } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteFeedPost } from '@/firebase/actions';
import { useToast } from '@/hooks/use-toast';
import { FeedPostDialog } from '@/components/FeedPostDialog';


export default function ManagementFeedPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const feedQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'feed_posts'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: feedPosts, isLoading } = useCollection<FeedPost>(feedQuery);

  const handleDelete = async () => {
    if (!firestore || !postToDelete) return;

    setIsDeleting(true);
    try {
        await deleteFeedPost(firestore, postToDelete);
        toast({
            title: 'Sucesso!',
            description: 'O post foi excluído.',
        });
        setPostToDelete(null);
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível excluir o post.',
        });
    } finally {
        setIsDeleting(false);
    }
  }

  const getAudienceBadge = (audience: 'all' | 'standard' | 'plus') => {
    switch (audience) {
      case 'plus':
        return <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/30">MentorIA+</Badge>;
      case 'standard':
        return <Badge variant="secondary">Standard</Badge>;
      default:
        return <Badge variant="outline">Todos</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
            <Link href="/mentorlite/management">
                <ChevronLeft />
                <span className="sr-only">Voltar</span>
            </Link>
            </Button>
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Feed</h1>
            <p className="text-muted-foreground">
                Visualize, edite e exclua os posts do feed de notícias.
            </p>
            </div>
        </div>
        <FeedPostDialog />
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Posts Publicados</CardTitle>
            <CardDescription>Lista de todos os posts em ordem de criação.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : feedPosts && feedPosts.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Audiência</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedPosts.map(post => (
                            <TableRow key={post.id}>
                                <TableCell className="font-medium max-w-sm truncate">{post.title}</TableCell>
                                <TableCell>
                                    <Badge variant={post.isActive ? 'default' : 'secondary'}>
                                        {post.isActive ? 'Ativo' : 'Inativo'}
                                        {post.isPinned && <span className="ml-1"> (Fixado)</span>}
                                    </Badge>
                                </TableCell>
                                <TableCell>{getAudienceBadge(post.audience)}</TableCell>
                                <TableCell>
                                    {new Date(post.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                        <FeedPostDialog postToEdit={post} />
                                         <AlertDialog open={postToDelete === post.id} onOpenChange={(open) => !open && setPostToDelete(null)}>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" onClick={() => setPostToDelete(post.id)}>
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tem certeza que deseja excluir o post "{post.title}"? Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Excluir
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    Nenhum post encontrado.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
