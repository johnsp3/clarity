# Clarity

A beautiful, minimal note-taking application inspired by Apple's design principles. Built with React, TypeScript, and Tailwind CSS.

![Clarity App](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3.6-06B6D4?logo=tailwindcss)

## ✨ Features

- **Apple-Inspired Design**: Clean, minimal interface with smooth animations
- **Three-Column Layout**: Sidebar navigation, note list, and editor
- **Project Organization**: Organize notes into projects/folders
- **Instant Search**: Find notes quickly with real-time search
- **Auto-Save**: Notes are saved automatically as you type
- **Responsive Design**: Works beautifully on all screen sizes
- **Glass Morphism**: Modern UI with backdrop blur effects
- **AI-Powered Features**: ChatGPT integration for content enhancement
- **Web Search**: Perplexity AI integration for research and information
- **Firebase Sync**: Real-time synchronization across devices
- **Secure Setup**: Guided setup wizard with encrypted API key storage

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/clarity.git
cd clarity
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

5. Follow the setup wizard to configure Firebase and API keys

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v3 with custom Apple-inspired design system
- **State Management**: Zustand
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **AI Integration**: OpenAI ChatGPT-4, Perplexity AI

## 📁 Project Structure

```
clarity/
├── src/
│   ├── components/
│   │   ├── App.tsx              # Main application component
│   │   ├── EnhancedSidebar.tsx  # Navigation sidebar with projects
│   │   ├── EnhancedNoteList.tsx # Note list with previews
│   │   ├── Editor.tsx           # Rich text note editor
│   │   ├── SetupWizard/         # Initial setup wizard
│   │   ├── SettingsPanel.tsx    # Settings and configuration
│   │   ├── SearchPanel.tsx      # AI-powered web search
│   │   ├── AIEdit.tsx           # ChatGPT content enhancement
│   │   └── ...                  # Other components
│   ├── services/
│   │   ├── firebase.js          # Firebase configuration
│   │   ├── encryption.ts        # API key encryption
│   │   └── validation.ts        # Setup validation
│   ├── store/
│   │   └── useStore.ts          # Zustand store for state management
│   ├── utils/
│   │   ├── openai-client.ts     # ChatGPT integration
│   │   ├── perplexity-search.ts # Perplexity AI integration
│   │   └── ...                  # Other utilities
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles and Tailwind directives
├── public/
├── package.json
└── tailwind.config.js           # Tailwind configuration with Apple colors
```

## 🎨 Design System

The app follows Apple's design principles:

- **Colors**: Clean whites, subtle grays, and Apple blue accent
- **Typography**: San Francisco inspired font stack
- **Shadows**: Multi-layered, subtle shadows
- **Border Radius**: 12px for cards, 8px for buttons
- **Animations**: 300ms ease-out transitions with spring effects

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📝 Usage

### Initial Setup
1. **Firebase Configuration**: Paste your Firebase config from the console
2. **Email Authorization**: Enter your authorized email address
3. **Security Rules**: Copy the provided rules to your Firebase console
4. **API Keys**: Add your ChatGPT and Perplexity API keys (optional)

### Daily Use
1. **Create a Note**: Click the + button in the note list
2. **Create a Project**: Click "New Project" in the sidebar
3. **Search Notes**: Use the search bar to find notes instantly
4. **Edit Notes**: Click any note to start editing
5. **AI Features**: Use the AI Edit button for content enhancement
6. **Web Search**: Use the AI Search button for research

## 🤖 AI Features

### ChatGPT Integration
- **Content Enhancement**: Improve clarity, fix grammar, adjust tone
- **Format Conversion**: Convert between Markdown, HTML, and plain text
- **Content Generation**: Expand ideas, summarize, create bullet points
- **Custom Prompts**: Use your own AI instructions

### Perplexity Search
- **Real-time Web Search**: Get current information from the internet
- **Source Citations**: All results include clickable source links
- **Context-Aware**: Search with different contexts (general, research, news, technical)
- **Note Integration**: Insert search results directly into your notes

## 🔒 Security & Privacy

- **Local Encryption**: All API keys are encrypted using browser-specific keys
- **Firebase Rules**: Strict security rules ensure only you can access your data
- **No Data Collection**: Your notes and API keys never leave your control
- **Open Source**: Full transparency in how your data is handled

## 🚧 Roadmap

- [ ] Mobile app (React Native)
- [ ] Collaborative editing
- [ ] Advanced AI features (image generation, voice notes)
- [ ] Export notes as PDF/Markdown
- [ ] Offline mode with sync
- [ ] Plugin system for extensions
- [ ] Advanced search with filters

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ using React, TypeScript, and modern AI technologies 