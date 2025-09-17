// src/lib/services/userService.ts
import { doc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteUser } from '@/ai/flows/user-flow';

/**
 * Updates a user's credit balance. Can be a positive or negative amount.
 * @param userId - The ID of the user to update.
 * @param amount - The amount to add (positive) or remove (negative) from the balance.
 * @returns The new balance of the user.
 */
export const updateUserCredits = async (userId: string, amount: number): Promise<number> => {
    const userRef = doc(db, 'users', userId);
    
    return await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            throw new Error("Usuário não encontrado.");
        }
        
        const currentBalance = userDoc.data().saldo || 0;
        const newBalance = currentBalance + amount;
        
        transaction.update(userRef, { saldo: newBalance });
        
        return newBalance;
    });
};

/**
 * Deletes a user account from Firestore and Firebase Auth by calling a secure Genkit flow.
 * @param userId - The ID of the user to delete.
 */
export const deleteUserAccount = async (userId: string): Promise<void> => {
    try {
        await deleteUser({ userId });
    } catch (error) {
        console.error("Error calling delete user flow: ", error);
        if (error instanceof Error) {
            throw new Error(`Falha ao excluir usuário: ${error.message}`);
        }
        throw new Error("Falha ao excluir usuário.");
    }
};
