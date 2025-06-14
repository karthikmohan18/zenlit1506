# Zenlit - Social Media App

A modern social media application built with Next.js 15, TypeScript, and Supabase that focuses on local connections and social verification.

## 🚀 Features

### Core Functionality
- **User Authentication** - Email/password login with OTP verification via Supabase
- **Profile Management** - Customizable profiles with cover photos and bios
- **Social Media Verification** - OAuth integration for Instagram, Facebook, LinkedIn, Twitter, and Google
- **Local Discovery** - Radar feature to find nearby users
- **Messaging** - Real-time chat functionality
- **Content Sharing** - Photo/video posts with camera integration
- **Stories** - Temporary content sharing

### Social Verification System
- **OAuth Integration** - Verify ownership of social media accounts
- **Verified Badges** - Visual indicators for verified accounts
- **Trust Building** - Enhanced credibility through verified social presence
- **Multiple Providers** - Support for major social platforms

### Mobile-First Design
- **Responsive Layout** - Optimized for mobile devices
- **Touch Interactions** - Smooth animations and transitions
- **Native Feel** - iOS/Android-like user experience
- **Dark Theme** - Modern dark UI design
- **Smooth Animations** - Framer Motion powered transitions

## 🛠 Tech Stack

- **Framework**: Next.js 15 with the App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OTP
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Heroicons, Tabler Icons
- **Animation**: Framer Motion
- **State Management**: React Hooks
- **Routing**: Component-based navigation

## 📱 Screens

1. **Welcome Screen** - App introduction and onboarding
2. **Login/Signup** - Authentication with email OTP verification
3. **Profile Setup** - Complete profile creation after signup
4. **Radar Screen** - Discover nearby users
5. **Feed Screen** - View posts from all users
6. **Create Post** - Share photos/videos with camera integration
7. **Messages** - Chat with other users
8. **Profile Screen** - User profiles with social verification
9. **Edit Profile** - Update profile information and verify social accounts

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd zenlit-social
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Set up the database:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the migration files in order:
     1. `supabase/migrations/20250613172048_withered_bread.sql`
     2. `supabase/migrations/20250614173000_expanded_social_schema.sql`

6. Configure Supabase Authentication:
   - Enable Email provider in Authentication settings
   - Enable "Allow new users to sign up"
   - Configure email templates if needed

7. Start the development server:
```bash
npm run dev
```

8. Open your browser and navigate to `http://localhost:3000`

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (Avatar, SocialLinks)
│   ├── messaging/      # Chat-related components
│   ├── post/          # Post-related components
│   ├── profile/       # Profile components
│   ├── radar/         # Radar screen components
│   ├── social/        # Social verification components
│   └── story/         # Stories components
├── screens/            # Main application screens
├── hooks/             # Custom React hooks
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── styles/            # CSS and styling
```

## 🔐 Authentication Flow

### New User Registration:
1. **Email Entry** - User enters email address
2. **OTP Verification** - 6-digit code sent to email
3. **Account Setup** - Name, date of birth, password
4. **Profile Setup** - Bio, interests, avatar, location
5. **Complete** - User can now access the app

### Existing User Login:
1. **Email & Password** - Standard login
2. **Session Management** - Automatic session handling
3. **Profile Loading** - User data loaded from Supabase

## 📊 Database Schema

### Core Tables:
- **profiles** - User profile information
- **social_accounts** - Verified social media accounts
- **posts** - User-generated content
- **messages** - Chat functionality

### Authentication:
- Handled by Supabase Auth
- Row Level Security (RLS) enabled
- Automatic profile creation on signup

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables for Production
Make sure to set these in your production environment:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Configuration
1. Set up production Supabase project
2. Run database migrations
3. Configure authentication settings
4. Set up storage buckets (optional)

## 🔮 Future Enhancements

- **Real-time Messaging** - WebSocket integration
- **Push Notifications** - Mobile notifications
- **Advanced Filtering** - Enhanced user discovery
- **Content Moderation** - Automated content filtering
- **Analytics Dashboard** - User engagement metrics
- **Premium Features** - Subscription-based enhancements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Tailwind CSS for the utility-first styling
- Heroicons and Tabler Icons for beautiful icons
- All contributors and testers

---

**Note**: This application uses Supabase for authentication and data storage. Make sure to configure your Supabase project properly before deployment.