'use client';

import { useState } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { addQuestionComment } from '@/firebase/actions';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from './ui/skeleton';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  text: string;
  createdAt: Timestamp;
}

interface QuestionCommentsProps {
  questionId: string;
}

export function QuestionComments({ questionId }: QuestionCommentsProps) {
  const { firestore, user } = useFirebase();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commentsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'questoes', questionId, 'comments'), orderBy('createdAt', 'desc'))
        : null,
    [firestore, questionId]
  );

  const { data: comments, isLoading } = useCollection<Comment>(commentsQuery);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await addQuestionComment(firestore, user, questionId, newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex items-start gap-4">
        <Avatar className="h-9 w-9 border">
            <AvatarImage src={user?.photoURL ?? undefined}/>
            <AvatarFallback>{user?.displayName ? getInitials(user.displayName) : 'U'}</AvatarFallback>
        </Avatar>
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escreva seu comentário..."
          className="flex-1"
          rows={2}
          disabled={!user || isSubmitting}
        />
        <Button type="submit" size="icon" disabled={!user || !newComment.trim() || isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
          <span className="sr-only">Enviar</span>
        </Button>
      </form>

      <div className="space-y-4">
        {isLoading && Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </div>
        ))}
        {!isLoading && comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-4">
              <Avatar className="h-10 w-10 border">
                 <AvatarImage src={comment.userPhotoURL} />
                 <AvatarFallback>{getInitials(comment.userName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-lg bg-secondary p-3">
                <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-sm">{comment.userName}</p>
                    <p className="text-xs text-muted-foreground">
                        {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'agora'}
                    </p>
                </div>
                <p className="text-sm mt-1">{comment.text}</p>
              </div>
            </div>
          ))
        ) : (
          !isLoading && <p className="text-sm text-center text-muted-foreground py-4">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
        )}
      </div>
    </div>
  );
}

    