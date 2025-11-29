"use client";

import type { Ticket } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useSellerDashboard } from '@/context/seller-dashboard-context';

import { SellerDashboard } from '@/components/seller-dashboard';

export default function VendedorPage() {
  const { currentUser } = useAuth();
  const {
      userTickets,
      allDraws,
      isLotteryPaused,
  } = useSellerDashboard();

  if (!currentUser) {
    return null;
  }
  
  const handleTicketCreated = (newTicket: Ticket) => {
    // O onSnapshot no context já vai atualizar a lista, então nada precisa ser feito aqui.
  };

  return (
    <div className="space-y-12">
      <header>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 text-transparent bg-clip-text">
            Painel do Vendedor
          </h1>
          <p className="text-lg text-white/80 mt-2 text-center">
             Gerencie suas vendas e acompanhe seus resultados.
          </p>
      </header>

      <SellerDashboard 
            isLotteryPaused={isLotteryPaused}
            onTicketCreated={handleTicketCreated}
            userTickets={userTickets}
            currentUser={currentUser}
            allDraws={allDraws}
        />
    </div>
  );
}
