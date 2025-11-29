
"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useRef, useEffect } from 'react';
import type { LotteryConfig, User, Ticket, Draw } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createClientTicketsAction } from '@/app/actions/ticket';
import { doc, onSnapshot, collection, query, where, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { v4 as uuidv4 } from 'uuid';

interface DashboardContextType {
    cart: number[][];
    setCart: Dispatch<SetStateAction<number[][]>>;
    isSubmitting: boolean;
    lotteryConfig: LotteryConfig;
    handlePurchaseCart: () => Promise<void>;
    
    // Dialog control
    isCreditsDialogOpen: boolean;
    showCreditsDialog: () => void;
    
    receiptTickets: Ticket[] | null;
    setReceiptTickets: Dispatch<SetStateAction<Ticket[] | null>>;
    
    // Centralized data
    userTickets: Ticket[];
    allDraws: Draw[];
    isLotteryPaused: boolean;
    isDataLoading: boolean;
    startDataListeners: (user: User) => () => void;
    handleGenerateReceipt: (ticket: Ticket) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
  configVersion: 1
};

export const DashboardProvider = ({ children, user }: { children: ReactNode, user: User }) => {
    const [cart, setCart] = useState<number[][]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const { toast } = useToast();

    const [userTickets, setUserTickets] = useState<Ticket[]>([]);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isLotteryPaused, setIsLotteryPaused] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    
    const lastConfigVersion = useRef<number | undefined>(lotteryConfig.configVersion);

    useEffect(() => {
        if (lotteryConfig.configVersion && lastConfigVersion.current && lotteryConfig.configVersion > lastConfigVersion.current) {
            toast({
                title: "Atualização Disponível!",
                description: "Novas configurações do bolão foram aplicadas. A página será recarregada.",
                duration: 5000,
            });
            setTimeout(() => window.location.reload(), 3000);
        }
        lastConfigVersion.current = lotteryConfig.configVersion;
    }, [lotteryConfig.configVersion, toast]);

    const startDataListeners = useCallback((user: User): () => void => {
        setIsDataLoading(true);
        let loadedCount = 0;
        const totalListeners = 3;

        const checkAllDataLoaded = () => {
            loadedCount++;
            if (loadedCount >= totalListeners) {
                setIsDataLoading(false);
            }
        };

        const configDocRef = doc(db, 'configs', 'global');
        const configUnsub = onSnapshot(configDocRef, (configDoc) => {
            setLotteryConfig(prev => ({ ...prev, ...(configDoc.data() as LotteryConfig) }));
            checkAllDataLoaded();
        }, () => checkAllDataLoaded());

        const drawsQuery = query(collection(db, 'draws'));
        const drawsUnsub = onSnapshot(drawsQuery, (drawsSnapshot) => {
            setAllDraws(drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw)));
            checkAllDataLoaded();
        }, () => checkAllDataLoaded());

        const idField = user.role === 'cliente' ? 'buyerId' : 'sellerId';
        const ticketsQuery = query(collection(db, 'tickets'), where(idField, '==', user.id));
        const ticketsUnsub = onSnapshot(ticketsQuery, (ticketSnapshot) => {
            setUserTickets(ticketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            checkAllDataLoaded();
        }, () => checkAllDataLoaded());

        const allUnsubscribes = [configUnsub, drawsUnsub, ticketsUnsub];
        return () => allUnsubscribes.forEach(unsub => unsub());
    }, []);

    useEffect(() => {
        const cleanup = startDataListeners(user);
        return cleanup;
    }, [user, startDataListeners]);

    useEffect(() => {
        const hasWinningTickets = userTickets.some(t => t.status === 'winning');
        setIsLotteryPaused(hasWinningTickets);
    }, [userTickets]);

    const showCreditsDialog = useCallback(() => setIsCreditsDialogOpen(true), []);
    const handleGenerateReceipt = useCallback((ticket: Ticket) => setReceiptTickets([ticket]), []);

    const handlePurchaseCart = async () => {
        if (cart.length === 0) {
            toast({ title: "Carrinho Vazio", variant: "destructive" });
            return;
        }
        if (isDataLoading) {
            toast({ title: "Aguarde", description: "Os dados da loteria ainda estão carregando.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await createClientTicketsAction({ user: { id: user.id, username: user.username }, cart });

            const ticketsForReceipt: Ticket[] = cart.map(numbers => ({
                id: uuidv4(),
                numbers,
                status: 'active',
                createdAt: new Date().toISOString(),
                buyerName: user.username,
                buyerId: user.id,
            }));

            setCart([]);
            setReceiptTickets(ticketsForReceipt);
            toast({
              title: "Compra Realizada!",
              description: `Sua compra de ${ticketsForReceipt.length} bilhete(s) foi um sucesso.`,
              className: "bg-primary text-primary-foreground",
              duration: 4000
            });
        } catch (e: any) {
            if (e.message.includes("Saldo insuficiente")) {
                showCreditsDialog();
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
        lotteryConfig,
        handlePurchaseCart,
        isCreditsDialogOpen,
        setIsCreditsDialogOpen,
        showCreditsDialog,
        receiptTickets,
        setReceiptTickets,
        userTickets,
        allDraws,
        isLotteryPaused,
        isDataLoading,
        startDataListeners,
        handleGenerateReceipt,
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
