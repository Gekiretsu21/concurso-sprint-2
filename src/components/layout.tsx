'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  BrainCircuit,
  ClipboardList,
  FileText,
  Flame,
  Gift,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import { GoogleAuthProvider, signInAnonymously, signInWithPopup, signOut } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';
import { useEffect, useState } from 'react';

const menuItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/questions', icon: ClipboardList, label: 'Questões' },
  { href: '/simulated-exams', icon: FileText, label: 'Simulados' },
  { href: '/flashcards', icon: Layers, label: 'Flashcards' },
  { href: '/analytics', icon: BarChart2, label: 'Estatísticas' },
  { href: '/study-plan', icon: BrainCircuit, label: 'Plano de Estudo IA' },
  {
    href: '/management',
    icon: Settings,
    label: 'Gerenciamento',
  },
];

function AuthButton() {
    const { auth } = useFirebase();
    const { user } = useUser();

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google: ", error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    if (user) {
        return (
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
            </Button>
        );
    }

    return null;
}

function MainSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');
  const { auth } = useFirebase();
  const { state } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed: ", error);
      });
    }
  }, [auth, user]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center h-full">
          <Link href="/" className={cn("font-bold text-accent text-lg transition-opacity duration-200", isMounted && state === 'collapsed' ? 'opacity-0' : 'opacity-100')}>
            MENTOR LITE
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href} target={(item as any).target}>
                  <item.icon />
                  <span className={cn("transition-opacity duration-200", state === 'collapsed' ? 'opacity-0' : 'opacity-100')}>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <div className='pb-4'>
            <AuthButton />
        </div>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.photoURL ?? userAvatar?.imageUrl} data-ai-hint={userAvatar?.imageHint} />
            <AvatarFallback>{user?.isAnonymous ? 'A' : (user?.displayName?.charAt(0) ?? 'C')}</AvatarFallback>
          </Avatar>
          <div
            className={cn('flex flex-col transition-opacity duration-200', state === 'collapsed' ? 'opacity-0' : 'opacity-100')}
          >
            <p className="text-sm font-medium text-sidebar-foreground">{user?.isAnonymous ? 'Usuário Anônimo' : (user?.displayName ?? 'Concurseiro')}</p>
            <p className="text-xs text-sidebar-foreground/70">{user ? 'Usuário' : 'Plano Pro'}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
          <SidebarTrigger className="block" />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
                <Flame className="size-5 text-accent" />
                <span className="font-bold text-foreground">12 dias</span>
             </div>
             <Button variant="ghost" size="icon">
                <Gift className="size-5" />
                <span className="sr-only">Bônus</span>
             </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
