'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart2,
  BrainCircuit,
  ClipboardList,
  FileText,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Settings,
  User as UserIcon,
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
import { signOut } from 'firebase/auth';
import { useFirebase } from '@/firebase/provider';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuItems = [
  { href: '/mentorlite', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/mentorlite/questions', icon: ClipboardList, label: 'Questões' },
  { href: '/mentorlite/simulated-exams', icon: FileText, label: 'Simulados' },
  { href: '/mentorlite/flashcards', icon: Layers, label: 'Flashcards' },
  { href: '/mentorlite/analytics', icon: BarChart2, label: 'Estatísticas' },
  { href: '/mentorlite/study-plan', icon: BrainCircuit, label: 'Plano de Estudo IA' },
  {
    href: '/mentorlite/management',
    icon: Settings,
    label: 'Gerenciamento',
  },
];

function MainSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center h-full">
          <Link
            href="/mentorlite"
            className={cn(
              'font-bold text-accent text-lg transition-opacity duration-200',
              isMounted && state === 'collapsed' ? 'opacity-0' : 'opacity-100'
            )}
          >
            Mentor Lite
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map(item => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={{ children: item.label }}>
                <Link href={item.href} target={(item as any).target}>
                  <item.icon />
                  <span
                    className={cn(
                      'transition-opacity duration-200',
                      state === 'collapsed' ? 'opacity-0' : 'opacity-100'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  );
}

function UserNav() {
  const { user } = useUser();
  const { auth } = useFirebase();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  if (!user) {
    return null;
  }

  const userDisplayName = user.isAnonymous ? 'Usuário Anônimo' : user.displayName ?? 'Concurseiro';
  const userDisplayEmail = user.isAnonymous ? 'Login anônimo' : user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 flex items-center justify-start gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? undefined} />
            <AvatarFallback>{userDisplayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="hidden md:block font-medium">{userDisplayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{userDisplayEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
            <UserNav />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <Home className="size-5" />
                <span className="sr-only">Página Inicial</span>
              </Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
