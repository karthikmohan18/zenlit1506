import React, { useState } from 'react';
import { PostsFeed } from '../components/post/PostsFeed';
import { UserProfile } from '../components/profile/UserProfile';
import { mockUsers, generatePosts } from '../utils/mockDataGenerator';
import { getCurrentUserPosts } from '../data/mockData';
import { User } from '../types';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface Props {
  userGender: 'male' | 'female';
}

export const HomeScreen: React.FC<Props> = ({ userGender }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const users = userGender === 'male' ? mockUsers.female : mockUsers.male;
  
  // Combine current user's posts with other users' posts
  const currentUserPosts = getCurrentUserPosts();
  const otherUsersPosts = users.flatMap(user => generatePosts(user));
  
  // Merge and sort all posts by timestamp (latest first)
  const allPosts = [...currentUserPosts, ...otherUsersPosts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleUserClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
    }
  };

  if (selectedUser) {
    return (
      <div className="h-full bg-black">
        <button
          onClick={() => setSelectedUser(null)}
          className="fixed top-4 left-4 z-50 bg-gray-900/80 backdrop-blur-sm p-3 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          <ChevronLeftIcon className="w-5 h-5 text-white" />
        </button>
        <UserProfile user={selectedUser} />
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-black border-b border-gray-800 safe-area-inset-top">
        <div className="px-4 py-3 flex items-center">
          <svg className="w-8 h-8 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h1 className="text-xl font-bold text-white">Feed</h1>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 overflow-y-auto mobile-scroll">
        <div className="px-4 py-4 space-y-6">
          {allPosts.length > 0 ? (
            <PostsFeed posts={allPosts} onUserClick={handleUserClick} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-gray-400 mb-2">No posts yet</p>
              <p className="text-gray-500 text-sm">Create your first post to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};