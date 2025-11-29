"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import type { LotteryConfig, User, Ticket, Draw } from '@/types';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { useToast } from '@/hooks/use-toast';
import { InsufficientCreditsDialog } from '@/components/insufficient-credits-dialog'; // Import the dialog

interface SellerDashboardContextType {
    isSubmitting: boolean;
    lotteryConfig: LotteryConfig;
    receiptTickets: Ticket[] | null;
    setReceiptTickets: Dispatch<SetStateAction<Ticket[] | null>>;
    showCreditsDialog: () => void;
    userTickets: Ticket[];
    allDraws: Draw[];
    isLotteryPaused: boolean;
    isDataLoading: boolean;
    handleGenerateReceipt: (ticket: Ticket) => void;
}

const SellerDashboardContext = createContext<SellerDashboardContextType | undefined>(undefined);

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
  configVersion: 1
};

export const SellerDashboardProvider = ({ children, user }: { children: ReactNode, user: User }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
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
            
            const ticketsQuery = query(collection(db, 'tickets'), where('sellerId', '==', user.id));
            const ticketsUnsub = onSnapshot(ticketsQuery, (ticketSnapshot) => {
                setRawUserTickets(ticketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                checkAllDataLoaded();
            }, () => {
                console.error("Failed to load seller tickets.");
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

    const value = {
        isSubmitting,
        lotteryConfig,
        receiptTickets,
        setReceiptTickets,
        showCreditsDialog,
        userTickets,
        allDraws,
        isLotteryPaused,
        isDataLoading,
        handleGenerateReceipt
    };

    return (
        <SellerDashboardContext.Provider value={value}>
            {children}
            <InsufficientCreditsDialog
                isOpen={isCreditsDialogOpen}
                onOpenChange={setIsCreditsDialogOpen}
            />
        </SellerDashboardContext.Provider>
    );
};

export const useSellerDashboard = (): SellerDashboardContextType => {
    const context = useContext(SellerDashboardContext);
    if (context === undefined) {
        throw new Error('useSellerDashboard must be used within a SellerDashboardProvider');
    }
    return context;
};
