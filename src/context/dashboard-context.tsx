
"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import type { LotteryConfig, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, writeBatch, runTransaction, collection } from 'firebase/firestore';

interface DashboardContextType {
    cart: number[][];
    setCart: Dispatch<SetStateAction<number[][]>>;
    isSubmitting: boolean;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    lotteryConfig: LotteryConfig;
    setLotteryConfig: Dispatch<SetStateAction<LotteryConfig>>;
    handlePurchaseCart: () => Promise<void>;
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
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false); // Can be moved here if needed by other components
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
        const totalCost = cart.length * lotteryConfig.ticketPrice;

        try {
            const userRef = doc(db, "users", currentUser.id);
            const batch = writeBatch(db);

            cart.forEach(ticketNumbers => {
                const newTicketRef = doc(collection(db, "tickets"));
                const newTicketData = {
                    id: newTicketRef.id,
                    numbers: ticketNumbers.sort((a, b) => a - b),
                    status: 'active' as const,
                    createdAt: new Date().toISOString(),
                    buyerName: currentUser.username,
                    buyerId: currentUser.id,
                };
                batch.set(newTicketRef, newTicketData);
            });

            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw new Error("Usuário não encontrado.");
                
                const currentBalance = userDoc.data().saldo || 0;
                if (currentBalance < totalCost) throw new Error("Insufficient credits.");

                const newBalance = currentBalance - totalCost;
                transaction.update(userRef, { saldo: newBalance });
            });

            await batch.commit();

            updateCurrentUserCredits((currentUser.saldo || 0) - totalCost);
            
            toast({
                title: `Compra Realizada! (${cart.length} bilhete${cart.length > 1 ? 's' : ''})`,
                description: `Boa sorte! Seus bilhetes estão em "Meus Bilhetes".`,
                className: "bg-primary text-primary-foreground",
                duration: 4000
            });

            setCart([]);

        } catch (e: any) {
            console.error("Transaction failed: ", e);
            if (e.message === 'Insufficient credits.') {
                // This state should probably be managed here too if the dialog is global
                toast({ title: "Saldo Insuficiente", description: "Vá para a página de solicitar saldo.", variant: "destructive" });
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
        handlePurchaseCart
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
