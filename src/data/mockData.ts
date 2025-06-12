import { User, Post, CurrentUser, Message } from '../types';
import { generateId } from '../utils/generateId';

// Arrays of sample data to generate users and posts
const maleFirstNames = [
  'John', 'Mike', 'David', 'Alex', 'Chris', 'Daniel', 'James', 'Matthew', 'Andrew', 'Ryan',
  'William', 'Thomas', 'Michael', 'Robert', 'Richard', 'Joseph', 'Charles', 'Kevin', 'Brian', 'Steven'
];

const femaleFirstNames = [
  'Jane', 'Sarah', 'Emily', 'Katie', 'Emma', 'Olivia', 'Sophia', 'Isabella', 'Mia', 'Charlotte',
  'Ava', 'Amelia', 'Harper', 'Evelyn', 'Abigail', 'Elizabeth', 'Sofia', 'Victoria', 'Grace', 'Lily'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris'
];

const maleBios = [
  'Tech enthusiast & software developer 💻',
  'Adventure seeker | Mountain climber 🏔️',
  'Professional photographer 📸',
  'Fitness trainer & nutrition expert 💪',
  'Music producer & DJ 🎵',
  'Startup founder | Tech entrepreneur 🚀',
  'Sports fanatic ⚽ | Gym lover 🏋️‍♂️',
  'Coffee connoisseur ☕ | Food explorer 🍜',
  'Travel vlogger ✈️ | Content creator 🎥',
  'Gamer & streamer 🎮 | Tech reviewer 📱'
];

const femaleBios = [
  'Digital artist & illustrator 🎨',
  'Yoga instructor & wellness coach 🧘‍♀️',
  'Fashion blogger | Style consultant 👗',
  'Food photographer & recipe developer 📸',
  'Dance instructor & choreographer 💃',
  'Interior designer & DIY enthusiast 🏠',
  'Beauty & lifestyle content creator ✨',
  'Fitness model & personal trainer 💪',
  'Travel photographer & adventurer 🌎',
  'Tech entrepreneur & public speaker 🎤'
];

const interests = [
  'Photography', 'Travel', 'Fitness', 'Music', 'Art', 'Technology', 'Food', 'Fashion',
  'Sports', 'Reading', 'Gaming', 'Movies', 'Dancing', 'Hiking', 'Cooking', 'Yoga',
  'Writing', 'Pets', 'Nature', 'Coffee'
];

function generateUser(gender: 'male' | 'female', index: number): User {
  const id = generateId();
  const firstName = gender === 'male' 
    ? maleFirstNames[index % maleFirstNames.length]
    : femaleFirstNames[index % femaleFirstNames.length];
  const lastName = lastNames[index % lastNames.length];
  const name = `${firstName} ${lastName}`;
  const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${index}`;
  
  const userInterests = Array.from({ length: 3 }, () => 
    interests[Math.floor(Math.random() * interests.length)]
  );

  return {
    id,
    name,
    dpUrl: `https://i.pravatar.cc/300?img=${index}${gender === 'male' ? 'm' : 'f'}`,
    bio: gender === 'male' 
      ? maleBios[index % maleBios.length]
      : femaleBios[index % femaleBios.length],
    gender,
    age: Math.floor(Math.random() * (45 - 18) + 18),
    distance: Math.floor(Math.random() * 250),
    interests: Array.from(new Set(userInterests)), // Ensure unique interests
    links: {
      Twitter: `https://twitter.com/${username}`,
      Instagram: `https://instagram.com/${username}`,
      LinkedIn: `https://linkedin.com/in/${username}`,
    }
  };
}

// Generate users of each gender
export const mockMaleUsers: User[] = Array.from({ length: 500 }, (_, i) => 
  generateUser('male', i)
);

export const mockFemaleUsers: User[] = Array.from({ length: 500 }, (_, i) => 
  generateUser('female', i)
);

// Generate posts
const postCaptions = [
  'Living my best life! 🌟',
  'Another beautiful day in paradise 🌅',
  'Can\'t beat this view 😍',
  'Weekend vibes 🎉',
  'Making memories 📸',
  'Adventure awaits 🌎',
  'Good times with great people 🥰',
  'Living in the moment ✨',
  'Blessed and grateful 🙏',
  'Dreams do come true 💫'
];

export function generatePosts(users: User[]): Post[] {
  return Array.from({ length: 100 }, () => {
    const user = users[Math.floor(Math.random() * users.length)];
    return {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userDpUrl: user.dpUrl,
      title: `Post by ${user.name}`,
      mediaUrl: `https://picsum.photos/800/450?random=${generateId()}`,
      caption: postCaptions[Math.floor(Math.random() * postCaptions.length)],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
    };
  });
}

// Generate messages
const messageContents = [
  'Hey, how are you?',
  'Would you like to grab coffee sometime?',
  'Nice to meet you!',
  'I saw we have similar interests!',
  'Have you been to any good restaurants lately?',
  'What brings you to Zenlit?',
  'Love your travel photos!',
  'Any recommendations for hiking trails?',
  'Are you going to the upcoming tech meetup?',
  'Would love to connect!'
];

export function generateMessages(currentUserId: string, users: User[]): Message[] {
  return Array.from({ length: 20 }, () => {
    const otherUser = users[Math.floor(Math.random() * users.length)];
    return {
      id: generateId(),
      senderId: Math.random() > 0.5 ? currentUserId : otherUser.id,
      receiverId: Math.random() > 0.5 ? otherUser.id : currentUserId,
      content: messageContents[Math.floor(Math.random() * messageContents.length)],
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      read: Math.random() > 0.3
    };
  });
}

// Default current user
export const defaultCurrentUser: CurrentUser = {
  id: 'current-user-id',
  name: 'Alex Johnson',
  dpUrl: 'https://i.pravatar.cc/300?img=default',
  bio: 'Explorer of life | Photography 📸 | Travel ✈️ | Technology 💻',
  gender: 'male',
  age: 28,
  distance: 0,
  interests: ['Photography', 'Travel', 'Technology'],
  posterUrl: 'https://picsum.photos/1200/400?random=cover',
  email: 'alex@example.com',
  location: 'New York',
  links: {
    Twitter: 'https://twitter.com/alexjohnson',
    Instagram: 'https://instagram.com/alexjohnson',
    LinkedIn: 'https://linkedin.com/in/alexjohnson',
  },
  media: Array.from({ length: 9 }, (_, i) => ({
    id: generateId(),
    mediaUrl: `https://picsum.photos/300/300?random=${1000 + i}`,
    caption: postCaptions[i % postCaptions.length],
    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
  })),
  posts: [],
  messages: []
};

// Global state for current user posts
let currentUserPosts: Post[] = [];

export const getCurrentUserPosts = (): Post[] => {
  return [...currentUserPosts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const addPostToCurrentUser = (post: Post): void => {
  currentUserPosts.unshift(post); // Add to beginning for latest first
};