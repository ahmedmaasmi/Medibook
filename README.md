# Doctor Appointment Platform (MediBook)

A production-ready, full-stack Doctor Appointment Platform with AI voice scheduling capabilities. Built with Next.js, Flutter, and Node.js/Express.

![MediBook](https://img.shields.io/badge/MediBook-Healthcare%20Platform-6366F1)
![License](https://img.shields.io/badge/license-MIT-green)

## 🏗️ Architecture

```
/backend    → Node.js + Express + PostgreSQL
/web        → Next.js 14 + Tailwind CSS
/mobile     → Flutter 3.x
```

## ✨ Features

### For Patients (Clients)
- 📅 Book appointments with doctors
- 🎤 **AI Voice Booking** - Schedule appointments using natural voice commands
- 📋 View and manage appointments
- 🔔 Appointment confirmations and reminders

### For Doctors
- 📊 Dashboard with today's schedule
- ⏰ Manage availability (set working hours)
- 📆 **Google Calendar Sync** - Two-way sync with Google Calendar
- 👥 View patient appointments and details

### AI Voice Agent
- Uses OpenRouter SDK with free AI model (`allenai/olmo-3.1-32b-think:free`)
- Natural language processing for dates, times, and doctor names
- Conflict detection and smart scheduling
- Works on both web (Web Speech API) and mobile (speech_to_text)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS)
- PostgreSQL 14+
- Flutter 3.x (for mobile)
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install

# Create PostgreSQL database
createdb doctor_appointments

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start server
npm run dev
```

**Backend runs at:** `http://localhost:3001`

### 2. Web App Setup

```bash
cd web
npm install
npm run dev
```

**Web app runs at:** `http://localhost:3000`

### 3. Mobile App Setup

```bash
cd mobile
flutter pub get
flutter run
```

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/doctor_appointments
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OPENROUTER_API_KEY=your-openrouter-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/callback
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📚 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/slots/:doctorId` | Get available slots |
| PATCH | `/api/appointments/:id/cancel` | Cancel appointment |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List all doctors |
| GET | `/api/doctors/:id` | Get doctor details |
| POST | `/api/doctors/availability` | Set availability |

### Voice Processing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/process` | Process voice command |
| POST | `/api/voice/extract-intent` | Extract intent only |

### Google Calendar
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calendar/auth-url` | Get OAuth URL |
| GET | `/api/calendar/status` | Check connection |
| POST | `/api/calendar/disconnect` | Disconnect calendar |

## 🔧 Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Backend | Node.js + Express | 4.18.x |
| Database | PostgreSQL + Sequelize | 16.x / 6.x |
| Web | Next.js + Tailwind CSS | 14.x / 3.x |
| Mobile | Flutter | 3.x |
| AI | OpenRouter SDK | Latest |
| Voice (Web) | Web Speech API | Native |
| Voice (Mobile) | speech_to_text | 6.x |

## 📱 Mobile Permissions

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

Add to `ios/Runner/Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>Required for voice booking</string>
```

## 🌐 Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3001/api/calendar/callback`
6. Copy Client ID and Secret to `.env`

## 📁 Project Structure

```
tp_mcp/
├── backend/
│   ├── src/
│   │   ├── config/        # Database & app config
│   │   ├── middleware/    # Auth & error handling
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── server.js      # Express app
│   └── package.json
├── web/
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities & API client
│   └── package.json
└── mobile/
    ├── lib/
    │   ├── config/        # App configuration
    │   ├── models/        # Data models
    │   ├── providers/     # State management
    │   ├── screens/       # UI screens
    │   ├── services/      # API service
    │   └── main.dart      # App entry
    └── pubspec.yaml
```

## 🧪 Testing

### Backend
```bash
cd backend
npm test
```

### Web
```bash
cd web
npm run build  # Build check
npm run lint   # Lint check
```

### Mobile
```bash
cd mobile
flutter analyze
flutter test
```

## 📄 License

MIT License - Free for personal and commercial use.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Built with ❤️ using free, open-source technologies**
