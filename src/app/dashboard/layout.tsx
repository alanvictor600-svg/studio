
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { User, LotteryConfig, Ticket } from '@/types';
import Link from 'next/link';

import { 
    Sidebar, 
    SidebarProvider, 
    SidebarTrigger, 
    SidebarContent, 
    SidebarHeader, 
    SidebarFooter, 
    SidebarMenu, 
    SidebarMenuItem, 
    SidebarMenuButton, 
    SidebarInset 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Coins, Ticket as TicketIcon, Home, User as UserIcon, FileText, ShoppingBag, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart } from '@/components/shopping-cart';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

// Props passed down from the page to the layout
interface DashboardPageProps {
  cart: number[][];
  setCart: React.Dispatch<React.SetStateAction<number[][]>>;
  currentUser: User | null;
  lotteryConfig: LotteryConfig;
  isSubmitting: boolean;
  handlePurchaseCart: () => Promise<void>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, logout, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pageProps = children.props.children.props as DashboardPageProps;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=' + pathname);
    }
  }, [isLoading, isAuthenticated, router, pathname]);


  if (isLoading || !isAuthenticated || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <p className="text-foreground text-xl">Verificando sessão...</p>
      </div>
    );
  }
  
  if (currentUser.role !== 'cliente' && currentUser.role !== 'vendedor') {
      router.replace('/login');
      return (
         <div className="flex justify-center items-center min-h-screen bg-background">
            <p className="text-foreground text-xl">Acesso negado. Redirecionando...</p>
        </div>
      );
  }

  const isSeller = currentUser.role === 'vendedor';
  const dashboardPath = `/dashboard/${currentUser.role}`;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3">
             <Image src="/logo.png" alt="Logo Bolão Potiguar" width={40} height={40} />
             <div className="flex flex-col">
                <span className="text-lg font-semibold text-sidebar-primary">Bolão Potiguar</span>
                <span className="text-xs text-sidebar-foreground/80 -mt-1">
                  Painel de {currentUser.role === 'cliente' ? 'Cliente' : 'Vendedor'}
                </span>
             </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
            <div className="mb-4 p-3 rounded-lg bg-sidebar-accent/50 text-sidebar-accent-foreground">
                <div className="text-sm font-medium">Bem-vindo(a)!</div>
                <div className="text-lg font-bold flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        <AvatarFallback>{currentUser.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{currentUser.username}</span>
                </div>
                <Separator className="my-2 bg-sidebar-border" />
                <div className="text-sm font-medium">Seu Saldo:</div>
                <div className="text-2xl font-bold text-yellow-400 flex items-center gap-1.5">
                    <Coins size={22} />
                    <span>R$ {(currentUser.saldo || 0).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>

            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === dashboardPath}>
                        <Link href={dashboardPath}>
                            <LayoutDashboard />
                            Meu Painel
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 
                <SidebarMenuItem>
                    <SidebarMenuButton asChild variant="secondary" className="bg-green-500/80 text-white hover:bg-green-600/90 font-semibold text-base h-12">
                         <Link href="/solicitar-saldo">
                            <Coins className="mr-2 h-5 w-5" /> Adquirir Saldo
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild variant="ghost">
                        <Link href="/">
                            <Home /> Página Inicial
                        </Link>
                    </SidebarMenuButton>
                 </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton onClick={logout} variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <LogOut /> Sair da Conta
                    </SidebarMenuButton>
                 </SidebarMenuItem>
            </SidebarMenu>
            <div className="flex items-center justify-end p-2">
                <ThemeToggleButton />
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-10">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <span className="font-semibold text-primary hidden md:block">{currentUser.role === 'cliente' ? 'Painel do Cliente' : 'Painel do Vendedor'}</span>
            <div className="flex items-center gap-4 ml-auto">
                {currentUser.role === 'cliente' && (
                    <ShoppingCart 
                        cart={pageProps.cart}
                        currentUser={pageProps.currentUser}
                        lotteryConfig={pageProps.lotteryConfig}
                        isSubmitting={pageProps.isSubmitting}
                        onPurchase={pageProps.handlePurchaseCart}
                        onRemoveFromCart={(index) => pageProps.setCart(pageProps.cart.filter((_, i) => i !== index))}
                    />
                )}
                <ThemeToggleButton />
            </div>
        </header>
        <div className="p-4 md:p-8">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
