'use client';

import { useFirebase, useUser } from '@/firebase';
import { Button } from './ui/button';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { LogIn, LogOut, User as UserIcon, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { LoginDialog } from './LoginDialog';
import { useState } from 'react';

export function AuthButton() {
  const { auth } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google: ', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (isUserLoading) {
    return <Button variant="outline" disabled>Carregando...</Button>;
  }

  if (user) {
    const getFirstName = (displayName: string | null) => {
      if (!displayName) return 'Concurseiro';
      return displayName.split(' ')[0];
    };
    const firstName = user.isAnonymous
      ? 'Anônimo'
      : getFirstName(user.displayName);
    const userDisplayName =
      user.isAnonymous ? 'Usuário Anônimo' : user.displayName ?? 'Concurseiro';
    const userDisplayEmail = user.isAnonymous ? 'Login anônimo' : user.email;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 flex items-center justify-end gap-2"
          >
            <span className="hidden md:block font-medium">
              Bem-vindo, {firstName}
            </span>
             <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? undefined} />
              <AvatarFallback>{firstName.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {userDisplayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {userDisplayEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/mentorlite')}>
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Meu Painel</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button>
                Login
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Fazer Login</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsRegisterOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Crie sua conta</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleGoogleLogin}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.1 512 0 402 0 261.8 0 120.5 110.1 11.8 244 11.8c72.1 0 132.3 28.3 177.3 72.3L371.1 129.9c-39.2-37.2-94.2-62.3-157.1-62.3-120.3 0-217.9 97.9-217.9 219.8s97.6 219.8 217.9 219.8c123.3 0 203.2-85.3 209.6-180.5H244V261.8z"></path>
                </svg>
                <span>Entrar com Google</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LoginDialog
        isOpen={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        mode="login"
      />
      <LoginDialog
        isOpen={isRegisterOpen}
        onOpenChange={setIsRegisterOpen}
        mode="register"
      />
    </>
  );
}
