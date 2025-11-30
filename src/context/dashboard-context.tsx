"use client";

import { createContext, useContext, useState, ReactNode, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';
import type { LotteryConfig, User, Ticket, Draw, SellerHistoryEntry } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { createClientTicketsAction } from '@/app/actions/ticket';
import { doc, onSnapshot, collection, query, where, orderBy, getDocs, limit, startAfter, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase-client';
import { v4 as uuidv4 } from 'uuid';
import { updateTicketStatusesBasedOnDraws } from '@/lib/lottery-utils';
import { InsufficientCreditsDialog } from '@/components/insufficient-credits-dialog';

interface DashboardContextType {
    // Client states
    cart: number[][];
    setCart: Dispatch<SetStateAction<number[][]>>;
    handlePurchaseCart: () => Promise<void>;
    
    // Shared states
    isSubmitting: boolean;
    lotteryConfig: LotteryConfig;
    receiptTickets: Ticket[] | null;
    setReceiptTickets: Dispatch<SetStateAction<Ticket[] | null>>;
    userTickets: Ticket[];
    allDraws: Draw[];
    isLotteryPaused: boolean;
    isDataLoading: boolean;
    showCreditsDialog: () => void;
    handleGenerateReceipt: (ticket: Ticket) => void;
    
    // Seller states
    sellerHistory: SellerHistoryEntry[];
    isLoadingHistory: boolean;
    loadMoreHistory: () => void;
    hasMoreHistory: boolean;

    startDataListeners: (user: User) => () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const DEFAULT_LOTTERY_CONFIG: LotteryConfig = {
  ticketPrice: 2,
  sellerCommissionPercentage: 10,
  ownerCommissionPercentage: 5,
  clientSalesCommissionToOwnerPercentage: 10,
  configVersion: 1
};

const REPORTS_PER_PAGE = 9;

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    // Client states
    const [cart, setCart] = useState<number[][]>([]);
    
    // Shared states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lotteryConfig, setLotteryConfig] = useState<LotteryConfig>(DEFAULT_LOTTERY_CONFIG);
    const [receiptTickets, setReceiptTickets] = useState<Ticket[] | null>(null);
    const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
    const [rawUserTickets, setRawUserTickets] = useState<Ticket[]>([]);
    const [allDraws, setAllDraws] = useState<Draw[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const lastConfigVersion = useRef<number | undefined>(lotteryConfig.configVersion);
    const { toast } = useToast();

    // Seller states
    const [sellerHistory, setSellerHistory] = useState<SellerHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [lastVisibleHistory, setLastVisibleHistory] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMoreHistory, setHasMoreHistory] = useState(true);
    const activeUserRef = useRef<User | null>(null);

    // Reload on config change
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

    const startDataListeners = useCallback((user: User) => {
        if (activeUserRef.current?.id === user.id) {
            // Listeners are already running for this user
            setIsDataLoading(false);
            return () => {};
        }
        activeUserRef.current = user;

        setIsDataLoading(true);
        setIsLoadingHistory(true);
        const listeners: (() => void)[] = [];
        let loadedStatus = { config: false, draws: false, tickets: false, history: user.role !== 'vendedor' };

        const checkAllDataLoaded = () => {
            if (Object.values(loadedStatus).every(Boolean)) {
                setIsDataLoading(false);
            }
        };

        try {
            // Listener for global config
            const configDocRef = doc(db, 'configs', 'global');
            const configUnsub = onSnapshot(configDocRef, (configDoc) => {
                setLotteryConfig(prev => ({ ...prev, ...configDoc.data() }));
                loadedStatus.config = true;
                checkAllDataLoaded();
            }, () => { loadedStatus.config = true; checkAllDataLoaded(); });
            listeners.push(configUnsub);

            // Listener for draws
            const drawsQuery = query(collection(db, 'draws'));
            const drawsUnsub = onSnapshot(drawsQuery, (drawsSnapshot) => {
                setAllDraws(drawsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Draw)));
                loadedStatus.draws = true;
                checkAllDataLoaded();
            }, () => { loadedStatus.draws = true; checkAllDataLoaded(); });
            listeners.push(drawsUnsub);

            // Listener for user-specific tickets
            const idField = user.role === 'cliente' ? 'buyerId' : 'sellerId';
            const ticketsQuery = query(collection(db, 'tickets'), where(idField, '==', user.id));
            const ticketsUnsub = onSnapshot(ticketsQuery, (ticketSnapshot) => {
                setRawUserTickets(ticketSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                loadedStatus.tickets = true;
                checkAllDataLoaded();
            }, () => { loadedStatus.tickets = true; checkAllDataLoaded(); });
            listeners.push(ticketsUnsub);

            // Listener for seller history (only for sellers)
            if (user.role === 'vendedor') {
                const historyQuery = query(collection(db, 'sellerHistory'), where("sellerId", "==", user.id), orderBy("endDate", "desc"), limit(REPORTS_PER_PAGE));
                const historyUnsub = onSnapshot(historyQuery, (docSnaps) => {
                    const historyData = docSnaps.docs.map(d => ({ id: d.id, ...d.data() } as SellerHistoryEntry));
                    setSellerHistory(historyData);
                    setLastVisibleHistory(docSnaps.docs[docSnaps.docs.length - 1] || null);
                    setHasMoreHistory(historyData.length === REPORTS_PER_PAGE);
                    setIsLoadingHistory(false);
                    loadedStatus.history = true;
                    checkAllDataLoaded();
                }, () => { 
                    setIsLoadingHistory(false); 
                    loadedStatus.history = true;
                    checkAllDataLoaded();
                });
                listeners.push(historyUnsub);
            }

        } catch (error) {
            console.error("Error setting up Firestore listeners:", error);
            setIsDataLoading(false);
        }
        
        return () => {
            listeners.forEach(unsub => unsub());
            activeUserRef.current = null;
        };

    }, []);

    const userTickets = useMemo(() => updateTicketStatusesBasedOnDraws(rawUserTickets, allDraws), [rawUserTickets, allDraws]);
    
    const isLotteryPaused = useMemo(() => {
        return userTickets.some(t => t.status === 'winning');
    }, [userTickets]);
    
    const showCreditsDialog = useCallback(() => setIsCreditsDialogOpen(true), []);
    const handleGenerateReceipt = useCallback((ticket: Ticket) => setReceiptTickets([ticket]), []);

    const handlePurchaseCart = async () => {
        const user = auth.currentUser;
        if (!user) {
            toast({ title: "Usuário não encontrado", variant: "destructive" });
            return;
        }
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
            await createClientTicketsAction({ user: { id: user.id, username: user.displayName || 'Cliente' }, cart });

            const ticketsForReceipt: Ticket[] = cart.map(numbers => ({
                id: uuidv4(),
                numbers,
                status: 'active',
                createdAt: new Date().toISOString(),
                buyerName: user.displayName || 'Cliente',
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
    
    const loadMoreHistory = async () => {
        const user = auth.currentUser;
        if (!user || !activeUserRef.current || user.uid !== activeUserRef.current.id || !lastVisibleHistory) return;
        
        setIsLoadingHistory(true);
        const historyQuery = query(collection(db, 'sellerHistory'), where("sellerId", "==", user.uid), orderBy("endDate", "desc"), startAfter(lastVisibleHistory), limit(REPORTS_PER_PAGE));
        const docSnaps = await getDocs(historyQuery);
        const newHistory = docSnaps.docs.map(d => ({id: d.id, ...d.data()}) as SellerHistoryEntry);
        
        setSellerHistory(prev => [...prev, ...newHistory]);
        setLastVisibleHistory(docSnaps.docs[docSnaps.docs.length - 1] || null);
        setHasMoreHistory(newHistory.length === REPORTS_PER_PAGE);
        setIsLoadingHistory(false);
    }

    const value = {
        cart, setCart, handlePurchaseCart,
        isSubmitting, lotteryConfig, receiptTickets, setReceiptTickets,
        userTickets, allDraws, isLotteryPaused, isDataLoading,
        showCreditsDialog, handleGenerateReceipt,
        sellerHistory, isLoadingHistory, loadMoreHistory, hasMoreHistory,
        startDataListeners
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
            <InsufficientCreditsDialog isOpen={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen} />
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
