
"use client";

import { useState, type FC } from 'react';
import type { Ticket, LotteryConfig, User, Draw } from '@/types';
import { SellerTicketCreationForm } from '@/components/seller-ticket-creation-form';
import { TicketList } from '@/components/ticket-list';

interface SellerDashboardProps {
    isLotteryPaused?: boolean;
    lotteryConfig: LotteryConfig;
    onTicketCreated: (ticket: Ticket) => void;
    userTickets: Ticket[];
    currentUser: User | null;
    allDraws: Draw[];
}

export const SellerDashboard: FC<SellerDashboardProps> = ({ 
    isLotteryPaused,
    lotteryConfig,
    onTicketCreated,
    userTickets,
    currentUser,
    allDraws,
}) => {
    return (
        <div className="space-y-12">
            <SellerTicketCreationForm
                isLotteryPaused={isLotteryPaused}
                onTicketCreated={onTicketCreated}
                lotteryConfig={lotteryConfig}
            />
            <section>
                <h2 className="text-2xl font-bold text-center text-primary mb-6">
                    Meus Bilhetes Vendidos (Ciclo Atual)
                </h2>
                <TicketList tickets={userTickets} draws={allDraws} />
            </section>
        </div>
    );
};
