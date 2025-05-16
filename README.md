# BrightSide: AI-Powered Learning Platform

BrightSide is a modern, interactive learning platform that combines advanced AI capabilities with educational tools to enhance student learning and engagement. The platform features specialized AI bots for debate practice and emotional intelligence development.

## 🌟 Key Features

### 🎭 Debate Bot
- Interactive debate practice with AI
- Real-time argument scoring and feedback
- Support for multiple debate topics
- Voice input capability for natural conversation
- Customizable stance (for/against) on various topics

### 🧠 EQ Bot
- Emotional intelligence training and assessment
- Real-time emotional analysis
- Personalized feedback and guidance

### 📊 Analytics Dashboard
- Track learning progress
- View debate performance metrics
- Monitor emotional intelligence development
- Detailed session history

## 🚀 Technologies Used

- **Frontend Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **AI Integration:** 
  - OpenAI API
  - Groq API
  - HuggingFace Inference
- **Visualization:** Recharts
- **Build Tool:** Vite
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Modern web browser

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/samvitgersappa/BrightSide.git
   cd BrightSide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your API keys and other required values

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 Environment Variables

Required environment variables:
```
VITE_GROQ_API_KEY=your_groq_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── config/        # API and service configurations
├── contexts/      # React contexts (Auth, etc.)
├── pages/         # Main application pages
├── services/      # API and business logic
├── types/         # TypeScript type definitions
└── utils/         # Utility functions
```

## 🔐 Authentication

The application includes a complete authentication system with:
- Protected routes
- User session management
- Login/Signup pages
- Dashboard access control

## 🎨 UI/UX Features

- Modern, responsive design
- Dark/light mode support
- Interactive chat interfaces
- Real-time voice input
- Dynamic data visualization
- Loading states and error handling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Acknowledgments

- OpenAI for their powerful language models
- Groq for their AI capabilities
- HuggingFace for their machine learning models
- The React community for excellent tools and libraries

---

Made with ❤️ by Samvit Gersappa