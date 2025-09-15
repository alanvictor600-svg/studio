
"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import type { User, LotteryConfig, Ticket, Draw } from '@/types';

import { SellerDashboard } from '@/components/seller-dashboard';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

export default function SellerPage() {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [isLotteryPaused, setIsLotteryPaused] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [allDraws, setAllDraws] = useState<Draw[]>([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'vendedor') {
      if (!isLoading) setIsDataLoading(false);
      return;
    }
    
    setIsDataLoading(true);

    const configDocRef = doc(db, 'configs', 'global');
    const unsubscribeConfig = onSnapshot(configDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setLotteryConfig({
          ticketPrice: data.ticketPrice || DEFAULT_LOTTERY_CONFIG.ticketPrice,
          sellerCommissionPercentage: data.sellerCommissionPercentage || DEFAULT_LOTTERY_CONFIG.sellerCommissionPercentage,
          ownerCommissionPercentage: data.ownerCommissionPercentage || DEFAULT_LOTTERY_CONFIG.ownerCommissionPercentage,
          clientSalesCommissionToOwnerPercentage: data.clientSalesCommissionToOwnerPercentage || DEFAULT_LOTTERY_CONFIG.clientSalesCommissionToOwnerPercentage,
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
      
      const allTicketsQuery = query(collection(db, 'tickets'));
      onSnapshot(allTicketsQuery, (allTicketsSnapshot) => {
        const allTicketsData = allTicketsSnapshot.docs.map(t => ({ id: t.id, ...t.data() } as Ticket));
        const processedTickets = updateTicketStatusesBasedOnDraws(allTicketsData, drawsData);
        const hasWinningTickets = processedTickets.some(t => t.status === 'winning');
        setIsLotteryPaused(hasWinningTickets);
      });

    }, (error) => {
      console.error("Error fetching draws for pause check: ", error);
    });

    const ticketsQuery = query(
        collection(db, 'tickets'), 
        where('sellerId', '==', currentUser.id)
    );
      
    const unsubscribeTickets = onSnapshot(ticketsQuery, (ticketSnapshot) => {
        const userTicketsData = ticketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
        const sortedTickets = userTicketsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setUserTickets(sortedTickets);
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

  }, [currentUser, isLoading, toast]);
  
  const processedUserTickets = updateTicketStatusesBasedOnDraws(userTickets, allDraws);

  if (isLoading || isDataLoading) {
    return <div className="text-center p-10">Carregando dados do vendedor...</div>;
  }

  if (!isAuthenticated || !currentUser) {
    return <div className="text-center p-10">Você precisa estar logado para ver esta página.</div>;
  }
  
  if (currentUser.role !== 'vendedor') {
    return <div className="text-center p-10">Acesso negado. Você não tem permissão para ver este painel.</div>
  }

  const handleTicketCreated = (newTicket: Ticket) => {
    setUserTickets(prevTickets => [newTicket, ...prevTickets]);
  };

  return (
    <SellerDashboard
      isLotteryPaused={isLotteryPaused}
      lotteryConfig={lotteryConfig}
      onTicketCreated={handleTicketCreated}
      userTickets={processedUserTickets}
      currentUser={currentUser}
      allDraws={allDraws}
    />
  );
}
