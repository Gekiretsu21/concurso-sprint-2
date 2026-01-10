'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BrainCircuit,
  ClipboardList,
  FileText,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  User as UserIcon,
  Crown,
  Lock,
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
import { useUser } from '@/firebase';
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
import { signOut } from 'firebase/auth';
import { useStudyTimeTracker } from '@/hooks/use-study-time-tracker';
import { PremiumFeature } from './PremiumFeature';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';


const menuItems = [
  { href: '/mentorlite', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/mentorlite/questions', icon: ClipboardList, label: 'Questões' },
  { href: '/mentorlite/simulados', icon: Shield, label: 'Simulados'},
  { href: '/mentorlite/previous-exams', icon: FileText, label: 'Provas Anteriores' },
  { href: '/mentorlite/flashcards', icon: Layers, label: 'Flashcards' },
  { href: '/mentorlite/study-plan', icon: BrainCircuit, label: 'Plano de Estudo IA' },
];

const vipMenuItem = {
  href: '/mentorlite/arsenal-vip',
  icon: Crown,
  label: 'Arsenal VIP',
};

const adminMenuItem = {
  href: '/mentorlite/management',
  icon: Settings,
  label: 'Gerenciamento',
};

function MainSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = user?.email === 'amentoriaacademy@gmail.com';
  
  const allMenuItems = [...menuItems];
  if (isAdmin) {
    if (!allMenuItems.find(item => item.href === adminMenuItem.href)) {
      allMenuItems.push(adminMenuItem);
    }
  }


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
          {allMenuItems.map(item => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={{ children: item.label }}>
                  <Link href={item.href}>
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
           <SidebarMenuItem>
            <PremiumFeature
              fallback={
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SidebarMenuButton
                              isActive={pathname === vipMenuItem.href}
                              tooltip={{ children: 'Conteúdo VIP para assinantes Plus' }}
                              className="text-amber-500/70 hover:text-amber-500"
                              disabled
                            >
                              <Lock />
                              <span className={cn('transition-opacity duration-200', state === 'collapsed' ? 'opacity-0' : 'opacity-100')}>
                                {vipMenuItem.label}
                              </span>
                            </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" align="center">
                          Exclusivo para MentorIA+
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              }
            >
              <SidebarMenuButton
                asChild
                isActive={pathname === vipMenuItem.href}
                tooltip={{ children: vipMenuItem.label }}
                className="text-amber-500 hover:bg-amber-500/10 hover:text-amber-500"
              >
                <Link href={vipMenuItem.href}>
                  <vipMenuItem.icon />
                  <span className={cn('transition-opacity duration-200', state === 'collapsed' ? 'opacity-0' : 'opacity-100')}>
                    {vipMenuItem.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </PremiumFeature>
          </SidebarMenuItem>
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

  if (!user) {
    return null;
  }
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const getFirstName = (displayName: string | null) => {
    if (!displayName) return 'Concurseiro';
    return displayName.split(' ')[0];
  };

  const firstName = user.isAnonymous ? 'Anônimo' : getFirstName(user.displayName);
  const userDisplayName = user.isAnonymous ? 'Usuário Anônimo' : user.displayName ?? 'Concurseiro';
  const userDisplayEmail = user.isAnonymous ? 'Login anônimo' : user.email;

  return (
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-4 cursor-pointer">
            <span className="hidden md:block font-medium text-sm text-foreground">
                Bem-vindo, {firstName}
            </span>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL ?? undefined} />
              <AvatarFallback>{firstName.charAt(0)}</AvatarFallback>
            </Avatar>
        </div>
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
  const { user } = useUser();
  useStudyTimeTracker(user?.uid);

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
          <SidebarTrigger className="block" />
          <div className="flex-1" />
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <Home className="size-5" />
                <span className="sr-only">Página Inicial</span>
              </Link>
            </Button>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
