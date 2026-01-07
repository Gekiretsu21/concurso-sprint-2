
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { getAllUsers, UserData } from './actions';
import { useToast } from '@/hooks/use-toast';

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const userList = await getAllUsers();
        setUsers(userList);
      } catch (error) {
         let message = 'Ocorreu um erro ao buscar os usuários.';
          if (error instanceof Error && error.message === 'ADMIN_CREDENTIALS_ERROR') {
            message = 'Você não tem permissão para visualizar os usuários. Verifique se as credenciais do Admin SDK (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) estão configuradas corretamente no seu ambiente.';
          }
         toast({
          variant: 'destructive',
          title: 'Erro de Permissão ou Configuração',
          description: message,
          duration: 10000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

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
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários (Admin)</h1>
            <p className="text-muted-foreground">Visualize e gerencie todos os usuários da plataforma.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
          <CardDescription>
            {isLoading ? 'Carregando usuários...' : `Total de ${users?.length || 0} usuários.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Avatar</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>ID do Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`} />
                        <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name || 'Não informado'}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.id}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-dashed">
                <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    