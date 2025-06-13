import { useState, useEffect } from 'react';
import { mockMaleUsers, mockFemaleUsers } from '../data/mockData';
import { ChatList } from '../components/messaging/ChatList';
import { ChatWindow } from '../components/messaging/ChatWindow';
import { User, Message } from '../types';
import { generateMessages } from '../data/mockData';

interface Props {
  selectedUser?: User | null;
  onClearSelectedUser?: () => void;
  onViewProfile?: (user: User) => void;
}

export const MessagesScreen: React.FC<Props> = ({ 
  selectedUser: initialSelectedUser, 
  onClearSelectedUser,
  onViewProfile
}) => {
  const [currentUserId] = useState<string>('current-user-id');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(initialSelectedUser || undefined);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [isMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const users = [...mockMaleUsers.slice(0, 10), ...mockFemaleUsers.slice(0, 10)];
    setAllUsers(users);
    
    // Generate messages for all users upfront
    const messagesForAllUsers = users.flatMap(user => 
      generateMessages(currentUserId, [user])
    );
    setAllMessages(messagesForAllUsers);
  }, [currentUserId]);

  useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
    }
  }, [initialSelectedUser]);

  const getMessagesForUser = (userId: string): Message[] => {
    return allMessages.filter(msg => 
      msg.senderId === userId || msg.receiverId === userId
    );
  };

  const handleSendMessage = (content: string) => {
    if (!selectedUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: selectedUser.id,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };

    setAllMessages(prev => [...prev, newMessage]);
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    if (onClearSelectedUser) {
      onClearSelectedUser();
    }
  };

  const handleBackToList = () => {
    setSelectedUser(undefined);
    if (onClearSelectedUser) {
      onClearSelectedUser();
    }
  };

  const selectedUserMessages = selectedUser ? getMessagesForUser(selectedUser.id) : [];

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Mobile: Show either chat list or chat window */}
      {isMobile ? (
        <>
          {!selectedUser ? (
            <div className="flex-1 flex flex-col">
              <ChatList
                users={allUsers}
                messages={allMessages}
                selectedUser={selectedUser}
                onSelectUser={handleSelectUser}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <ChatWindow
                user={selectedUser}
                messages={selectedUserMessages}
                onSendMessage={handleSendMessage}
                currentUserId={currentUserId}
                onBack={handleBackToList}
                onViewProfile={onViewProfile}
              />
            </div>
          )}
        </>
      ) : (
        /* Desktop: Show both panels */
        <>
          <div className="w-80 border-r border-gray-800 flex-shrink-0">
            <ChatList
              users={allUsers}
              messages={allMessages}
              selectedUser={selectedUser}
              onSelectUser={handleSelectUser}
            />
          </div>
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <ChatWindow
                user={selectedUser}
                messages={selectedUserMessages}
                onSendMessage={handleSendMessage}
                currentUserId={currentUserId}
                onBack={isMobile ? handleBackToList : undefined}
                onViewProfile={onViewProfile}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};