'use client';

import {
  useFirebase,
  useUser,
} from '@/firebase';
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
import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AuthButton() {
  const { auth } = useFirebase();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/mentorlite');
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
    const userDisplayName =
      user.isAnonymous ? 'Usuário Anônimo' : user.displayName ?? 'Concurseiro';
    const userDisplayEmail = user.isAnonymous ? 'Login anônimo' : user.email;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 flex items-center justify-start gap-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? undefined} />
              <AvatarFallback>{userDisplayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="hidden md:block font-medium">
              {userDisplayName}
            </span>
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
    <Button onClick={handleGoogleLogin}>
      Login com Google
    </Button>
  );
}
