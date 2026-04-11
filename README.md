<div align="center">
<img width="1200" height="475" alt="AI PDF Chat App" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI PDF Chat Application

A modern chatbot application with advanced features including **Authentication**, **PDF Upload & Processing**, and **AI-Powered Summarization** using Gemini AI.

## Features

### ✨ Core Features

- 💬 **Real-time Chat** - Stream-based AI responses with Gemini API
- 🔐 **Authentication** - Email/password login and registration with Supabase
- 📄 **PDF Upload** - Upload and process PDF documents (max 10MB)
- 🤖 **PDF Summarization** - Automatic PDF text extraction and AI-powered summaries
- 📊 **Chat History** - Save and manage conversations locally
- 📁 **File History** - Track uploaded PDF files
- 🎨 **Modern UI** - Built with React + Tailwind CSS with smooth animations

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API key (free tier available)
- Supabase account (free tier available)

### Step 1: Generate Required API Keys

#### Gemini API Key

1. Go to https://ai.google.dev
2. Click "Get API Key"
3. Create a new API key in Google AI Studio
4. Copy the API key

#### Supabase Setup (Free Tier)

1. Go to https://supabase.com/
2. Sign up or log in with GitHub/Google
3. Create a new project:
   - Project name: `ai-pdf-chat`
   - Database password: Save this securely
   - Region: Choose closest to you
4. Once created, go to **Project Settings > API**
5. Copy:
   - **Project URL**
   - **anon (public) key**

### Step 2: Set up Supabase Database

1. **Create Database Tables & Storage:**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**
   - Copy and paste the contents of `supabase-setup.sql`
   - Click **Run** to execute the setup script

   This will create:
   - `user_files` table for file metadata
   - `pdf-files` storage bucket for PDF uploads
   - Security policies for data protection
   - A test user account

2. **Configure Environment Variables:**

   ```bash
   # Copy the example file
   cp .env.example .env.local

   # Add your keys to .env.local:
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_project_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

### Step 3: Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

## Test Account Credentials

After running the `supabase-setup.sql` script, you can immediately test the application with these credentials:

### Pre-configured Test Account

- **Email:** `test@example.com`
- **Password:** `Test@12345`

### How to Test

1. Start the app: `npm run dev`
2. Click "Sign in" (not "Sign up")
3. Use the credentials above
4. Upload a PDF and chat about it!

### Creating Your Own Account

You can also create your own account:

1. Click "Sign up" on the login page
2. Enter any email address
3. Enter a password (min 6 characters)
4. Click "Sign up"
5. Use those credentials to sign in

## Usage

### Chat

1. **Login** with your credentials
2. **Type a message** and press Enter or click Send
3. **AI responds** with streaming real-time answers
4. **View history** in the left sidebar

### PDF Processing

1. **Drag & drop** a PDF file or click to upload
2. **Max file size**: 10MB
3. **Supported format**: PDF only
4. **Processing steps**:
   - PDF text is extracted
   - Sent to Gemini AI
   - Summary is generated and displayed
   - File appears in "Uploaded Files" section
5. **Continue chatting** about the PDF with follow-up questions

### Manage Conversations

- **New Chat**: Click "New Chat" button
- **Delete Chat**: Hover and click delete icon
- **Switch Chat**: Click any conversation in sidebar
- **Logout**: Click the logout icon next to your email

## Project Structure

```
src/
├── components/
│   ├── Login.jsx           # Login form component
│   ├── Register.jsx        # Registration form component
│   └── PDFUploader.jsx     # PDF upload interface
├── contexts/
│   └── AuthContext.jsx     # Authentication state management
├── services/
│   ├── supabaseClient.js   # Supabase client initialization
│   ├── authService.js      # Auth API calls (sign up, sign in, logout)
│   ├── pdfService.js       # PDF extraction and summarization
│   └── geminiService.js    # Gemini AI integration
├── App.jsx                 # Main app component with auth routing
├── main.jsx                # React entry point
└── index.css               # Global styles
```

## Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS
- **AI/ML**: Google Gemini API
- **Backend Services**: Supabase (Auth + Storage)
- **PDF Processing**: pdf.js
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Markdown**: React Markdown

## Build & Deploy

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Clean build artifacts
npm run clean
```

## Environment Variables Reference

| Variable                 | Description            | Example                     |
| ------------------------ | ---------------------- | --------------------------- |
| `VITE_GEMINI_API_KEY`    | Google Gemini API key  | `AIzaSyD...`                |
| `VITE_SUPABASE_URL`      | Supabase project URL   | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...`                |

## Troubleshooting

### Auth Error: "Supabase environment variables are not set"

- Make sure `.env.local` exists and contains the correct keys
- Restart the dev server after updating environment variables

### PDF Upload Error: "File size must be less than 10MB"

- Choose a smaller PDF file (max 10MB)

### No PDF Summary Generated

- Check that the PDF contains extractable text (not scanned image)
- Try a different PDF file

### Chat not responding

- Verify `VITE_GEMINI_API_KEY` is correct
- Check that your Gemini API quota hasn't been exceeded

## Features Roadmap

- [ ] Store chat history in Supabase
- [ ] Share conversations with links
- [ ] Multiple file uploads in one chat
- [ ] OCR for scanned PDFs
- [ ] Export conversations as PDF/markdown
- [ ] Dark mode
- [ ] Mobile app version

## License

MIT

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review Supabase documentation: https://supabase.com/docs
3. Check Gemini API documentation: https://ai.google.dev/docs

---

**Last Updated**: April 2026
**Created for**: Pro AI Chat with PDF Support
