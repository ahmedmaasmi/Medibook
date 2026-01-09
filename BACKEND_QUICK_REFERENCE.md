# Backend Quick Reference Guide
## MediBook Healthcare Platform

---

## 🚀 Quick Start

```bash
# Install dependencies
cd backend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev

# Seed database
npm run seed

# Run tests
npm test
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js      # PostgreSQL + pgvector setup
│   │   └── index.js         # Environment variables
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # JWT authentication & authorization
│   │   ├── errorHandler.js  # Global error handling
│   │   └── rateLimit.js     # API rate limiting
│   │
│   ├── models/              # Sequelize models (Graph nodes)
│   │   ├── User.js          # User entity
│   │   ├── Doctor.js        # Doctor profile
│   │   ├── Appointment.js   # Appointment bookings
│   │   ├── Availability.js  # Doctor schedules
│   │   └── index.js         # Model associations (Graph edges)
│   │
│   ├── routes/              # API endpoints
│   │   ├── auth.routes.js   # /api/auth/*
│   │   ├── appointment.routes.js  # /api/appointments/*
│   │   ├── doctor.routes.js       # /api/doctors/*
│   │   ├── ai.routes.js           # /api/ai/*
│   │   ├── chat.routes.js         # /api/chat/*
│   │   ├── voice.routes.js        # /api/voice/*
│   │   ├── calendar.routes.js     # /api/calendar/*
│   │   └── admin.routes.js        # /api/admin/*
│   │
│   ├── services/            # Business logic
│   │   ├── ai.service.js           # Voice & intent processing
│   │   ├── appointment.service.js  # Booking logic
│   │   ├── auth.service.js         # Authentication
│   │   ├── calendar.service.js     # Google Calendar sync
│   │   ├── chat.service.js         # Chat orchestration
│   │   ├── doctorMatching.service.js  # RAG orchestration
│   │   ├── symptomAnalyzer.service.js # Symptom → Specialty
│   │   └── rag/
│   │       ├── embeddings.service.js  # Vector generation
│   │       └── doctorRag.service.js   # Vector search
│   │
│   ├── scripts/             # Utility scripts
│   │   ├── seed.js          # Database seeding
│   │   └── reindexDoctorEmbeddings.js
│   │
│   └── server.js            # Express app entry point
│
└── package.json
```

---

## 🗄️ Database Schema (Graph Model)

### Entities (Nodes)

| Entity | Primary Key | Description |
|--------|-------------|-------------|
| **Users** | id (UUID) | All users (clients, doctors, admins) |
| **Doctors** | id (UUID) | Doctor profiles (extends User) |
| **Appointments** | id (UUID) | Booking records |
| **Availabilities** | id (UUID) | Doctor schedules |
| **doctor_embeddings** | doctor_id (UUID) | Vector embeddings (1536-dim) |

### Relationships (Edges)

```
User ──(1:1)──► Doctor
User ──(1:M)──► Appointment (as client)
Doctor ──(1:M)──► Appointment
Doctor ──(1:M)──► Availability
Doctor ──(1:1)──► doctor_embeddings
```

---

## 🔑 Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/doctor_appointments

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/callback
```

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login & get JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/auth/verify` | ✅ | Verify token |
| POST | `/api/auth/refresh` | ✅ | Refresh token |

### Doctors

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/doctors` | ✅ | List all doctors |
| GET | `/api/doctors/:id` | ✅ | Get doctor details |
| POST | `/api/doctors/availability` | ✅ (doctor) | Set availability |
| GET | `/api/doctors/availability` | ✅ (doctor) | Get own availability |

### Appointments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/appointments` | ✅ | List user's appointments |
| POST | `/api/appointments` | ✅ (client) | Book appointment |
| GET | `/api/appointments/slots/:doctorId` | ✅ | Get available slots |
| PATCH | `/api/appointments/:id/cancel` | ✅ | Cancel appointment |
| PATCH | `/api/appointments/:id/reschedule` | ✅ | Reschedule appointment |

