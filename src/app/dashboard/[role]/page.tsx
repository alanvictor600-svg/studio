
"use client";

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import type { User, LotteryConfig, Ticket, Draw } from '@/types';

import { TicketSelectionForm } from '@/components/ticket-selection-form';
import { SellerDashboard } from '@/components/seller-dashboard';
import { TicketList } from '@/components/ticket-list';
import { doc, onSnapshot, collection, query, where, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket as TicketIcon, ShoppingBag, Repeat } from 'lucide-react';
import { useDashboard } from '@/context/dashboard-context';


// O provedor foi movido para o layout.
// Esta página agora apenas consome o contexto.
export default function DashboardPage() {
  const params = useParams();
  const { role } = params as { role: 'cliente' | 'vendedor' };
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
      cart,
      setCart,
      isSubmitting,
      setLotteryConfig,
      lotteryConfig,
  } = useDashboard();
  
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [isLotteryPaused, setIsLotteryPaused] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [allDraws, setAllDraws] = useState<Draw[]>([]);
  const [activeTab, setActiveTab] = useState('aposta');
  
  const [ticketToRebet, setTicketToRebet] = useState<number[] | null>(null);
  

  // Validate the role from the URL
  useEffect(() => {
    if (role !== 'cliente' && role !== 'vendedor') {
      notFound();
    }
  }, [role]);
  
  // Effect to handle re-betting logic
  useEffect(() => {
    if (ticketToRebet) {
      setCart(prevCart => [...prevCart, ticketToRebet]);
      setTicketToRebet(null); // Reset after adding to cart
      setActiveTab('aposta');
       toast({
        title: "Bilhete adicionado ao carrinho!",
        description: "A aposta selecionada está pronta para ser comprada novamente.",
        duration: 4000
      });
    }
  }, [ticketToRebet, toast, setCart]);

  // Main data fetching and real-time listeners effect
  useEffect(() => {
    if (!currentUser || currentUser.role !== role) {
      if(!isLoading) setIsDataLoading(false);
      return;
    }
    
    setIsDataLoading(true);

    const configDocRef = doc(db, 'configs', 'global');
    const unsubscribeConfig = onSnapshot(configDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLotteryConfig({
          ticketPrice: data.ticketPrice || 2, // Default value
          sellerCommissionPercentage: data.sellerCommissionPercentage || 10,
          ownerCommissionPercentage: data.ownerCommissionPercentage || 5,
          clientSalesCommissionToOwnerPercentage: data.clientSalesCommissionToOwnerPercentage || 10,
        });
      }
    }, (error) => {
      console.error("Error fetching lottery config: ", error);
      toast({ title: "Erro de Configuração", description: "Não foi possível carregar as configurações da loteria.", variant: "destructive" });
    });

    const drawsQuery = query(collection(db, 'draws'));
    const unsubscribeDraws = onSnapshot(drawsQuery, (drawsSnapshot) => {
      const drawsData = drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw));
      setAllDraws(drawsData);
      
      // Vendas são pausadas assim que o primeiro sorteio é cadastrado.
      setIsLotteryPaused(drawsData.length > 0);

    }, (error) => {
      console.error("Error fetching draws for pause check: ", error);
    });

    const idField = role === 'cliente' ? 'buyerId' : 'sellerId';
    const ticketsQuery = query(
        collection(db, 'tickets'), 
        where(idField, '==', currentUser.id),
    );
      
    const unsubscribeTickets = onSnapshot(ticketsQuery, (ticketSnapshot) => {
        const userTicketsData = ticketSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Ticket))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setUserTickets(userTicketsData);
        setIsDataLoading(false);
    }, (error) => {
        console.error("Error fetching user tickets: ", error);
        toast({ title: "Erro ao Carregar Bilhetes", description: "Não foi possível carregar seus bilhetes.", variant: "destructive" });
        setIsDataLoading(false);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeDraws();
      unsubscribeTickets();
    };

  }, [currentUser, role, toast, isLoading, setLotteryConfig]);

  const processedUserTickets = updateTicketStatusesBasedOnDraws(userTickets, allDraws);

  if (isLoading || isDataLoading) {
    return <div className="text-center p-10">Carregando dados do painel...</div>;
  }

  if (!isAuthenticated || !currentUser) {
    router.replace('/login?redirect=/dashboard/' + role);
    return <div className="text-center p-10">Você precisa estar logado para ver esta página. Redirecionando...</div>;
  }
  
  if (currentUser.role !== role) {
    return <div className="text-center p-10">Acesso negado. Você não tem permissão para ver este painel.</div>
  }

  const handleTicketCreated = (newTicket: Ticket) => {
    // The onSnapshot listener will handle the update automatically.
  };

  const handleRebet = (numbers: number[]) => {
    setTicketToRebet(numbers);
  };
  
  return (
    <>
    <div className="space-y-12">
      <header>
          <h1 className="text-4xl md:text-5xl font-extrabold text-primary tracking-tight text-center">
            {role === 'cliente' ? 'Bem-vindo, Apostador!' : 'Painel do Vendedor'}
          </h1>
          <p className="text-lg text-muted-foreground mt-2 text-center">
             {role === 'cliente' ? 'Sua sorte começa aqui. Escolha seus números e boa sorte!' : 'Gerencie suas vendas e acompanhe seus resultados.'}
          </p>
      </header>
      
      {role === 'cliente' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto mb-8">
                <TabsTrigger value="aposta" className="py-3 text-base">
                    <TicketIcon className="mr-2 h-5 w-5" /> Fazer Aposta
                </TabsTrigger>
                <TabsTrigger value="bilhetes" className="py-3 text-base">
                    <ShoppingBag className="mr-2 h-5 w-5" /> Meus Bilhetes
                </TabsTrigger>
            </TabsList>
            <TabsContent value="aposta">
                 <TicketSelectionForm
                    isLotteryPaused={isLotteryPaused}
                    cart={cart}
                    onCartChange={setCart}
                    isSubmitting={isSubmitting}
                />
            </TabsContent>
            <TabsContent value="bilhetes">
                 <section>
                    <h2 className="text-2xl font-bold text-center text-primary mb-6">
                        Meus Bilhetes
                    </h2>
                    <TicketList tickets={processedUserTickets} draws={allDraws} onRebet={handleRebet} />
                </section>
            </TabsContent>
        </Tabs>
      )}

      {role === 'vendedor' && (
         <SellerDashboard 
            isLotteryPaused={isLotteryPaused}
            lotteryConfig={lotteryConfig}
            onTicketCreated={handleTicketCreated}
            userTickets={processedUserTickets}
            currentUser={currentUser}
            allDraws={allDraws}
         />
      )}
    </div>
    </>
  );
}
