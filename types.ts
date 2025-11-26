export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  followers: number; // For monetization check
  viewsCount: number; // Cumulative views across all videos
  isMonetized: boolean;
  telegramBotLink?: string;
  joinDate: string;
  password?: string; // In a real app, never store plain text
}

export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string;
  url: string; // Blob URL or external placeholder
  thumbnail: string;
  views: number;
  likes: number;
  uploadDate: string;
  duration: string;
  category: string;
  tags: string[];
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export enum ViewState {
  HOME,
  WATCH,
  UPLOAD,
  PROFILE,
  MONETIZATION,
  LOGIN,
  SIGNUP
}

export interface AdConfig {
  type: 'banner' | 'preroll' | 'sidebar';
  content: string;
}