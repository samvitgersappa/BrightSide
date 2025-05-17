# BrightSide: AI-Powered Learning Platform

BrightSide is a modern, interactive learning platform that combines advanced AI capabilities with educational tools to enhance student learning and engagement. The platform features specialized AI bots for debate practice and emotional intelligence development.

## 📋 Table of Contents
- [Key Features](#-key-features)
- [Technologies Used](#-technologies-used)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Setting Up Environment Variables](#setting-up-environment-variables)
  - [Running the Application](#running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

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

### 📧 Emergency Notification System
- SMTP-based MIMEtext email notifications
- Automatic alerts to emergency contacts
- Customizable notification triggers
- Python backend API for reliable email delivery
- Monitor emotional intelligence development
- Detailed session history

## 🚀 Technologies Used

### Frontend
- React with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Context API for state management

### Backend
- Python with FastAPI for the notification API
- SMTP email integration
- Environment-based configuration

### AI Integration
- Groq API for AI capabilities
- Real-time emotion analysis
- Natural language processing

## 🏁 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+ with pip
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/brightside.git
cd brightside
```

2. Install frontend dependencies
```bash
npm install
```

3. Set up Python virtual environment and install backend dependencies
```bash
cd python_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Setting Up Environment Variables

1. Create environment files from examples
```bash
cp .env.example .env
cp python_backend/.env.example python_backend/.env
```

2. Update the environment variables in both `.env` files with your own API keys and credentials

### Running the Application

1. Start the Python backend API (in one terminal)
```bash
cd python_backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python start_server.py
```

2. Start the frontend development server (in another terminal)
```bash
npm run dev
```

3. Access the application in your browser at http://localhost:5173

## 📁 Project Structure

```
brightside/
├── python_backend/       # Python API for notifications
│   ├── api.py            # FastAPI implementation
│   ├── email_service.py  # Email notification service
│   └── start_server.py   # Server startup script
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts
│   ├── pages/            # Application pages
│   │   ├── analytics/    # Analytics dashboard
│   │   ├── debate-bot/   # Debate practice bot
│   │   └── eq-bot/       # Emotional intelligence bot
│   ├── services/         # API and utility services
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## 📘 API Documentation

### Emergency Notification API

- **Endpoint**: `/api/notify/emergency`
- **Method**: POST
- **Description**: Sends emergency notifications to specified contacts
- **Request Body**:
  ```json
  {
    "user": {
      "id": "string",
      "name": "string",
      "email": "user@example.com",
      "contacts": [
        {
          "id": "string",
          "name": "string",
          "email": "contact@example.com",
          "relationship": "string",
          "phone": "string"
        }
      ]
    },
    "emotionScore": 0,
    "message": "string",
    "relationships": ["string"]
  }
  ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

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

4. Set up the Python backend (for emergency notifications):
   ```bash
   # Install Python dependencies
   cd python_backend
   pip install -r requirements.txt
   
   # Configure SMTP settings in python_backend/.env
   # Start the notification service
   python start_server.py
   ```

5. Start the development server:
   ```bash
   # In the project root directory
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
VITE_EMERGENCY_API_URL=http://localhost:8000/api
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

python_backend/
├── api.py         # FastAPI server for emergency notifications
├── email_service.py  # MIME email notification service
├── requirements.txt  # Python dependencies
└── start_server.py   # Server startup script
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