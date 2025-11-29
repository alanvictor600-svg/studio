
"use client";

import { useEffect, useState, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { Ticket } from '@/types';

import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { SellerDashboard } from '@/components/seller-dashboard';
import { TicketList } from '@/components/ticket-list';
import { useToast } from '@/hooks/use-toast';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket as TicketIcon, ShoppingCart } from 'lucide-react';
import { useDashboard } from '@/context/dashboard-context';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PauseCircle } from 'lucide-react';


export default function DashboardPage({ params }: { params: { role: 'cliente' | 'vendedor' } }) {
  const { role } = params;
  const { currentUser } = useAuth(); // Auth state is now managed by layout
  const { toast } = useToast();
  
  const {
      cart,
      setCart,
      isSubmitting,
      userTickets,
      allDraws,
      isLotteryPaused,
      isDataLoading,
      handleGenerateReceipt,
  } = useDashboard();
  
  const [activeTab, setActiveTab] = useState('aposta');
  const [ticketToRebet, setTicketToRebet] = useState<number[] | null>(null);
  
  useEffect(() => {
    if (role !== 'cliente' && role !== 'vendedor') {
      notFound();
    }
  }, [role]);
  
  useEffect(() => {
    if (ticketToRebet) {
      setCart(prevCart => [...prevCart, ticketToRebet]);
      setTicketToRebet(null); 
      setActiveTab('aposta');
       toast({
        title: "Bilhete adicionado ao carrinho!",
        description: "A aposta selecionada está pronta para ser comprada novamente.",
        duration: 4000
      });
    }
  }, [ticketToRebet, toast, setCart]);

  const processedUserTickets = useMemo(() => updateTicketStatusesBasedOnDraws(userTickets, allDraws), [userTickets, allDraws]);
  
  // The loading state is now handled by the layout, so this page will only render when data is ready.
  // We just need to ensure we have a currentUser before proceeding.
  if (!currentUser) {
    return <div className="text-center p-10 text-white">Carregando usuário...</div>;
  }

  const handleTicketCreated = (newTicket: Ticket) => {
    // onSnapshot listener in context handles the update.
  };

  const handleRebet = (numbers: number[]) => {
    setTicketToRebet(numbers);
  };
  
  const TABS_CONFIG = {
    cliente: [
      { value: 'aposta', label: 'Fazer Aposta', Icon: TicketIcon },
      { value: 'bilhetes', label: 'Meus Bilhetes', Icon: ShoppingCart },
    ],
  };

  const currentTabs = role === 'cliente' ? TABS_CONFIG.cliente : [];

  return (
    <div className="space-y-12">
      <header>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 text-transparent bg-clip-text">
            {role === 'cliente' ? 'Bem-vindo, Apostador!' : 'Painel do Vendedor'}
          </h1>
          <p className="text-lg text-white/80 mt-2 text-center">
             {role === 'cliente' ? 'Sua sorte começa aqui. Escolha seus números e boa sorte!' : 'Gerencie suas vendas e acompanhe seus resultados.'}
          </p>
      </header>
      
      {role === 'cliente' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full grid-cols-2 h-auto mb-8 bg-card p-1.5 rounded-lg shadow-md`}>
                {currentTabs.map(tab => (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value} 
                      className="py-2.5 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg transition-all duration-200"
                    >
                        <tab.Icon className="mr-2 h-5 w-5" /> {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            
            <TabsContent value="aposta">
                {isLotteryPaused ? (
                    <Alert variant="default" className="border-primary/50 bg-card/90 text-foreground max-w-2xl mx-auto">
                        <PauseCircle className="h-5 w-5 text-primary" />
                        <AlertTitle className="text-primary font-bold">Apostas Pausadas</AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                        O registro de novas apostas está suspenso.
                        Aguarde o administrador iniciar um novo ciclo para continuar apostando.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <TicketSelectionForm
                        cart={cart}
                        onCartChange={setCart}
                        isSubmitting={isSubmitting}
                    />
                )}
            </TabsContent>
            
            <TabsContent value="bilhetes">
                <section>
                    <h2 className="text-2xl font-bold text-center text-white mb-6">
                        Meus Bilhetes
                    </h2>
                    <TicketList 
                      tickets={processedUserTickets} 
                      draws={allDraws} 
                      onRebet={handleRebet}
                      onGenerateReceipt={handleGenerateReceipt} 
                    />
                </section>
            </TabsContent>
        </Tabs>
      )}

      {role === 'vendedor' && (
        <SellerDashboard 
            isLotteryPaused={isLotteryPaused}
            onTicketCreated={handleTicketCreated}
            userTickets={processedUserTickets}
            currentUser={currentUser}
            allDraws={allDraws}
        />
      )}
    </div>
  );
}