### AI & RAG

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/recommend-doctor` | ✅ | RAG-based doctor recommendation |
| POST | `/api/ai/confirm-booking` | ✅ | Confirm AI recommendation |
| POST | `/api/ai/analyze-symptom` | ✅ | Symptom analysis only |
| POST | `/api/ai/extract-intent` | ✅ | Extract intent from text |
| POST | `/api/ai/process` | ✅ | Process voice command |

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat/message` | ✅ | Send chat message |

### Voice

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/voice/process` | ✅ | Process voice transcript |

### Calendar

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/calendar/auth-url` | ✅ (doctor) | Get OAuth URL |
| GET | `/api/calendar/callback` | ❌ | OAuth callback |
| GET | `/api/calendar/status` | ✅ (doctor) | Check connection |
| POST | `/api/calendar/disconnect` | ✅ (doctor) | Disconnect calendar |

---

## 🧠 AI/RAG System

### Components

1. **Symptom Analyzer** - Analyzes symptoms → suggests specialty
2. **Embeddings Service** - Generates 1536-dim vectors
3. **Doctor RAG Service** - Vector similarity search
4. **Doctor Matching Service** - Orchestrates full pipeline
5. **AI Service** - Voice/chat intent extraction

### RAG Flow

```
User Query → Symptom Analysis → Generate Embedding → Vector Search → Rank Doctors → Check Availability → Return Recommendations
```

### Key Functions

