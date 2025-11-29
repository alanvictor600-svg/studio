"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Ticket } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useClientDashboard } from '@/context/client-dashboard-context';

import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { TicketList } from '@/components/ticket-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket as TicketIcon, ShoppingCart } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { PauseCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClientePage() {
  const { currentUser } = useAuth();
  const {
    cart,
    setCart,
    isSubmitting,
    userTickets,
    allDraws,
    isLotteryPaused,
    handleGenerateReceipt,
  } = useClientDashboard();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('aposta');
  const [ticketToRebet, setTicketToRebet] = useState<number[] | null>(null);

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
  
  if (!currentUser) {
    // O layout já garante que o usuário está carregado,
    // mas isso previne qualquer erro de renderização caso algo mude.
    return null; 
  }

  const handleRebet = (numbers: number[]) => {
    setTicketToRebet(numbers);
  };

  const TABS_CONFIG = [
    { value: 'aposta', label: 'Fazer Aposta', Icon: TicketIcon },
    { value: 'bilhetes', label: 'Meus Bilhetes', Icon: ShoppingCart },
  ];

  return (
    <div className="space-y-12">
      <header>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 text-transparent bg-clip-text">
            Bem-vindo, Apostador!
          </h1>
          <p className="text-lg text-white/80 mt-2 text-center">
             Sua sorte começa aqui. Escolha seus números e boa sorte!
          </p>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-2 h-auto mb-8 bg-card p-1.5 rounded-lg shadow-md`}>
              {TABS_CONFIG.map(tab => (
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
                    tickets={userTickets} 
                    draws={allDraws} 
                    onRebet={handleRebet}
                    onGenerateReceipt={handleGenerateReceipt} 
                  />
              </section>
          </TabsContent>
      </Tabs>
    </div>
  );
}
