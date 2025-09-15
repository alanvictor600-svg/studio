'use server';
/**
 * @fileOverview A server-side flow for securely purchasing lottery tickets.
 *
 * - buyTicket - A function that handles the ticket purchase process.
 * - BuyTicketInput - The input type for the buyTicket function.
 * - BuyTicketOutput - The return type for the buyTicket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getLotteryConfig} from '@/services/lottery-service';
import admin from 'firebase-admin';
import {getApps, initializeApp, cert} from 'firebase-admin/app';
import {getFirestore, Firestore} from 'firebase-admin/firestore';
import type {Ticket} from '@/types';

let db: Firestore;

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  try {
    // IMPORTANT: In a production environment, use environment variables or a secrets manager.
    // For this prototype, we are embedding the key directly to avoid parsing issues with .env files.
    const serviceAccount = {
      "type": "service_account",
      "project_id": "studio-19544357-e5b7b",
      "private_key_id": "b401ca6e4dab37bab354f5f1b10954a15d5ea4c2",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCl9agQCMZwLQoo\nU9fervoL6WfsVJl9wTi0Og2+len+G6/p1t3muSVDRnLQQmCc6OvjQ/D+m/a96TMW\nP5fa4/8KL4mWSwxh+q6F4le9rEc5IbA3wgxXR5qoELqsOnDhbcB5JnsaKRjfX06k\nxmQgQZbFioLSiOWuwJV8d47weF9rMDaJAqVoHXYobP4R5gc/X0jBIj0IYjO93ktH\nxhxx0mYn0Gf0RYH8/EvWf0SUwEM0vfhReTT5qKqp/WmHFosS99YcpZeveyXP+MfK\nH1jLINR76/a15zb/gT12d55qATt6Z5QpN8NDQf9F3VGW8BMXjCuCLLiFvwfQdiGV\nJdKPrDMdAgMBAAECggEACQ3S4mhBwALx1LgzEboE3qHlAongnQsg92wnYQHRJzgG\nRXQ5Q1bpR1Dp/wSjPEw7LXkabIZaISULNw6D6VqaiMkfiqyDe228S1LJRXBg3lp0\nWhMv4ZJNexfJwPWoDOEtwmF5qJ61wnhZOp7ilx2DU6ADE4G82uc0zWD0a/57lJLE\nZPMxvZltLIxuXg6GFgq210ZbcaHNWYK74VMy2sp+0OeI59yglQNEvb/KMyCvDiwj\nDtcjRc9R5+UbicXCO0uE7tV7Xlh9c49axMhYnif01DxCNo4MFbaiYqnUTniQpNXz\nKw0mVmRecrQMLvaeD8NnsVyrNSWTkv1t/os80evYPQKBgQDi/5ZxkCsNZtsQXaGJ\nq/UyEchjt3LxBMPqE0mM4lAwHG7qH9s4/9lxmbZYwxAKS6cRu48duV/yWgEHd6Oy\nfAi7+f91aN9oqA2BzoGYYnFz2/R3yuxwRrFVNMYrKX0L8Tt0/iuO/ftiawkAbEKV\nvnQ92qwMDRJ5Ed+2leCCXW34rwKBgQC7Ka3wgtEAm6ZtNC6oEOMLW8sgYzB9abiL\nrJVZrMSkNXTsUt3CUehJY3uNr1BvwJtuTHA7sw9cGrqCIa96GhStDGFTZEZ93zcw\nb4dtM7PgAKZP0XT3dLnY5gPV8//CfQeE9IXPoh6dJn1jUuNufDOXOH8Dx58sijCs\nyRTQUihr8wKBgQChyNH7rGnSymz1VBZOd1KyzvMPjJQrznGuepg2+eU8p7mhL/k\n9wyOF6TLzHLBM7wmOkw9PiKxAw7auJ1WF2rONtaoYo9f8u51hq384qTDk4/AVUOA\nnhHDjbJzjsVN3qemsYRwDHq/YVPwFji6qxwD/bdDe4mf+mo8osN5hodbhwKBgGVa\ngsk17jyoDY4hrgpxaqJiCTP2wvGHaNqqkQ5I0wwhrrmzfkeW13W2m9f0UljSMtme\nJ0ENDIpSJyIFX+N9cCjuBV6FdO8BC//8xZfLYeMyNt4OjYrb+TCODxGz2pLV5laH\nnFb+chmkGE7LOkJAnCeN/qprVbVm+Ej5c34En8MlAoGAQkZQSzYHdGZuzVUkh3IL\nFaK2CYelnoINdzIf7x2Y2Z4XuIS7Jb9gGOP6JfnrZoYYV4AjiNaPyqoD0AQmLqNj\ntoK8MplHoStTLej5lo1MeLIUsX8Duc2+Bx/FZvXAjRzcmCj3mKt8q79CYVC3y+gl\nXqC5X093ljQUTO8kvqI5H1Y=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
      "client_email": "firebase-adminsdk-fbsvc@studio-19544357-e5b7b.iam.gserviceaccount.com",
      "client_id": "103077689610030483479",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40studio-19544357-e5b7b.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };

    initializeApp({
        credential: cert(serviceAccount),
    });
    db = getFirestore();

  } catch (e) {
    console.error("Could not initialize Firebase Admin SDK. Service account key might be invalid.", e);
  }
} else {
    // If the app is already initialized, just get the firestore instance
    db = getFirestore();
}

const BuyTicketInputSchema = z.object({
  userId: z.string().describe('The ID of the user purchasing the ticket.'),
  numbers: z.array(z.number()).length(10).describe('An array of 10 numbers for the ticket.'),
  buyerName: z.string().describe('The name of the ticket buyer (can be the user or a customer for a seller).'),
  buyerPhone: z.string().optional().describe('The optional phone number of the buyer.'),
});
export type BuyTicketInput = z.infer<typeof BuyTicketInputSchema>;

const BuyTicketOutputSchema = z.object({
  success: z.boolean(),
  ticket: z.optional(z.custom<Ticket>()),
  newBalance: z.optional(z.number()),
  error: z.optional(z.string()),
});
export type BuyTicketOutput = z.infer<typeof BuyTicketOutputSchema>;

export async function buyTicket(input: BuyTicketInput): Promise<BuyTicketOutput> {
  return buyTicketFlow(input);
}

const buyTicketFlow = ai.defineFlow(
  {
    name: 'buyTicketFlow',
    inputSchema: BuyTicketInputSchema,
    outputSchema: BuyTicketOutputSchema,
  },
  async (input) => {
    // Ensure admin is initialized before proceeding
    if (!db) {
        return {
            success: false,
            error: "Firebase Admin SDK is not initialized. Check server configuration.",
        };
    }
      
    const lotteryConfig = getLotteryConfig(); // This is currently sync, reading from a static source.
    const ticketPrice = lotteryConfig.ticketPrice;
    
    const userRef = db.collection('users').doc(input.userId);

    try {
        const result = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                throw new Error("User not found.");
            }

            const userData = userDoc.data();
            const currentBalance = userData?.saldo || 0;

            if (currentBalance < ticketPrice) {
                throw new Error("Insufficient credits.");
            }
            
            const newBalance = currentBalance - ticketPrice;

            const newTicketRef = db.collection('tickets').doc();
            
            const newTicketData = {
                id: newTicketRef.id,
                numbers: input.numbers,
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                buyerName: input.buyerName,
                buyerPhone: input.buyerPhone || '',
                buyerId: userData?.role === 'cliente' ? input.userId : undefined,
                sellerId: userData?.role === 'vendedor' ? input.userId : undefined,
                sellerUsername: userData?.role === 'vendedor' ? userData.username : null,
            };

            transaction.set(newTicketRef, newTicketData);
            transaction.update(userRef, { saldo: newBalance });

            return { ticket: newTicketData as Ticket, newBalance: newBalance };
        });

        return {
            success: true,
            ticket: result.ticket,
            newBalance: result.newBalance,
        };

    } catch (e: any) {
        console.error("Transaction failed: ", e);
        return {
            success: false,
            error: e.message || "An unknown error occurred during the transaction.",
        };
    }
  }
);
