export interface Discuession {
  id: number;
  title: string;
  replyCount: number;
  lastReplied: string;
  avatars: string[]; // URLs for the profile pictures
}