```javascript
// Generate embedding
const embedding = await generateEmbedding(text);
// Returns: Float32Array[1536]

// Analyze symptom
const analysis = await symptomAnalyzer.analyzeSymptom({ message, userId });
// Returns: { symptom, normalized_symptom, specialty, confidence }

// Search doctors
const doctors = await doctorRagService.searchDoctorsByCase(query, { limit: 5 });
// Returns: Array of doctors ranked by similarity

// Recommend doctor
const result = await doctorMatchingService.recommendDoctor({ message, userId, date, time });
// Returns: { recommendedDoctor, alternatives, analysis, availability, proposalToken }
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure

```json
{
  "userId": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Middleware Usage

```javascript
// Require authentication
router.get('/protected', authenticate, handler);

// Require specific role
router.post('/appointments', authenticate, authorize('client'), handler);

// Multiple roles
router.get('/dashboard', authenticate, authorize('doctor', 'admin'), handler);
```

### Roles

- **client** - Can book appointments, view own appointments
- **doctor** - Can manage availability, view appointments, connect calendar
- **admin** - Full access to all resources

---

## 📊 Database Queries

### Common Patterns

#### Get User's Appointments

```javascript
const appointments = await Appointment.findAll({
  where: { clientId: userId },
  include: [
    {
      model: Doctor,
      as: 'doctor',
      include: [{ model: User, as: 'user' }]
    }
  ],
  order: [['appointmentDate', 'ASC']]
});
```

#### Check Availability

```javascript
const isAvailable = await Appointment.findOne({
  where: {
    doctorId,
    appointmentDate: date,
    status: { [Op.notIn]: ['cancelled'] },
    [Op.or]: [
      {
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime }
      }
    ]
  }
});
```

#### Vector Similarity Search

```sql
SELECT 
  d.id, 
  d.specialization,
  u."firstName",
  u."lastName",
  (de.embedding <=> :queryVector) as distance
FROM doctor_embeddings de
JOIN "Doctors" d ON de.doctor_id = d.id
JOIN "Users" u ON d."userId" = u.id
WHERE u."isActive" = true
ORDER BY distance ASC
LIMIT 5;
```

---

## 🛠️ Utility Scripts

### Seed Database

```bash
npm run seed
```

Creates:
- 10 test users (clients)
- 5 doctors with different specializations
- Sample availability schedules

### Reindex Embeddings

```bash
node src/scripts/reindexDoctorEmbeddings.js
```

Regenerates vector embeddings for all doctors.

---

## 🧪 Testing

### Run Tests

```bash
npm test
```

### Test Files

- `tests/doctorMatching.test.js` - RAG system tests

### Manual Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

---

## 🐛 Debugging

### Enable Sequelize Logging

```javascript
// config/database.js
logging: console.log  // Enable SQL logging
```

### Check Database Connection

```javascript
await sequelize.authenticate();
console.log('✅ Database connected');
```

### Verify pgvector Extension

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Check Embeddings

```sql
SELECT doctor_id, pg_column_size(embedding) as size, updated_at 
FROM doctor_embeddings;
```

---

## 🚨 Common Issues

### Issue: pgvector not found

**Solution:**
```bash
sudo apt install postgresql-14-pgvector
# Or build from source
```

### Issue: JWT token expired

**Solution:**
```javascript
// Call refresh endpoint
POST /api/auth/refresh
```

### Issue: OpenRouter API error

**Solution:**
```bash
# Check API key
echo $OPENROUTER_API_KEY

# Test embedding
curl https://openrouter.ai/api/v1/embeddings \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "openai/text-embedding-3-small", "input": "test"}'
```

### Issue: Google Calendar sync fails

**Solution:**
```javascript
// Refresh OAuth token
const { credentials } = await oauth2Client.refreshAccessToken();
await Doctor.update({ googleCalendarToken: credentials }, { where: { id } });
```

---

## 📈 Performance Tips

### Database Indexing

```sql
-- Critical indexes
CREATE INDEX idx_appointments_doctor_date ON "Appointments" ("doctorId", "appointmentDate", "status");
CREATE INDEX idx_availability_doctor_day ON "Availabilities" ("doctorId", "dayOfWeek", "isActive");
CREATE INDEX ON doctor_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Caching Strategy

```javascript
// Cache doctor embeddings
const cached = await redis.get(`doctor:${id}:embedding`);
if (cached) return JSON.parse(cached);

const embedding = await generateEmbedding(text);
await redis.set(`doctor:${id}:embedding`, JSON.stringify(embedding), 'EX', 3600);
```

### Rate Limiting

```javascript
// Protect AI endpoints
aiRateLimit({ max: 20 })  // 20 requests per 15 minutes
```

---

## 🔗 External Services

### OpenRouter

- **Website:** https://openrouter.ai
- **Models Used:**
  - Chat: `openrouter/auto` (auto-selects best free model)
  - Embeddings: `openai/text-embedding-3-small`

### Google Calendar API

- **Console:** https://console.cloud.google.com
- **Scopes:**
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`

---

## 📚 Key Concepts

### Graph Model

The database implements a **relational graph** where:
- **Nodes** = Entities (Users, Doctors, Appointments, etc.)
- **Edges** = Foreign key relationships
- **Traversal** = JOIN queries through associations

### RAG (Retrieval-Augmented Generation)

1. **Retrieval** - Find relevant doctors using vector similarity
2. **Augmentation** - Combine with symptom analysis
3. **Generation** - Produce personalized recommendations

### Vector Embeddings

- **Dimension:** 1536 (OpenAI text-embedding-3-small)
- **Distance Metric:** Cosine distance (`<=>` operator)
- **Storage:** PostgreSQL pgvector extension
- **Index:** IVFFlat for fast approximate search

---

## 🎯 Best Practices

### Security

✅ Always hash passwords with bcrypt  
✅ Use JWT for stateless authentication  
✅ Validate all user input  
✅ Use parameterized queries  
✅ Enable CORS only for trusted origins  
✅ Set security headers with Helmet  

### Performance

✅ Index frequently queried columns  
✅ Use connection pooling  
✅ Cache expensive operations  
✅ Limit API rate for AI endpoints  
✅ Use vector indexes for embeddings  

### Code Quality

✅ Follow RESTful conventions  
✅ Separate concerns (routes/services/models)  
✅ Handle errors gracefully  
✅ Log important events  
✅ Write tests for critical paths  

---

## 📞 Support

- **Documentation:** See `BACKEND_DOCUMENTATION.md` for detailed info
- **Architecture:** See `GRAPH_ARCHITECTURE.md` for visual diagrams
- **Issues:** Check troubleshooting section above

---

**Last Updated:** January 2024  
**Version:** 1.0
