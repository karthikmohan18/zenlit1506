import type React from 'react';

export interface User {
  id: string;
  name: string;
  dpUrl: string;
  bio: string;
  gender: 'male' | 'female';
  age: number;
  distance: number;
  interests: string[];
  links: {
    Twitter: string;
    Instagram: string;
    LinkedIn: string;
  };
  // Social media verification fields
  instagramUrl?: string;
  instagramVerified?: boolean;
  facebookUrl?: string;
  facebookVerified?: boolean;
  linkedInUrl?: string;
  linkedInVerified?: boolean;
  twitterUrl?: string;
  twitterVerified?: boolean;
  googleUrl?: string;
  googleVerified?: boolean;
}

export interface Profile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: string;
  avatar_url?: string;
  cover_url?: string;
  interests?: string[];
  is_profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userDpUrl: string;
  title: string;
  mediaUrl: string;
  caption: string;
  timestamp: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Media {
  id: string;
  mediaUrl: string;
  caption?: string;
  timestamp: string;
}

export interface CurrentUser extends User {
  posterUrl: string;
  email: string;
  location: string;
  media: Media[];
  messages: Message[];
  posts: Post[];
}

export interface SocialProvider {
  id: 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'google';
  name: string;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export interface OAuthState {
  isConnecting: boolean;
  error: string | null;
  provider: string | null;
}