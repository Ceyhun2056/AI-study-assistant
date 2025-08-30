# AI Study Assistant

A comprehensive, AI-powered study companion that transforms your study materials into interactive learning experiences. Built with Next.js 14, TypeScript, TailwindCSS, and Supabase.

## ✨ Features

### 🎯 Core Functionality
- **Document Upload & Processing**: Upload PDFs, TXT, DOC, and DOCX files
- **AI-Powered Summaries**: Generate intelligent summaries of your study materials
- **Interactive Quizzes**: Create personalized quizzes from document content
- **Smart Flashcards**: Generate and study with AI-created flashcards
- **Progress Tracking**: Monitor your learning progress and study time
- **Responsive Design**: Beautiful, mobile-friendly interface with dark mode support

### 🚀 Technical Features
- **Modern Stack**: Next.js 14 with App Router and TypeScript
- **Authentication**: Secure user authentication with Supabase Auth
- **Database**: PostgreSQL database with Row Level Security
- **File Storage**: Secure file storage with Supabase Storage
- **Real-time Updates**: Live data synchronization
- **Performance**: Optimized for speed and scalability

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS, CSS Variables, Responsive Design
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React Hooks + Context API
- **Deployment**: Vercel-ready

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ 
- npm or yarn
- Git
- A Supabase account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd AI-study-assistant
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a storage bucket named `documents` in your Supabase dashboard
4. Run the SQL schema in your Supabase SQL editor (see `supabase-schema.sql`)

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI API Keys (for future integration)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Setup

### 1. Run the Schema

Copy the contents of `supabase-schema.sql` and run it in your Supabase SQL editor.

### 2. Create Storage Bucket

In your Supabase dashboard:
1. Go to Storage
2. Create a new bucket named `documents`
3. Set it to public (or configure custom policies)

### 3. Configure RLS Policies

The schema includes Row Level Security policies to ensure users can only access their own data.

## 🎨 Customization

### Styling
- Modify `src/app/globals.css` for global styles
- Update `tailwind.config.js` for theme customization
- Use CSS variables for consistent theming

### AI Integration
The app includes placeholder functions in `src/lib/ai.ts` that you can connect to:
- OpenAI API
- Anthropic Claude
- Custom AI services

### Components
All components are built with TailwindCSS and can be easily customized:
- `src/components/DashboardLayout.tsx` - Main dashboard layout
- `src/app/dashboard/*` - Dashboard pages
- `src/app/auth/*` - Authentication pages

## 📱 Pages & Routes

### Public Pages
- `/` - Landing page with hero section and features
- `/auth/signup` - User registration
- `/auth/signin` - User login

### Protected Pages (Dashboard)
- `/dashboard` - Main dashboard with overview
- `/dashboard/upload` - Document upload interface
- `/dashboard/documents` - Document library
- `/dashboard/quizzes` - Quiz interface
- `/dashboard/flashcards` - Flashcard study mode

## 🔧 Development

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/            # Reusable components
│   └── DashboardLayout.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx
├── lib/                   # Utility functions
│   ├── ai.ts             # AI integration placeholders
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app is built with standard Next.js and can be deployed to:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **User authentication** with Supabase Auth
- **Secure file uploads** with proper validation
- **Protected routes** for authenticated users only
- **Environment variable** protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page
2. Ensure your environment variables are set correctly
3. Verify your Supabase configuration
4. Check the browser console for errors

## 🔮 Future Enhancements

- **Real AI Integration**: Connect to OpenAI, Claude, or other AI services
- **Advanced Analytics**: Detailed study insights and recommendations
- **Collaborative Learning**: Share study materials with classmates
- **Mobile App**: React Native companion app
- **Offline Support**: PWA capabilities for offline study
- **Spaced Repetition**: Advanced flashcard algorithms
- **Voice Notes**: Audio recording and transcription
- **Study Groups**: Collaborative study sessions

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Powered by [Supabase](https://supabase.com/)
- Icons from [Lucide React](https://lucide.dev/)

---

**Happy Studying! 🎓✨**