import { Timestamp } from 'firebase/firestore';

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'youtube' | 'link';
  url?: string;
  imageUrl?: string;
  audience: 'all' | 'standard' | 'plus';
  isPinned: boolean;
  isActive: boolean;
  createdAt: Timestamp;
}
