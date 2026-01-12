'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Megaphone } from 'lucide-react';
import { useState } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { createFeedPost } from '@/firebase/actions';

const formSchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter pelo menos 5 caracteres.' }),
  content: z.string().min(10, { message: 'O conteúdo deve ter pelo menos 10 caracteres.' }),
  type: z.enum(['text', 'youtube', 'link']),
  url: z.string().url({ message: 'Por favor, insira uma URL válida.' }).optional().or(z.literal('')),
  imageUrl: z.string().url({ message: 'Por favor, insira uma URL de imagem válida.' }).optional().or(z.literal('')),
  audience: z.enum(['all', 'standard', 'plus']),
  isPinned: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export function FeedPostDialog() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      type: 'text',
      url: '',
      imageUrl: '',
      audience: 'all',
      isPinned: false,
      isActive: true,
    },
  });

  const watchType = form.watch('type');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Você não está autenticado.' });
        return;
    }
    // Validate URL for link and youtube types
    if (values.type !== 'text' && !values.url) {
        form.setError('url', { type: 'manual', message: 'A URL é obrigatória para posts do tipo link ou youtube.' });
        return;
    }

    try {
      await createFeedPost(firestore, values);
      toast({ title: 'Sucesso!', description: 'O post foi criado no feed.' });
      form.reset();
      setIsOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao criar post', description: error.message });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" disabled={!user}>
          <Megaphone />
          <span className="sr-only">Gerenciar Feed</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Post para o Feed</DialogTitle>
          <DialogDescription>
            Crie um aviso, compartilhe um link ou vídeo com os alunos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Novo simulado disponível!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Corpo do Post</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva a novidade aqui..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Post</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Aviso (só texto)</SelectItem>
                        <SelectItem value="youtube">Vídeo do YouTube</SelectItem>
                        <SelectItem value="link">Link Externo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audiência</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o público" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="standard">Standard (e Plus)</SelectItem>
                        <SelectItem value="plus">Apenas MentorIA+</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchType !== 'text' && (
                <>
                   <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                         <FormDescription>
                            {watchType === 'youtube'
                            ? 'Cole a URL completa do vídeo do YouTube.'
                            : 'Cole o link para o site externo.'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchType === 'link' && (
                     <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL da Imagem (Opcional)</FormLabel>
                            <FormControl>
                            <Input placeholder="https://.../imagem.png" {...field} />
                            </FormControl>
                            <FormDescription>
                                URL para a imagem de pré-visualização do link.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
                </>
            )}
            
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <FormLabel>Fixar no topo?</FormLabel>
                    <FormDescription>
                    Posts fixados aparecem primeiro para todos.
                    </FormDescription>
                </div>
                <FormField
                    control={form.control}
                    name="isPinned"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Post
                </Button>
             </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
