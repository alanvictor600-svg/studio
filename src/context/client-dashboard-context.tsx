"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import type { LotteryConfig, User, Ticket, Draw } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createClientTicketsAction } from '@/app/actions/ticket';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { v4 as uuidv4 } from 'uuid';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';

interface ClientDashboardContextType {
    cart: number[][];
    setCart: Dispatch<SetStateAction<number[][]>>;
    isSubmitting: boolean;
    lotteryConfig: LotteryConfig;
    handlePurchaseCart: () => Promise<void>;
    isCreditsDialogOpen: boolean;
    setIsCreditsDialogOpen: Dispatch<SetStateAction<boolean>>;
    receiptTickets: Ticket[] | null;
    setReceiptTickets: Dispatch<SetStateAction<Ticket[] | null>>;
    userTickets: Ticket[];
    allDraws: Draw[];
    isLotteryPaused: boolean;
    isDataLoading: boolean;
    handleGenerateReceipt: (ticket: Ticket) => void;
}

const ClientDashboardContext = createContext<ClientDashboardContextType | undefined>(undefined);

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
  configVersion: 1
};

export const ClientDashboardProvider = ({ children, user }: { children: ReactNode, user: User }) => {
    const [cart, setCart] = useState<number[][]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const { toast } = useToast();

    const [rawUserTickets, setRawUserTickets] = useState<Ticket[]>([]);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
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

    useEffect(() => {
        if (!user) return;

        setIsDataLoading(true);
        const listeners: (() => void)[] = [];
        let loadedCount = 0;
        const totalListeners = 3;

        const checkAllDataLoaded = () => {
            loadedCount++;
            if (loadedCount >= totalListeners) {
                setIsDataLoading(false);
            }
        };

        try {
            const configDocRef = doc(db, 'configs', 'global');
            const configUnsub = onSnapshot(configDocRef, (configDoc) => {
                if (configDoc.exists()) {
                    setLotteryConfig(prev => ({ ...prev, ...configDoc.data() }));
                }
                checkAllDataLoaded();
            }, () => {
                console.error("Failed to load config.");
                checkAllDataLoaded();
            });
            listeners.push(configUnsub);

            const drawsQuery = query(collection(db, 'draws'));
            const drawsUnsub = onSnapshot(drawsQuery, (drawsSnapshot) => {
                setAllDraws(drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw)));
                checkAllDataLoaded();
            }, () => {
                console.error("Failed to load draws.");
                checkAllDataLoaded();
            });
            listeners.push(drawsUnsub);
            
            const ticketsQuery = query(collection(db, 'tickets'), where('buyerId', '==', user.id));
            const ticketsUnsub = onSnapshot(ticketsQuery, (ticketSnapshot) => {
                setRawUserTickets(ticketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                checkAllDataLoaded();
            }, () => {
                console.error("Failed to load user tickets.");
                checkAllDataLoaded();
            });
            listeners.push(ticketsUnsub);

        } catch (error) {
            console.error("Error setting up Firestore listeners:", error);
            setIsDataLoading(false);
        }

        return () => {
            listeners.forEach(unsub => unsub());
        };
    }, [user]);

    const userTickets = useMemo(() => updateTicketStatusesBasedOnDraws(rawUserTickets, allDraws), [rawUserTickets, allDraws]);
    
    const isLotteryPaused = useMemo(() => {
        return userTickets.some(t => t.status === 'winning');
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
        receiptTickets,
        setReceiptTickets,
        userTickets,
        allDraws,
        isLotteryPaused,
        isDataLoading,
        handleGenerateReceipt,
    };

    return (
        <ClientDashboardContext.Provider value={value}>
            {children}
        </ClientDashboardContext.Provider>
    );
};

export const useClientDashboard = (): ClientDashboardContextType => {
    const context = useContext(ClientDashboardContext);
    if (context === undefined) {
        throw new Error('useClientDashboard must be used within a ClientDashboardProvider');
    }
    return context;
};
