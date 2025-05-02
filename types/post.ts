export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
  hasUpvoted: boolean;
  _count: {
    comments: number;
    votes: number;
  };
  author: {
    firstName: string;
    lastName: string;
    image: string | null;
  };
  avatars: string[];
} 