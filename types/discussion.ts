export interface Discussion {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  category?: string;
  replyCount: number;
  upvotes: number;
  lastReplied: Date;
  avatars: string[]; // URLs for the profile pictures
  author: {
    firstName: string;
    lastName: string;
    image: string | null;
  };
}
