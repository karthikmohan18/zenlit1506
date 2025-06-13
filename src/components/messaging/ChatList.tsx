import { User, Message } from '../../types';
import { format } from 'date-fns';

interface ChatListProps {
  users: User[];
  messages: Message[];
  selectedUser?: User;
  onSelectUser: (user: User) => void;
}

export const ChatList = ({ 
  users, 
  messages, 
  selectedUser, 
  onSelectUser 
}: ChatListProps) => {
  const getLatestMessage = (userId: string) => {
    return messages
      .filter(msg => msg.senderId === userId || msg.receiverId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .shift();
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-black border-b border-gray-800 safe-area-inset-top">
        <h2 className="text-xl font-bold text-white">Messages</h2>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto mobile-scroll">
        {users.map((user) => {
          const latestMessage = getLatestMessage(user.id);

          return (
            <button
              key={user.id}
              onClick={() => onSelectUser(user)}
              className={`flex items-center px-4 py-3 w-full text-left transition-colors ${
                selectedUser?.id === user.id 
                  ? 'bg-gray-800' 
                  : 'hover:bg-gray-900'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="relative flex-shrink-0">
                  <img 
                    src={user.dpUrl} 
                    alt={user.name} 
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-white truncate">{user.name}</h3>
                    {latestMessage && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {format(new Date(latestMessage.timestamp), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    {latestMessage ? (
                      <p className="text-sm text-gray-400 truncate pr-2">
                        {latestMessage.content.length > 35 
                          ? `${latestMessage.content.substring(0, 35)}...` 
                          : latestMessage.content}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No messages yet</p>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};