export interface FeedPost {
  id: string;
  title: string;
  body: string;
  type: 'video' | 'link' | 'notice';
  contentUrl?: string;
  actionLabel?: string;
  targetTier: 'all' | 'standard' | 'plus';
  isPinned: boolean;
  createdAt: any; // Firestore Timestamp
  active: boolean;
}
