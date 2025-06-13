'use client'
import { useState, useEffect } from 'react';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ProfileSetupScreen } from './screens/ProfileSetupScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RadarScreen } from './screens/RadarScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { CreatePostScreen } from './screens/CreatePostScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { UserGroupIcon, Squares2X2Icon, UserIcon, PlusIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { User } from './types';
import { supabase, useSupabaseSession } from '../lib/supabaseClient';
import { useProfile } from './hooks/useProfile';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'login' | 'profileSetup' | 'app'>('welcome');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userGender] = useState<'male' | 'female'>('male');
  const [activeTab, setActiveTab] = useState('radar');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const session = useSupabaseSession();
  const { profile, loading: profileLoading } = useProfile(session?.user?.id);

  // Ensure we're on the client side before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (session) {
      setIsLoggedIn(true);
      
      // Check if profile setup is needed
      if (!profileLoading && profile) {
        if (profile.is_profile_complete) {
          setCurrentScreen('app');
        } else {
          setCurrentScreen('profileSetup');
        }
      }
    } else {
      setIsLoggedIn(false);
      setCurrentScreen('welcome');
    }
  }, [session, profile, profileLoading]);

  // Don't render anything until we're on the client
  if (!isClient) {
    return null;
  }

  // Show loading while checking profile
  if (session && profileLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleGetStarted = () => {
    setCurrentScreen('login');
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
    // Screen will be set by useEffect based on profile status
  };

  const handleProfileSetupComplete = () => {
    setCurrentScreen('app');
  };

  const handleProfileSetupSkip = () => {
    setCurrentScreen('app');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setCurrentScreen('welcome');
    setActiveTab('radar');
    setSelectedUser(null);
    setSelectedChatUser(null);
  };

  const handleMessageUser = (user: User) => {
    setSelectedChatUser(user);
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
    setActiveTab('profile');
  };

  const handleNavigateToCreate = () => {
    setActiveTab('create');
  };

  // Show welcome screen first
  if (currentScreen === 'welcome') {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  // Show login screen after get started is clicked
  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Show profile setup screen for new users
  if (currentScreen === 'profileSetup' && session?.user?.id) {
    return (
      <ProfileSetupScreen
        userId={session.user.id}
        onComplete={handleProfileSetupComplete}
        onSkip={handleProfileSetupSkip}
      />
    );
  }

  // Show main app after login and profile setup
  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      {/* Mobile App Container */}
      <div className="h-full flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'radar' && (
            <RadarScreen 
              userGender={userGender} 
              onNavigate={setActiveTab}
              onViewProfile={setSelectedUser}
              onMessageUser={handleMessageUser}
            />
          )}
          {activeTab === 'feed' && <HomeScreen userGender={userGender} />}
          {activeTab === 'create' && <CreatePostScreen />}
          {activeTab === 'messages' && (
            <MessagesScreen 
              selectedUser={selectedChatUser}
              onClearSelectedUser={() => setSelectedChatUser(null)}
              onViewProfile={handleViewProfile}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen 
              user={selectedUser} 
              onBack={() => setSelectedUser(null)}
              onLogout={handleLogout}
              onNavigateToCreate={handleNavigateToCreate}
              currentUserProfile={profile}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-gray-900 border-t border-gray-800 safe-area-inset-bottom fixed bottom-0 left-0 right-0 z-10">
          <div className="flex justify-around items-center py-2 px-4 h-16">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === 'radar' ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <UserGroupIcon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Radar</span>
            </button>
            
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === 'feed' ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <Squares2X2Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Feed</span>
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === 'create' ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <PlusIcon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Create</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === 'messages' ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <ChatBubbleLeftIcon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Messages</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                activeTab === 'profile' ? 'text-blue-500' : 'text-gray-400'
              }`}
            >
              <UserIcon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}