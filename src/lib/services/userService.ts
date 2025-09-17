// src/lib/services/userService.ts
import { doc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { adminAuth } from '@/lib/firebase-admin';

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
 * Deletes a user account from Firestore and Firebase Auth.
 * @param userId - The ID of the user to delete.
 */
export const deleteUserAccount = async (userId: string): Promise<void> => {
    
    // This is not fully secure as it exposes admin-level actions, 
    // but reverting as requested.
    
    // Delete from Firestore
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);

    // This part requires an admin-privileged environment to work correctly.
    // Calling it from the client-side is insecure and will likely fail
    // with default client permissions.
    try {
        await adminAuth.deleteUser(userId);
    } catch (error: any) {
        // If user is not found in Auth, it might have been already deleted.
        // We can consider this a success for the purpose of this function.
        if (error.code === 'auth/user-not-found') {
            console.warn(`User ${userId} not found in Firebase Auth, but was deleted from Firestore.`);
            return;
        }
        // Re-throw other auth errors
        throw error;
    }
};
