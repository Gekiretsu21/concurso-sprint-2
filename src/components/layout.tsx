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

const menuItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/questions', icon: ClipboardList, label: 'Questões' },
  { href: '/simulated-exams', icon: FileText, label: 'Simulados' },
  { href: '/flashcards', icon: Layers, label: 'Flashcards' },
  { href: '/analytics', icon: BarChart2, label: 'Estatísticas' },
  { href: '/study-plan', icon: BrainCircuit, label: 'Plano de Estudo IA' },
];

function MainSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar');

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <GraduationCap className="text-primary" />
            </Link>
          </Button>
          <h1
            className={cn(
              'text-xl font-semibold text-accent transition-opacity duration-200 truncate',
              state === 'collapsed' ? 'opacity-0' : 'opacity-100'
            )}
          >
            Mentoria Academy
          </h1>
        </div>
        <SidebarTrigger className="hidden md:flex" />
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
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3">
          <Avatar>
            {userAvatar && <AvatarImage src={userAvatar.imageUrl} data-ai-hint={userAvatar.imageHint} />}
            <AvatarFallback>CS</AvatarFallback>
          </Avatar>
          <div
            className={cn(
              'flex flex-col transition-opacity duration-200',
              state === 'collapsed' ? 'opacity-0' : 'opacity-100'
            )}
          >
            <p className="text-sm font-medium text-sidebar-foreground">Concurseiro</p>
            <p className="text-xs text-sidebar-foreground/70">Plano Pro</p>
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
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Can add breadcrumbs or page title here */}
          </div>
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
