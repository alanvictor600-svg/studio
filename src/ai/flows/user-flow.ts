
'use server';
/**
 * @fileOverview User management flows.
 *
 * - deleteUser: Deletes a user from Firebase Authentication and Firestore.
 */

import { ai } from '@/ai/genkit';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';

const DeleteUserInputSchema = z.object({
  userId: z.string().describe('The UID of the user to delete.'),
});

export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<void> {
  await deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: z.void(),
  },
  async ({ userId }) => {
    
    console.log(`[Flow] Attempting to delete user: ${userId}`);

    // Delete from Firebase Authentication
    try {
      await adminAuth.deleteUser(userId);
      console.log(`[Flow] Successfully deleted user from Firebase Auth: ${userId}`);
    } catch (error: any) {
      // If user is not found in Auth, it might have been already deleted.
      // We can proceed to delete from Firestore.
      if (error.code === 'auth/user-not-found') {
        console.warn(`[Flow] User not found in Firebase Auth, but proceeding to delete from Firestore: ${userId}`);
      } else {
        console.error(`[Flow] Error deleting user from Firebase Auth: ${userId}`, error);
        throw new Error('Failed to delete user from Authentication.');
      }
    }

    // Delete from Firestore
    try {
      const userDocRef = adminDb.collection('users').doc(userId);
      await userDocRef.delete();
      console.log(`[Flow] Successfully deleted user from Firestore: ${userId}`);
    } catch (error) {
      console.error(`[Flow] Error deleting user from Firestore: ${userId}`, error);
      // Even if Firestore deletion fails, Auth deletion was likely the primary goal.
      // We might not want to throw an error here if Auth deletion was successful.
      // For now, we will throw to indicate a partial failure.
      throw new Error('Failed to delete user from Firestore.');
    }
  }
);
