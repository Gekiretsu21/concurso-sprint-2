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

  } catch (error: any) {
    console.error('Error listing users:', error);
    // Check for a specific authentication credential error code from Admin SDK
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/app-deleted' || error.message.includes('Credential implementation provided to initializeApp() via the "credential" property failed to fetch a valid Google OAuth2 access token')) {
       throw new Error('ADMIN_CREDENTIALS_ERROR');
    }
    // For other errors, throw a generic message
    throw new Error('Failed to retrieve user list.');
  }
}
