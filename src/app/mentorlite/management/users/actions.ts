'use server';

import { adminAuth } from '@/firebase/admin';
import { Auth, UserRecord } from 'firebase-admin/auth';

export interface UserData {
  id: string;
  name: string | undefined;
  email: string | undefined;
}

export async function getAllUsers(): Promise<UserData[]> {
  try {
    const userRecords: UserRecord[] = [];
    let nextPageToken;

    // The listUsers method retrieves users in batches.
    // We loop until all users are fetched.
    do {
      const listUsersResult = await adminAuth.listUsers(1000, nextPageToken);
      userRecords.push(...listUsersResult.users);
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    return userRecords.map(user => ({
      id: user.uid,
      name: user.displayName,
      email: user.email,
    }));

  } catch (error) {
    console.error('Error listing users:', error);
    // In a real app, you might want to handle this more gracefully.
    // For now, we'll re-throw the error to be caught by the client.
    throw new Error('Failed to retrieve user list.');
  }
}
