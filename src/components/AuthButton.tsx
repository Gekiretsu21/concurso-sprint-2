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
import { LogIn, LogOut, User as UserIcon, Newspaper } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import Link from 'next/link';

export function AuthButton() {
  const { auth } = useFirebase();
  const { user, isUserLoading } = useUser();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      if (auth) {
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      // Don't log an error if the user just cancels the popup.
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }
      console.error('Error signing in with Google: ', error);
    }
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (isUserLoading) {
    return (
        <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 hidden md:block" />
            <Skeleton className="h-9 w-9 rounded-full" />
        </div>
    );
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
            className="relative h-10 flex items-center justify-end gap-2 p-0 md:px-2 md:py-1 hover:bg-transparent text-primary-foreground hover:text-primary-foreground/80"
          >
            <span className="hidden md:block font-medium text-sm">
              {firstName}
            </span>
             <Avatar className="h-9 w-9">
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
          <DropdownMenuItem asChild>
             <Link href="/mentorlite/feed">
                <Newspaper className="mr-2 h-4 w-4" />
                <span>Feed de Notícias</span>
             </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/mentorlite">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Meu Painel</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="secondary" onClick={handleGoogleLogin}>
        <LogIn className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Entrar com Google</span>
        <span className="sm:hidden">Entrar</span>
    </Button>
  );
}
