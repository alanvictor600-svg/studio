
"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import type { LotteryConfig, User, Ticket } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { createClientTickets } from '@/lib/services/ticketService';

interface DashboardContextType {
    cart: number[][];
    setCart: Dispatch<SetStateAction<number[][]>>;
    isSubmitting: boolean;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    lotteryConfig: LotteryConfig;
    setLotteryConfig: Dispatch<SetStateAction<LotteryConfig>>;
    handlePurchaseCart: () => Promise<void>;
    isCreditsDialogOpen: boolean;
    setIsCreditsDialogOpen: Dispatch<SetStateAction<boolean>>;
    receiptTickets: Ticket[] | null;
    setReceiptTickets: Dispatch<SetStateAction<Ticket[] | null>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const [cart, setCart] = useState<number[][]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const { currentUser, updateCurrentUserCredits } = useAuth();
    const { toast } = useToast();

    const handlePurchaseCart = async () => {
        if (!currentUser) {
            toast({ title: "Erro", description: "Você precisa estar logado para comprar.", variant: "destructive" });
            return;
        }
        if (cart.length === 0) {
            toast({ title: "Carrinho Vazio", description: "Adicione pelo menos um bilhete ao carrinho para comprar.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        
        try {
            const { createdTickets, newBalance } = await createClientTickets({
                user: currentUser,
                cart,
                lotteryConfig
            });

            // If transaction is successful, update local state
            updateCurrentUserCredits(newBalance);
            setCart([]);
            setReceiptTickets(createdTickets); // Set tickets for receipt dialog

        } catch (e: any) {
            console.error("Transaction failed: ", e);
            if (e.message === "Insufficient credits.") {
                setIsCreditsDialogOpen(true);
            } else {
                toast({ title: "Erro na Compra", description: e.message || "Não foi possível registrar seus bilhetes.", variant: "destructive" });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const value = {
        cart,
        setCart,
        isSubmitting,
        setIsSubmitting,
        lotteryConfig,
        setLotteryConfig,
        handlePurchaseCart,
        isCreditsDialogOpen,
        setIsCreditsDialogOpen,
        receiptTickets,
        setReceiptTickets,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = (): DashboardContextType => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
