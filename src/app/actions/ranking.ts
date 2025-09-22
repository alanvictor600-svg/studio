'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { Draw, Ticket } from '@/types';

// Helper to count occurrences of numbers
const countOccurrences = (arr: number[]): Record<number, number> => {
  return arr.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
};

export async function updatePublicRankingAction(): Promise<{ success: boolean; message: string; rankingCount: number }> {
    try {
        console.log('Iniciando a atualização do ranking público...');

        // 1. Get all current draws
        const drawsSnapshot = await adminDb.collection('draws').get();
        if (drawsSnapshot.empty) {
            await adminDb.doc('configs/publicRanking').set({ ranking: [] });
            console.log('Nenhum sorteio encontrado, ranking público limpo.');
            return { success: true, message: 'Nenhum sorteio encontrado, ranking público foi limpo.', rankingCount: 0 };
        }
        const allDraws = drawsSnapshot.docs.map(doc => doc.data() as Draw);
        const drawnNumbersFrequency = countOccurrences(allDraws.flatMap(draw => draw.numbers));
        console.log(`Encontrados ${allDraws.length} sorteios.`);


        // 2. Get all active tickets
        const ticketsSnapshot = await adminDb.collection('tickets').where('status', '==', 'active').get();
        const activeTickets = ticketsSnapshot.docs.map(doc => doc.data() as Ticket);
        console.log(`Encontrados ${activeTickets.length} bilhetes ativos.`);


        // 3. Calculate matches for each ticket
        const ticketsWithMatches = activeTickets.map((ticket) => {
            const ticketNumbersFrequency = countOccurrences(ticket.numbers);
            let matches = 0;
            
            for (const numStr in ticketNumbersFrequency) {
                const num = parseInt(numStr, 10);
                const countInTicket = ticketNumbersFrequency[num];
                const countInDraws = drawnNumbersFrequency[num] || 0;
                matches += Math.min(countInTicket, countInDraws);
            }
          
            return {
                ...ticket,
                matches,
            };
        });

        // 4. Sort all tickets by matches
        const sortedTickets = ticketsWithMatches.sort((a, b) => b.matches - a.matches);

        // 5. Create transparent data for public consumption
        const publicRanking = sortedTickets.map((ticket) => ({
            buyerName: ticket.buyerName || 'N/A',
            matches: ticket.matches,
            numbers: ticket.numbers,
            ticketId: ticket.id,
        }));
        console.log(`Ranking calculado com ${publicRanking.length} entradas.`);

        // 6. Save to a public-readable document
        await adminDb.doc('configs/publicRanking').set({
            ranking: publicRanking,
            lastUpdated: new Date().toISOString(),
        });

        const successMessage = `Ranking público atualizado com sucesso com ${publicRanking.length} entradas.`;
        console.log(successMessage);
        return { success: true, message: successMessage, rankingCount: publicRanking.length };

    } catch (error: any) {
        console.error('Erro ao atualizar o ranking público:', error);
        return { success: false, message: `Falha ao atualizar o ranking: ${error.message}`, rankingCount: 0 };
    }
}
