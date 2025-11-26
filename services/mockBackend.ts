import { User, Video, Comment } from '../types';

// Initial Mock Data
const INITIAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Demo Creator',
    email: 'creator@tubex.com',
    avatar: 'https://picsum.photos/seed/u1/150/150',
    followers: 9500,
    viewsCount: 28000,
    isMonetized: false,
    joinDate: '2023-01-15',
    password: 'password123'
  },
  {
    id: 'u2',
    name: 'Tech Insider',
    email: 'tech@tubex.com',
    avatar: 'https://picsum.photos/seed/u2/150/150',
    followers: 50000,
    viewsCount: 1500000,
    isMonetized: true,
    joinDate: '2022-05-20',
    telegramBotLink: 'http://t.me/XoxoTubeBot
  }
];

const INITIAL_VIDEOS: Video[] = [
  {
    id: 'v1',
    userId: 'u2',
    title: 'The Future of AI in 2025',
    description: 'An in-depth look at how artificial intelligence will shape our world in the coming years.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://picsum.photos/seed/v1/640/360',
    views: 125000,
    likes: 4500,
    uploadDate: '2023-10-01',
    duration: '10:34',
    category: 'Technology',
    tags: ['ai', 'future', 'tech']
  },
  {
    id: 'v2',
    userId: 'u2',
    title: 'Review: Latest Smartphone',
    description: 'Is this the best phone of the year? Let\'s find out.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://picsum.photos/seed/v2/640/360',
    views: 89000,
    likes: 2100,
    uploadDate: '2023-10-05',
    duration: '15:20',
    category: 'Technology',
    tags: ['review', 'phone', 'mobile']
  },
  {
    id: 'v3',
    userId: 'u1',
    title: 'My Journey to 10k Followers',
    description: 'Vlog about my daily life and how I grow my channel.',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://picsum.photos/seed/v3/640/360',
    views: 5000,
    likes: 300,
    uploadDate: '2023-11-12',
    duration: '08:15',
    category: 'Vlog',
    tags: ['vlog', 'life', 'journey']
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockBackendService {
  private users: User[];
  private videos: Video[];
  private comments: Comment[];
  private currentUser: User | null = null;

  constructor() {
    const storedUsers = localStorage.getItem('tubex_users');
    const storedVideos = localStorage.getItem('tubex_videos');
    const storedComments = localStorage.getItem('tubex_comments');
    const storedCurrentUser = localStorage.getItem('tubex_current_user');

    this.users = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
    this.videos = storedVideos ? JSON.parse(storedVideos) : INITIAL_VIDEOS;
    this.comments = storedComments ? JSON.parse(storedComments) : [];
    this.currentUser = storedCurrentUser ? JSON.parse(storedCurrentUser) : null;
  }

  private save() {
    localStorage.setItem('tubex_users', JSON.stringify(this.users));
    localStorage.setItem('tubex_videos', JSON.stringify(this.videos));
    localStorage.setItem('tubex_comments', JSON.stringify(this.comments));
    if (this.currentUser) {
      localStorage.setItem('tubex_current_user', JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem('tubex_current_user');
    }
  }

  // Auth
  async login(email: string, password: string): Promise<User> {
    await delay(500);
    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    this.currentUser = user;
    this.save();
    return user;
  }

  async logout() {
    this.currentUser = null;
    this.save();
  }

  async signup(name: string, email: string, password: string): Promise<User> {
    await delay(800);
    if (this.users.find(u => u.email === email)) throw new Error('User already exists');
    
    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      email,
      password,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      followers: 0,
      viewsCount: 0,
      isMonetized: false,
      joinDate: new Date().toISOString().split('T')[0]
    };
    
    this.users.push(newUser);
    this.currentUser = newUser;
    this.save();
    return newUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Videos
  getVideos(): Video[] {
    return [...this.videos];
  }

  async uploadVideo(videoData: Omit<Video, 'id' | 'views' | 'likes' | 'uploadDate'>): Promise<Video> {
    await delay(1500);
    const newVideo: Video = {
      ...videoData,
      id: `v${Date.now()}`,
      views: 0,
      likes: 0,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    this.videos.unshift(newVideo);
    this.save();
    return newVideo;
  }

  incrementView(videoId: string) {
    const video = this.videos.find(v => v.id === videoId);
    if (video) {
      video.views++;
      // Update creator stats
      const creator = this.users.find(u => u.id === video.userId);
      if (creator) {
        creator.viewsCount++;
        // If logged in user is the creator, update session
        if (this.currentUser && this.currentUser.id === creator.id) {
          this.currentUser.viewsCount = creator.viewsCount;
        }
      }
      this.save();
    }
  }

  // User interactions
  async toggleFollow(targetUserId: string): Promise<boolean> {
    await delay(300);
    // Simple toggle simulation without a 'Follow' table for this demo
    const targetUser = this.users.find(u => u.id === targetUserId);
    if (!targetUser) return false;
    
    // In a real app we'd check if already following. Here we just increment for demo purpose
    // simulating a "Follow" action.
    targetUser.followers++;
    this.save();
    return true;
  }

  async applyForMonetization(userId: string): Promise<boolean> {
    await delay(1000);
    const user = this.users.find(u => u.id === userId);
    if (!user) return false;
    
    if (user.followers >= 10000 && user.viewsCount >= 30000) {
      user.isMonetized = true;
      if (this.currentUser?.id === userId) {
        this.currentUser.isMonetized = true;
      }
      this.save();
      return true;
    }
    return false;
  }
  
  async updateBotLink(userId: string, link: string): Promise<void> {
      await delay(500);
      const user = this.users.find(u => u.id === userId);
      if(user) {
          user.telegramBotLink = link;
          if (this.currentUser?.id === userId) {
            this.currentUser.telegramBotLink = link;
          }
          this.save();
      }
  }
  
  getUserById(id: string): User | undefined {
      return this.users.find(u => u.id === id);
  }
}

export const backend = new MockBackendService();
    
