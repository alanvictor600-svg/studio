// src/lib/services/googleSheetsService.ts
'use server';

import { google } from 'googleapis';
import type { Ticket } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Esta função garante que a chave privada, que pode vir com quebras de linha `\n`, seja formatada corretamente.
const formatPrivateKey = (key: string | undefined) => {
    if (!key) {
        return undefined;
    }
    return key.replace(/\\n/g, '\n');
};

const getGoogleSheetsClient = () => {
    console.log("Tentando obter o cliente do Google Sheets...");

    const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    };

    if (!credentials.client_email || !credentials.private_key) {
        // Log detalhado para depuração
        console.error("Erro Crítico: Credenciais do Google Sheets não configuradas nas variáveis de ambiente.");
        console.log("GOOGLE_CLIENT_EMAIL está definido?", !!process.env.GOOGLE_CLIENT_EMAIL);
        console.log("GOOGLE_PRIVATE_KEY está definido?", !!process.env.GOOGLE_PRIVATE_KEY);
        return null;
    }

    console.log("Credenciais encontradas. Configurando autenticação JWT...");

    const auth = new google.auth.JWT(
        credentials.client_email,
        undefined,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
    );

    return google.sheets({ version: 'v4', auth });
};

export const appendTicketToSheet = async (ticket: Ticket) => {
    console.log(`Iniciando appendTicketToSheet para o bilhete ID: ${ticket.id}`);
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!sheets) {
        console.error('Falha ao obter o cliente do Google Sheets. A função será interrompida.');
        return;
    }
    if(!spreadsheetId) {
        console.error('Erro Crítico: GOOGLE_SHEET_ID não está definido nas variáveis de ambiente. A função será interrompida.');
        return;
    }

    console.log(`Pronto para enviar dados para a planilha ID: ${spreadsheetId}`);

    // Formata os dados do bilhete para o formato da planilha
    const rowData = [
        format(parseISO(ticket.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
        ticket.id,
        ticket.buyerName || '',
        ticket.sellerUsername || 'Cliente (App)',
        ...ticket.numbers, // Adiciona os 10 números do bilhete
        ticket.status,
    ];

    try {
        console.log("Enviando dados para a API do Google Sheets...");
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Bilhetes!A:A', // Nome da aba!Coluna para iniciar. 'A:A' faz o append na primeira linha vazia.
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });
        console.log(`Sucesso! Bilhete ID: ${ticket.id} adicionado à planilha.`);
    } catch (error) {
        // Log de erro MUITO mais detalhado
        console.error('ERRO AO ADICIONAR LINHA NO GOOGLE SHEETS:');
        console.error('============================================');
        console.error('Mensagem de Erro:', (error as Error).message);
        console.error('Objeto de Erro Completo:', JSON.stringify(error, null, 2));
        console.error('============================================');
        // Novamente, não lançamos o erro para não impactar o usuário.
        // O ideal aqui seria registrar esse erro em um sistema de logs.
    }
};
