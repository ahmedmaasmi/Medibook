# Doctor Appointment Platform (MediBook)

A production-ready, full-stack Doctor Appointment Platform with AI voice scheduling and 3D visualization capabilities. Built with Next.js and Node.js/Express.

![MediBook](https://img.shields.io/badge/MediBook-Healthcare%20Platform-6366F1)
![License](https://img.shields.io/badge/license-MIT-green)

## 🏗️ Architecture

```text
/backend    → Node.js + Express + PostgreSQL
/web        → Next.js 14 + Tailwind CSS
```

## ✨ Features

### For Patients (Clients)
- 📅 Book appointments with doctors
- 🎤 **AI Voice Booking** - Schedule appointments using natural voice commands
- 📋 View and manage appointments
- 🔔 Appointment confirmations and reminders
- 🏥 **3D Medical Visualization** - Interactive 3D medical models and caduceus display

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

## 👥 Test Users

After running the database seeding script, you can use these test accounts to explore the application:

### Doctors
| Email | Password | Specialty |
|-------|----------|-----------|
| dr.smith@example.com | Password123! | Cardiology |
| dr.jones@example.com | Password123! | Dermatology |
| dr.wilson@example.com | Password123! | Pediatrics |
| dr.garcia@example.com | Password123! | Neurology |

### Clients
| Email | Password |
|-------|----------|
| client1@example.com | Password123! |
| client2@example.com | Password123! |
| ahmed@test.com | Password123! |

**Note:** Run `npm run seed` in the backend directory to populate the database with these users.

## 📚 Documentation

### Comprehensive Guides

📖 **[Backend Documentation](BACKEND_DOCUMENTATION.md)** - Complete backend architecture, API reference, and implementation details

📊 **[Graph Architecture](GRAPH_ARCHITECTURE.md)** - Visual diagrams of the graph-based data model and data flows

🚀 **[Quick Reference Guide](BACKEND_QUICK_REFERENCE.md)** - Quick commands, API endpoints, and troubleshooting

🔧 **[Graph Implementation Guide](GRAPH_IMPLEMENTATION_GUIDE.md)** - Detailed explanation of graph model with examples

### Quick API Reference

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

#### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/slots/:doctorId` | Get available slots |
| PATCH | `/api/appointments/:id/cancel` | Cancel appointment |

#### AI & RAG
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/recommend-doctor` | AI-powered doctor recommendation |
| POST | `/api/ai/confirm-booking` | Confirm AI recommendation |
| POST | `/api/chat/message` | Chat with AI assistant |

#### Voice Processing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/process` | Process voice command |
| POST | `/api/voice/extract-intent` | Extract intent only |

For complete API documentation, see [BACKEND_DOCUMENTATION.md](BACKEND_DOCUMENTATION.md)

## 🔧 Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Backend | Node.js + Express | 18+ / 4.18.x |
| Database | PostgreSQL + Sequelize | 14+ / 6.35.x |
| Vector DB | pgvector | Latest |
| Web | Next.js + Tailwind CSS | 14.2.35 / 3.4.x |
| AI | OpenRouter SDK | 0.2.11 |
| Voice | Web Speech API | Native |

## 🧠 Graph-Based Architecture

The backend implements a **graph-based data model** where entities (Users, Doctors, Appointments, Availability) are connected through relationships. This provides:

- **Natural Relationships** - Models real-world connections between entities
- **Efficient Traversal** - Fast queries through optimized joins and indexes
- **Vector Embeddings** - Semantic search using PostgreSQL pgvector (1536-dimensional vectors)
- **RAG System** - Retrieval-Augmented Generation for intelligent doctor recommendations

### Graph Structure

```
User ──(1:1)──► Doctor ──(1:M)──► Appointment
 │                │                     │
 │                │                     │
 │                ▼                     │
 │           Availability               │
 │                                      │
 └──────────(1:M as client)────────────┘

Doctor ──(1:1)──► DoctorEmbedding (vector space)
```

**Key Features:**
- **Semantic Doctor Search** - Find doctors by symptom description using AI embeddings
- **Symptom Analysis** - AI analyzes patient symptoms to suggest specialties
- **Availability Management** - Dynamic slot generation based on doctor schedules
- **Conflict Detection** - Prevents double-booking through graph traversal

For detailed information, see [Graph Implementation Guide](GRAPH_IMPLEMENTATION_GUIDE.md)

## 🌐 Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Add redirect URI: `http://localhost:3001/api/calendar/callback`
6. Copy Client ID and Secret to `.env`

## 📁 Project Structure

```text
tp_mcp/
├── backend/
│   ├── src/
│   │   ├── config/        # Database & app config
│   │   ├── middleware/    # Auth & error handling
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API routes
│   │   ├── scripts/       # Database seeding scripts
│   │   ├── services/      # Business logic
│   │   └── server.js      # Express app
│   └── package.json
├── web/
│   ├── public/
│   │   └── 3d/           # 3D assets
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities & API client
│   └── package.json
├── README.md
└── seeded_users.txt       # Test user credentials
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

