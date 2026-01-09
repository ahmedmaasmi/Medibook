# Backend Architecture Documentation
## MediBook Healthcare Appointment Platform

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Database Schema & Graph Implementation](#database-schema--graph-implementation)
5. [Core Components](#core-components)
6. [AI & RAG System](#ai--rag-system)
7. [API Reference](#api-reference)
8. [Data Flow](#data-flow)
9. [Security & Authentication](#security--authentication)
10. [Deployment Guide](#deployment-guide)

---

## Overview

The MediBook backend is a **Node.js/Express** RESTful API server that powers a healthcare appointment booking platform. It features:

- **AI-Powered Doctor Matching** using RAG (Retrieval-Augmented Generation)
- **Vector Embeddings** for semantic doctor search via PostgreSQL pgvector
- **Voice Agent** for natural language appointment booking
- **Google Calendar Integration** for doctor availability sync
- **JWT Authentication** with role-based access control
- **Graph-Based Data Model** representing relationships between Users, Doctors, Appointments, and Availability

### Key Features

✅ **Intelligent Doctor Recommendations** - Uses OpenAI embeddings + vector similarity search  
✅ **Symptom Analysis** - AI analyzes patient symptoms to suggest specialties  
✅ **Voice Booking** - Natural language processing for appointment scheduling  
✅ **Real-time Availability** - Dynamic slot generation based on doctor schedules  
✅ **Calendar Sync** - Two-way Google Calendar integration  

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  (Web App, Mobile App, Voice Interface)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Routes     │  │  Middleware  │  │   Services   │         │
│  │  (API Layer) │◄─┤  Auth/Error  │◄─┤ (Business    │         │
│  │              │  │   Handlers   │  │   Logic)     │         │
│  └──────────────┘  └──────────────┘  └──────┬───────┘         │
└────────────────────────────────────────────────┼────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────┐
                    │                            │                │
                    ▼                            ▼                ▼
         ┌──────────────────┐       ┌──────────────────┐  ┌──────────────┐
         │   PostgreSQL     │       │  OpenRouter AI   │  │   Google     │
         │   + pgvector     │       │   (Embeddings    │  │   Calendar   │
         │                  │       │    & Chat)       │  │     API      │
         │  ┌────────────┐  │       └──────────────────┘  └──────────────┘
         │  │  Sequelize │  │
         │  │    ORM     │  │
         │  └────────────┘  │
         │                  │
         │  Graph Schema:   │
         │  • Users         │
         │  • Doctors       │
         │  • Appointments  │
         │  • Availability  │
         │  • Embeddings    │
         └──────────────────┘
```

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Framework** | Express | 4.18.x | Web server framework |
| **Database** | PostgreSQL | 14+ | Primary data store |
| **ORM** | Sequelize | 6.35.x | Database modeling |
| **Vector DB** | pgvector | Latest | Semantic search |
| **AI Provider** | OpenRouter | 0.2.11 | LLM & embeddings |
| **Auth** | JWT | 9.0.x | Token-based auth |
| **Calendar** | Google APIs | 131.0.0 | Calendar integration |
| **Security** | Helmet | 7.1.x | HTTP headers security |
| **Validation** | express-validator | 7.0.x | Input validation |

---

## Database Schema & Graph Implementation

### Graph Structure Overview

The backend implements a **relational graph model** where entities (nodes) are connected through foreign keys (edges). This creates a directed graph of relationships:

```
                    ┌──────────┐
                    │   User   │
                    └─────┬────┘
                          │
              ┌───────────┴───────────┐
              │ (1:1)                 │ (1:M)
              ▼                       ▼
        ┌──────────┐           ┌──────────────┐
        │  Doctor  │           │ Appointment  │
        └────┬─────┘           │  (as client) │
             │                 └──────────────┘
             │ (1:M)
             ├─────────────┬──────────────┐
             ▼             ▼              ▼
    ┌──────────────┐  ┌──────────┐  ┌──────────────┐
    │ Availability │  │Appointment│  │   Doctor     │
    │              │  │(as doctor)│  │  Embeddings  │
    └──────────────┘  └──────────┘  └──────────────┘
```

### Entity Definitions

#### 1. **User Node** (Primary Entity)

```javascript
User {
  id: UUID (PK)
  email: String (Unique)
  password: String (Hashed)
  firstName: String
  lastName: String
  phone: String
  role: ENUM('client', 'doctor', 'admin')
  isActive: Boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Relationships:**
- `User → Doctor` (1:1) - A user can have one doctor profile
- `User → Appointment` (1:M as client) - A user can book many appointments

#### 2. **Doctor Node** (Extended Profile)

```javascript
Doctor {
  id: UUID (PK)
  userId: UUID (FK → User.id, Unique)
  specialization: String
  licenseNumber: String (Unique)
  bio: Text
  consultationFee: Decimal(10,2)
  yearsOfExperience: Integer
  googleCalendarConnected: Boolean
  googleCalendarToken: JSON
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Relationships:**
- `Doctor → User` (M:1) - Belongs to one user
- `Doctor → Availability` (1:M) - Has many availability slots
- `Doctor → Appointment` (1:M) - Has many appointments
- `Doctor → DoctorEmbedding` (1:1) - Has one vector embedding

#### 3. **Appointment Node** (Relationship Entity)

```javascript
Appointment {
  id: UUID (PK)
  clientId: UUID (FK → User.id)
  doctorId: UUID (FK → Doctor.id)
  appointmentDate: Date
  startTime: Time
  endTime: Time
  status: ENUM('pending', 'confirmed', 'cancelled', 'completed')
  reason: Text
  notes: Text
  googleEventId: String
  bookedVia: ENUM('web', 'mobile', 'voice', 'ai_rag')
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Unique Constraint:** `(doctorId, appointmentDate, startTime)` - Prevents double booking

**Relationships:**
- `Appointment → Doctor` (M:1) - Belongs to one doctor
- `Appointment → User` (M:1) - Belongs to one client

#### 4. **Availability Node** (Schedule Definition)

```javascript
Availability {
  id: UUID (PK)
  doctorId: UUID (FK → Doctor.id)
  dayOfWeek: Integer (0-6, 0=Sunday)
  startTime: Time
  endTime: Time
  slotDuration: Integer (minutes)
  isActive: Boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Relationships:**
- `Availability → Doctor` (M:1) - Belongs to one doctor

#### 5. **DoctorEmbedding Node** (Vector Store)

```sql
CREATE TABLE doctor_embeddings (
  doctor_id UUID PRIMARY KEY,
  embedding vector(1536),  -- pgvector type
  content_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Stores 1536-dimensional OpenAI embeddings for semantic doctor search

**Relationships:**
- `DoctorEmbedding → Doctor` (1:1) - One embedding per doctor

---

### Graph Traversal Examples

#### Example 1: Find all appointments for a client

```javascript
// Graph path: User → Appointment → Doctor → User
const appointments = await Appointment.findAll({
  where: { clientId: userId },
  include: [
    {
      model: Doctor,
      as: 'doctor',
      include: [{ 
        model: User, 
        as: 'user' 
      }]
    }
  ]
});
```

**Graph traversal:** `User(client) → Appointment → Doctor → User(doctor)`

#### Example 2: Find all patients for a doctor

```javascript
// Graph path: User(doctor) → Doctor → Appointment → User(client)
const doctor = await Doctor.findOne({ where: { userId: doctorUserId } });
const appointments = await Appointment.findAll({
  where: { doctorId: doctor.id },
  include: [{ 
    model: User, 
    as: 'client' 
  }]
});
```

**Graph traversal:** `User(doctor) → Doctor → Appointment → User(client)`

#### Example 3: Vector similarity search (RAG)

```sql
-- Graph path: Query → Embedding Space → Doctor → User
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

**Graph traversal:** `QueryVector → DoctorEmbedding → Doctor → User`

---

## Core Components

### 1. Server Entry Point (`server.js`)

**Responsibilities:**
- Initialize Express app
- Configure middleware (CORS, Helmet, JSON parsing)
- Connect to PostgreSQL database
- Setup API routes
- Start HTTP server

**Key Code:**

```javascript
const app = express();

// Security & parsing middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize database & models
await connectDatabase();
import './models/index.js'; // Loads associations

// Setup routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port);
```

---

### 2. Database Configuration (`config/database.js`)

**Key Features:**
- Sequelize ORM initialization
- PostgreSQL connection pooling
- **pgvector extension** setup for vector embeddings
- Auto-sync models in development

**Vector Extension Setup:**

```javascript
await sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');
await sequelize.query(`
  CREATE TABLE IF NOT EXISTS doctor_embeddings (
    doctor_id UUID PRIMARY KEY,
    embedding vector(1536),
    content_hash TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`);
```

---

### 3. Models (`models/`)

All models use Sequelize ORM and define the graph structure through associations.

**Association Setup (`models/index.js`):**

```javascript
// User ↔ Doctor (1:1)
User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });
Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Doctor ↔ Availability (1:M)
Doctor.hasMany(Availability, { foreignKey: 'doctorId', as: 'availabilities' });
Availability.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// Doctor ↔ Appointment (1:M)
Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// User ↔ Appointment (1:M as client)
User.hasMany(Appointment, { foreignKey: 'clientId', as: 'clientAppointments' });
Appointment.belongsTo(User, { foreignKey: 'clientId', as: 'client' });
```

**This creates a bidirectional graph where you can traverse in both directions.**

---

### 4. Routes (`routes/`)

RESTful API endpoints organized by domain:

| Route File | Base Path | Purpose |
|-----------|-----------|---------|
| `auth.routes.js` | `/api/auth` | Registration, login, token management |
| `appointment.routes.js` | `/api/appointments` | Book, cancel, reschedule appointments |
| `doctor.routes.js` | `/api/doctors` | List doctors, manage availability |
| `ai.routes.js` | `/api/ai` | AI-powered recommendations & booking |
| `chat.routes.js` | `/api/chat` | Chat interface for symptom analysis |
| `voice.routes.js` | `/api/voice` | Voice command processing |
| `calendar.routes.js` | `/api/calendar` | Google Calendar OAuth & sync |
| `admin.routes.js` | `/api/admin` | Admin operations |

---

### 5. Middleware (`middleware/`)

#### Authentication (`auth.js`)

```javascript
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, config.jwt.secret);
  const user = await User.findByPk(decoded.userId);
  req.user = user;
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
```

**Usage:**
```javascript
router.post('/appointments', 
  authenticate,           // Verify JWT
  authorize('client'),    // Only clients can book
  bookAppointmentHandler
);
```

#### Error Handler (`errorHandler.js`)

Centralized error handling with custom `AppError` class:

```javascript
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
};
```

#### Rate Limiting (`rateLimit.js`)

Protects AI endpoints from abuse:

```javascript
export const aiRateLimit = ({ max = 20 }) => {
  // Implementation using in-memory or Redis store
  // Limits requests per user per time window
};
```

---

## AI & RAG System

### Architecture Overview

The AI system consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    AI/RAG PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. SYMPTOM ANALYSIS                                        │
│     ┌──────────────────────────────────────────┐           │
│     │ User Input: "I have chest pain"          │           │
│     └──────────────┬───────────────────────────┘           │
│                    ▼                                        │
│     ┌──────────────────────────────────────────┐           │
│     │ OpenRouter LLM (symptom analyzer)        │           │
│     │ → Extracts: symptom, specialty,          │           │
│     │             confidence                    │           │
│     └──────────────┬───────────────────────────┘           │
│                    ▼                                        │
│     { symptom: "chest pain",                               │
│       specialty: "Cardiology",                             │
│       confidence: 0.92 }                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  2. VECTOR EMBEDDING & SEARCH (RAG)                        │
│     ┌──────────────────────────────────────────┐           │
│     │ Generate embedding for user query        │           │
│     └──────────────┬───────────────────────────┘           │
│                    ▼                                        │
│     ┌──────────────────────────────────────────┐           │
│     │ OpenRouter Embeddings API                │           │
│     │ Model: text-embedding-3-small            │           │
│     │ Output: 1536-dim vector                  │           │
│     └──────────────┬───────────────────────────┘           │
│                    ▼                                        │
│     [0.023, -0.145, 0.891, ..., 0.234]                     │
│                    │                                        │
│                    ▼                                        │
│     ┌──────────────────────────────────────────┐           │
│     │ PostgreSQL pgvector similarity search    │           │
│     │ SELECT * FROM doctor_embeddings          │           │
│     │ ORDER BY embedding <=> query_vector      │           │
│     │ LIMIT 5                                  │           │
│     └──────────────┬───────────────────────────┘           │
│                    ▼                                        │
│     Top 5 matching doctors (by semantic similarity)        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  3. RECOMMENDATION & BOOKING                               │
│     ┌──────────────────────────────────────────┐           │
│     │ Combine symptom analysis + RAG results   │           │
│     │ Check doctor availability                │           │
│     │ Generate booking proposal token          │           │
│     └──────────────┬───────────────────────────┘           │
│                    ▼                                        │
│     Return: { recommendedDoctor, alternatives,             │
│               availability, proposalToken }                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 1. Symptom Analysis Service

**File:** `services/symptomAnalyzer.service.js`

**Purpose:** Analyzes patient symptoms and maps them to medical specialties using LLM.

**Flow:**

```javascript
export const analyzeSymptom = async ({ message, userId }) => {
  // 1. Get available specialties from database
  const specialties = await getAvailableSpecialties();
  
  // 2. Build AI prompt
  const systemPrompt = `You are a medical symptom analyzer.
    Available Specialties: ${specialties.join(', ')}
    
    Respond with JSON:
    {
      "symptom": "original symptom",
      "normalized_symptom": "medical term",
      "specialty": "matching specialty",
      "confidence": 0.95
    }`;
  
  // 3. Call OpenRouter LLM
  const response = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ], { temperature: 0.1 });
  
  // 4. Parse and return result
  const result = JSON.parse(response.choices[0].message.content);
  return result;
};
```

**Example Input/Output:**

```javascript
// Input
{ message: "I've been having severe headaches and dizziness", userId: "..." }

// Output
{
  symptom: "severe headaches and dizziness",
  normalized_symptom: "cephalgia with vertigo",
  specialty: "Neurology",
  confidence: 0.88
}
```

---

### 2. Embeddings Service

**File:** `services/rag/embeddings.service.js`

**Purpose:** Generates vector embeddings for text using OpenRouter's embedding API.

**Implementation:**

```javascript
export const generateEmbedding = async (text) => {
  // Clean text
  const cleanText = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Call OpenRouter embeddings API
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.openRouter.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/text-embedding-3-small",
      input: cleanText
    })
  });
  
  const data = await response.json();
  return data.data[0].embedding; // Array of 1536 floats
};
```

**What gets embedded:**
- Doctor profiles (name, specialty, bio, experience)
- Patient queries (symptoms, concerns)

---

### 3. Doctor RAG Service

**File:** `services/rag/doctorRag.service.js`

**Purpose:** Manages doctor embeddings and performs semantic search.

#### Building Doctor Profile Text

```javascript
export const buildDoctorProfileText = (doctor) => {
  return [
    `Doctor Name: Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
    `Specialization: ${doctor.specialization}`,
    `Bio: ${doctor.bio || 'No bio available.'}`,
    `Experience: ${doctor.yearsOfExperience || 0} years`,
    `Consultation Fee: $${doctor.consultationFee || 0}`
  ].join('. ');
};
```

**Example:**
```
"Doctor Name: Dr. Sarah Smith. Specialization: Cardiology. Bio: Experienced cardiologist specializing in heart disease prevention. Experience: 15 years. Consultation Fee: $150"
```

#### Upserting Embeddings

```javascript
export const upsertDoctorEmbedding = async (doctorId) => {
  // 1. Fetch doctor with user info
  const doctor = await Doctor.findByPk(doctorId, {
    include: [{ model: User, as: 'user' }]
  });
  
  // 2. Build profile text
  const text = buildDoctorProfileText(doctor);
  
  // 3. Check if content changed (using SHA256 hash)
  const newHash = crypto.createHash('sha256').update(text).digest('hex');
  const existing = await sequelize.query(
    'SELECT content_hash FROM doctor_embeddings WHERE doctor_id = :id',
    { replacements: { id: doctorId } }
  );
  
  if (existing?.content_hash === newHash) {
    return false; // No change, skip
  }
  
  // 4. Generate new embedding
  const embedding = await generateEmbedding(text);
  
  // 5. Upsert to database
  await sequelize.query(`
    INSERT INTO doctor_embeddings (doctor_id, embedding, content_hash)
    VALUES (:id, :embedding, :hash)
    ON CONFLICT (doctor_id) 
    DO UPDATE SET 
      embedding = EXCLUDED.embedding,
      content_hash = EXCLUDED.content_hash,
      updated_at = NOW();
  `, {
    replacements: {
      id: doctorId,
      embedding: JSON.stringify(embedding), // pgvector accepts JSON array
      hash: newHash
    }
  });
};
```

#### Vector Similarity Search

```javascript
export const searchDoctorsByCase = async (queryText, options = {}) => {
  const { limit = 5, filterSpecialty } = options;
  
  // 1. Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText);
  const vectorStr = JSON.stringify(queryEmbedding);
  
  // 2. Build SQL with optional specialty filter
  let whereClause = `u."isActive" = true`;
  if (filterSpecialty) {
    whereClause += ` AND d."specialization" ILIKE :specialty`;
  }
  
  // 3. Perform cosine similarity search
  const sql = `
    SELECT 
      d.id, 
      d.specialization, 
      d.bio,
      u."firstName", 
      u."lastName",
      (de.embedding <=> :vector) as distance
    FROM doctor_embeddings de
    JOIN "Doctors" d ON de.doctor_id = d.id
    JOIN "Users" u ON d."userId" = u.id
    WHERE ${whereClause}
    ORDER BY distance ASC
    LIMIT :limit;
  `;
  
  // 4. Execute query
  const results = await sequelize.query(sql, {
    replacements: { vector: vectorStr, limit, specialty: filterSpecialty }
  });
  
  return results;
};
```

**Key Operator:** `<=>` is the **cosine distance** operator in pgvector
- Distance of 0 = identical vectors
- Distance of 2 = opposite vectors
- Lower distance = higher similarity

---

### 4. Doctor Matching Service

**File:** `services/doctorMatching.service.js`

**Purpose:** Orchestrates the full RAG pipeline for doctor recommendations.

**Main Function:**

```javascript
export const recommendDoctor = async ({ message, userId, date, time }) => {
  // STEP 1: Analyze symptoms
  const analysis = await symptomAnalyzer.analyzeSymptom({ message, userId });
  const { specialty, confidence } = analysis;
  
  // STEP 2: Determine search strategy
  let filterSpecialty = null;
  if (confidence > 0.6 && specialty !== 'General Practice') {
    filterSpecialty = specialty; // Strict filter
  }
  
  // STEP 3: RAG search
  let candidates = await doctorRagService.searchDoctorsByCase(message, { 
    limit: 5, 
    filterSpecialty 
  });
  
  // STEP 4: Fallback if no results
  if (candidates.length === 0 && filterSpecialty) {
    candidates = await doctorRagService.searchDoctorsByCase(message, { 
      limit: 5 
    });
  }
  
  // STEP 5: Format results
  const formattedCandidates = candidates.map(c => ({
    id: c.id,
    specialization: c.specialization,
    user: { firstName: c.firstName, lastName: c.lastName },
    matchScore: (1 - c.distance).toFixed(2) // Convert distance to similarity
  }));
  
  const bestDoctor = formattedCandidates[0];
  const alternatives = formattedCandidates.slice(1);
  
  // STEP 6: Check availability (if date/time provided)
  let availabilityInfo = {};
  if (date && time) {
    const isAvailable = await appointmentService.checkAvailability(
      bestDoctor.id, date, time + ':00', addMinutes(time + ':00', 30)
    );
    availabilityInfo = { isAvailable, proposedTime: time, proposedDate: date };
  } else if (date) {
    const slots = await appointmentService.getAvailableSlots(bestDoctor.id, date);
    availabilityInfo = { slots: slots.slice(0, 5) };
  }
  
  // STEP 7: Return recommendation
  return {
    recommendedDoctor: bestDoctor,
    alternatives,
    analysis,
    availability: availabilityInfo
  };
};
```

---

### 5. AI Service (Voice & Chat)

**File:** `services/ai.service.js`

**Purpose:** Handles voice commands and chat interactions.

#### Intent Extraction

```javascript
export const extractIntent = async (transcript) => {
  const systemPrompt = `Extract intent from user input.
    Possible intents: "book", "reschedule", "cancel", 
                     "check_availability", "list_appointments", 
                     "check_symptoms", "unknown"
    
    Respond with JSON:
    {
      "intent": "book",
      "doctorName": "Smith",
      "date": "2024-01-15",
      "time": "14:00",
      "reason": "checkup"
    }`;
  
  const response = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: transcript }
  ], { temperature: 0.1 });
  
  return JSON.parse(response.choices[0].message.content);
};
```

**Example:**

```javascript
// Input
"Book an appointment with Dr. Smith tomorrow at 2pm for a checkup"

// Output
{
  intent: "book",
  doctorName: "Smith",
  date: "2024-01-16",
  time: "14:00",
  reason: "checkup"
}
```

#### Voice Command Processing

```javascript
export const processVoiceCommand = async (transcript, userId, onToken) => {
  const intent = await extractIntent(transcript);
  
  switch (intent.intent) {
    case 'book':
      // Find doctor
      const doctor = await findDoctor(intent.doctorName);
      
      // Check availability
      const isAvailable = await appointmentService.checkAvailability(...);
      
      // Book appointment
      const appointment = await appointmentService.bookAppointment({
        clientId: userId,
        doctorId: doctor.id,
        appointmentDate: intent.date,
        startTime: intent.time,
        bookedVia: 'voice'
      });
      
      return {
        success: true,
        message: `Appointment confirmed for ${intent.date} at ${intent.time}`,
        data: { appointment }
      };
      
    case 'check_symptoms':
      // Delegate to symptom analyzer
      const analysis = await symptomAnalyzer.analyzeSymptom({ 
        message: transcript, 
        userId 
      });
      return { success: true, data: analysis };
      
    // ... other cases
  }
};
```

---

## API Reference

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "client"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "client"
    },
    "token": "jwt-token"
  }
}
```

---

#### POST `/api/auth/login`

Authenticate and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "jwt-token"
  }
}
```

---

### Doctor Endpoints

#### GET `/api/doctors`

List all active doctors.

**Query Parameters:**
- `specialization` (optional) - Filter by specialty
- `search` (optional) - Search by name

**Response:**
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "id": "uuid",
        "specialization": "Cardiology",
        "bio": "...",
        "consultationFee": 150,
        "yearsOfExperience": 15,
        "user": {
          "firstName": "Sarah",
          "lastName": "Smith",
          "email": "dr.smith@example.com"
        }
      }
    ]
  }
}
```

---

#### GET `/api/doctors/:id`

Get doctor details including availability.

**Response:**
```json
{
  "success": true,
  "data": {
    "doctor": {
      "id": "uuid",
      "specialization": "Cardiology",
      "availabilities": [
        {
          "dayOfWeek": 1,
          "startTime": "09:00:00",
          "endTime": "17:00:00",
          "slotDuration": 30
        }
      ]
    }
  }
}
```

---

### Appointment Endpoints

#### GET `/api/appointments/slots/:doctorId?date=YYYY-MM-DD`

Get available time slots for a doctor on a specific date.

**Response:**
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "startTime": "09:00:00",
        "endTime": "09:30:00",
        "available": true
      },
      {
        "startTime": "09:30:00",
        "endTime": "10:00:00",
        "available": true
      }
    ]
  }
}
```

---

#### POST `/api/appointments`

Book a new appointment.

**Request:**
```json
{
  "doctorId": "uuid",
  "appointmentDate": "2024-01-15",
  "startTime": "09:00:00",
  "endTime": "09:30:00",
  "reason": "Annual checkup"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "appointment": {
      "id": "uuid",
      "appointmentDate": "2024-01-15",
      "startTime": "09:00:00",
      "status": "confirmed",
      "bookedVia": "web"
    }
  }
}
```

---

#### GET `/api/appointments`

Get user's appointments (client or doctor view).

**Query Parameters:**
- `status` - Filter by status (pending, confirmed, cancelled, completed)
- `fromDate` - Start date filter
- `toDate` - End date filter

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "id": "uuid",
        "appointmentDate": "2024-01-15",
        "startTime": "09:00:00",
        "status": "confirmed",
        "doctor": {
          "specialization": "Cardiology",
          "user": {
            "firstName": "Sarah",
            "lastName": "Smith"
          }
        },
        "client": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ]
  }
}
```

---

#### PATCH `/api/appointments/:id/cancel`

Cancel an appointment.

**Response:**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "appointment": {
      "id": "uuid",
      "status": "cancelled"
    }
  }
}
```

---

### AI Endpoints

#### POST `/api/ai/recommend-doctor`

Get AI-powered doctor recommendation based on symptoms (RAG).

**Request:**
```json
{
  "message": "I have chest pain and shortness of breath",
  "date": "2024-01-15",
  "time": "14:00"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendedDoctor": {
      "id": "uuid",
      "specialization": "Cardiology",
      "user": {
        "firstName": "Sarah",
        "lastName": "Smith"
      },
      "matchScore": "0.94"
    },
    "alternatives": [ ... ],
    "analysis": {
      "symptom": "chest pain and shortness of breath",
      "specialty": "Cardiology",
      "confidence": 0.95
    },
    "availability": {
      "isAvailable": true,
      "proposedTime": "14:00",
      "proposedDate": "2024-01-15"
    },
    "proposalToken": "jwt-token-for-booking"
  }
}
```

---

#### POST `/api/ai/confirm-booking`

Confirm and book appointment from AI recommendation.

**Request:**
```json
{
  "proposalToken": "jwt-token",
  "confirm": "true",
  "selectedSlot": {
    "date": "2024-01-15",
    "startTime": "14:00:00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Appointment confirmed successfully",
  "data": {
    "appointment": { ... }
  }
}
```

---

#### POST `/api/ai/process`

Process voice command (alternative to `/api/voice/process`).

**Request:**
```json
{
  "transcript": "Book an appointment with Dr. Smith tomorrow at 2pm",
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intent": "book",
    "message": "Appointment confirmed for 2024-01-16 at 14:00",
    "data": {
      "appointment": { ... }
    }
  }
}
```

---

### Chat Endpoint

#### POST `/api/chat/message`

Send a chat message for symptom analysis or general queries.

**Request:**
```json
{
  "message": "I've been having headaches for 3 days",
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bot_message": "Based on your symptoms, you might benefit from seeing a Neurology specialist. I found 3 available doctors.",
    "suggested_specialty": "Neurology",
    "doctors": [
      {
        "id": "uuid",
        "specialization": "Neurology",
        "user": {
          "firstName": "Michael",
          "lastName": "Garcia"
        }
      }
    ],
    "intent": "check_symptoms"
  }
}
```

---

### Calendar Endpoints

#### GET `/api/calendar/auth-url`

Get Google OAuth URL for calendar connection.

**Headers:** `Authorization: Bearer <jwt-token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
}
```

---

#### GET `/api/calendar/callback?code=...&state=doctorId`

OAuth callback handler (redirect from Google).

**Response:** Redirects to frontend with success/error message.

---

#### GET `/api/calendar/status`

Check if doctor's calendar is connected.

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "calendarEmail": "doctor@gmail.com"
  }
}
```

---

#### POST `/api/calendar/disconnect`

Disconnect Google Calendar.

**Response:**
```json
{
  "success": true,
  "message": "Calendar disconnected successfully"
}
```

---

## Data Flow

### Flow 1: User Registration & Login

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/auth/register
     │ { email, password, firstName, lastName, role }
     ▼
┌────────────────┐
│  Auth Routes   │
└────┬───────────┘
     │ Validate input
     ▼
┌────────────────┐
│  Auth Service  │
└────┬───────────┘
     │ 1. Check if email exists
     │ 2. Hash password (bcrypt)
     │ 3. Create User record
     │ 4. If role='doctor', create Doctor record
     │ 5. Generate JWT token
     ▼
┌────────────────┐
│   Database     │
│  Users table   │
│  Doctors table │
└────┬───────────┘
     │ Return user + token
     ▼
┌──────────┐
│  Client  │
│ (Stores  │
│  token)  │
└──────────┘
```

---

### Flow 2: AI Doctor Recommendation (RAG)

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/ai/recommend-doctor
     │ { message: "chest pain", date, time }
     ▼
┌─────────────────────┐
│   AI Routes         │
│  (authenticate)     │
└────┬────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────┐
│         Doctor Matching Service                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  STEP 1: Symptom Analysis                          │
│  ┌───────────────────────────────────────┐         │
│  │ symptomAnalyzer.analyzeSymptom()      │         │
│  │ → OpenRouter LLM                      │         │
│  │ → Returns: { specialty, confidence }  │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 2: RAG Search                                │
│  ┌───────────────▼───────────────────────┐         │
│  │ doctorRagService.searchDoctorsByCase()│         │
│  │ 1. Generate query embedding           │         │
│  │ 2. Vector similarity search           │         │
│  │ 3. Return top 5 doctors               │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 3: Check Availability                        │
│  ┌───────────────▼───────────────────────┐         │
│  │ appointmentService.checkAvailability()│         │
│  │ or getAvailableSlots()                │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 4: Generate Proposal Token                   │
│  ┌───────────────▼───────────────────────┐         │
│  │ jwt.sign({ doctorId, date, time })    │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
└──────────────────┼──────────────────────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │   Response   │
            │ {            │
            │  recommended │
            │  Doctor,     │
            │  alternatives│
            │  availability│
            │  proposal    │
            │  Token       │
            │ }            │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │   Client     │
            │ (Shows UI    │
            │  to confirm) │
            └──────────────┘
```

---

### Flow 3: Booking Confirmation

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/ai/confirm-booking
     │ { proposalToken, confirm: true, selectedSlot }
     ▼
┌─────────────────────┐
│   AI Routes         │
└────┬────────────────┘
     │ 1. Verify JWT token
     │ 2. Extract doctorId, date, time
     ▼
┌─────────────────────┐
│ Appointment Service │
└────┬────────────────┘
     │ 1. Check availability (double-check)
     │ 2. Create Appointment record
     │ 3. If doctor has Google Calendar:
     │    → calendarService.createCalendarEvent()
     ▼
┌────────────────┐
│   Database     │
│  Appointments  │
└────┬───────────┘
     │
     ▼
┌────────────────┐
│ Google Calendar│
│ (if connected) │
└────┬───────────┘
     │
     ▼
┌──────────────┐
│  Response    │
│ { appointment│
│   details }  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Client     │
│ (Shows       │
│  confirmation│
└──────────────┘
```

---

### Flow 4: Voice Appointment Booking

```
┌──────────┐
│  Client  │
│ (Voice   │
│  Input)  │
└────┬─────┘
     │ Speech-to-Text (Browser API or mobile)
     │ → "Book appointment with Dr. Smith tomorrow at 2pm"
     ▼
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/voice/process
     │ { transcript: "..." }
     ▼
┌─────────────────────┐
│   Voice Routes      │
└────┬────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────┐
│              AI Service                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  STEP 1: Extract Intent                            │
│  ┌───────────────────────────────────────┐         │
│  │ extractIntent(transcript)             │         │
│  │ → OpenRouter LLM                      │         │
│  │ → { intent: "book",                   │         │
│  │     doctorName: "Smith",              │         │
│  │     date: "2024-01-16",               │         │
│  │     time: "14:00" }                   │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 2: Find Doctor                               │
│  ┌───────────────▼───────────────────────┐         │
│  │ findDoctor("Smith")                   │         │
│  │ → Search Users where lastName LIKE    │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 3: Check Availability                        │
│  ┌───────────────▼───────────────────────┐         │
│  │ appointmentService.checkAvailability()│         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 4: Book Appointment                          │
│  ┌───────────────▼───────────────────────┐         │
│  │ appointmentService.bookAppointment()  │         │
│  │ { bookedVia: 'voice' }                │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 5: Generate Response                         │
│  ┌───────────────▼───────────────────────┐         │
│  │ "Your appointment is confirmed for    │         │
│  │  2024-01-16 at 14:00"                 │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
└──────────────────┼──────────────────────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │   Response   │
            │ { success,   │
            │   message,   │
            │   data }     │
            └──────┬───────┘
                   │
                   ▼
            ┌──────────────┐
            │   Client     │
            │ (Text-to-    │
            │  Speech)     │
            └──────────────┘
```

---

### Flow 5: Doctor Embedding Generation

```
┌──────────────────┐
│  Admin/Script    │
│  (Seed/Reindex)  │
└────┬─────────────┘
     │ Call: upsertDoctorEmbedding(doctorId)
     ▼
┌─────────────────────────────────────────────────────┐
│         Doctor RAG Service                          │
├─────────────────────────────────────────────────────┤
│                                                     │
│  STEP 1: Fetch Doctor                              │
│  ┌───────────────────────────────────────┐         │
│  │ Doctor.findByPk(doctorId)             │         │
│  │ include: User                         │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 2: Build Profile Text                        │
│  ┌───────────────▼───────────────────────┐         │
│  │ buildDoctorProfileText(doctor)        │         │
│  │ → "Doctor Name: Dr. Smith.            │         │
│  │    Specialization: Cardiology..."     │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 3: Check if Changed                          │
│  ┌───────────────▼───────────────────────┐         │
│  │ SHA256 hash of text                   │         │
│  │ Compare with existing content_hash    │         │
│  │ If same → skip                        │         │
│  └───────────────┬───────────────────────┘         │
│                  │ (if changed)                     │
│                  │                                  │
│  STEP 4: Generate Embedding                        │
│  ┌───────────────▼───────────────────────┐         │
│  │ embeddings.generateEmbedding(text)    │         │
│  │ → OpenRouter Embeddings API           │         │
│  │ → [0.023, -0.145, ..., 0.234]        │         │
│  │    (1536 dimensions)                  │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
│  STEP 5: Upsert to Database                        │
│  ┌───────────────▼───────────────────────┐         │
│  │ INSERT INTO doctor_embeddings         │         │
│  │ ON CONFLICT (doctor_id)               │         │
│  │ DO UPDATE SET embedding = ...         │         │
│  └───────────────┬───────────────────────┘         │
│                  │                                  │
└──────────────────┼──────────────────────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │  PostgreSQL  │
            │  pgvector    │
            │  (Indexed)   │
            └──────────────┘
```

---

## Security & Authentication

### JWT Authentication

**Token Structure:**

```json
{
  "userId": "uuid",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Lifecycle:**

1. **Login:** User provides email/password → Server validates → Generates JWT
2. **Request:** Client sends `Authorization: Bearer <token>` header
3. **Verification:** `authenticate` middleware verifies token and loads user
4. **Authorization:** `authorize` middleware checks user role
5. **Refresh:** `/api/auth/refresh` generates new token before expiry

**Security Features:**

- Passwords hashed with **bcrypt** (10 salt rounds)
- Tokens expire after **7 days** (configurable)
- HTTPS required in production
- **Helmet** middleware for security headers
- **CORS** configured for specific origins
- Rate limiting on AI endpoints

---

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **client** | Book appointments, view own appointments, cancel own appointments |
| **doctor** | View own appointments, manage availability, connect calendar, view patient details |
| **admin** | All permissions, manage users, view all appointments |

**Implementation:**

```javascript
// Only clients can book appointments
router.post('/appointments', 
  authenticate, 
  authorize('client'), 
  bookAppointmentHandler
);

// Only doctors can set availability
router.post('/doctors/availability', 
  authenticate, 
  authorize('doctor'), 
  setAvailabilityHandler
);

// Only admins can access admin routes
router.use('/admin', 
  authenticate, 
  authorize('admin'), 
  adminRoutes
);
```

---

### Data Validation

**Input Validation** using `express-validator`:

```javascript
router.post('/appointments',
  [
    body('doctorId').isUUID(),
    body('appointmentDate').isDate(),
    body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
    body('endTime').matches(/^\d{2}:\d{2}(:\d{2})?$/),
    body('reason').optional().isString().trim().escape()
  ],
  handleValidationErrors,
  bookAppointmentHandler
);
```

**SQL Injection Prevention:**
- All queries use Sequelize ORM with parameterized queries
- Raw SQL queries use `:paramName` placeholders
- User input sanitized before embedding generation

---

## Deployment Guide

### Prerequisites

- **Node.js** 18+ LTS
- **PostgreSQL** 14+ with **pgvector** extension
- **OpenRouter API Key** (for AI features)
- **Google OAuth Credentials** (for calendar sync)

---

### Step 1: Database Setup

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install pgvector extension
sudo apt install postgresql-14-pgvector

# Create database
sudo -u postgres createdb doctor_appointments

# Create user
sudo -u postgres psql
CREATE USER medibook WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE doctor_appointments TO medibook;
\q
```

---

### Step 2: Environment Configuration

Create `.env` file in `backend/` directory:

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DATABASE_URL=postgresql://medibook:secure_password@localhost:5432/doctor_appointments

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/calendar/callback

# CORS
CORS_ORIGIN=https://yourdomain.com
```

---

### Step 3: Install Dependencies

```bash
cd backend
npm install --production
```

---

### Step 4: Database Migration

```bash
# Run migrations (first time)
npm run start

# The server will automatically:
# 1. Create pgvector extension
# 2. Create doctor_embeddings table
# 3. Sync Sequelize models
```

---

### Step 5: Seed Data (Optional)

```bash
# Seed test users and doctors
npm run seed

# Reindex doctor embeddings
node src/scripts/reindexDoctorEmbeddings.js
```

---

### Step 6: Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Using PM2 (recommended for production):**
```bash
npm install -g pm2
pm2 start src/server.js --name medibook-api
pm2 save
pm2 startup
```

---

### Step 7: Nginx Reverse Proxy (Production)

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable HTTPS with Let's Encrypt:
```bash
sudo certbot --nginx -d api.yourdomain.com
```

---

### Step 8: Health Check

```bash
curl http://localhost:3001/api/health

# Expected response:
{
  "success": true,
  "message": "Doctor Appointment API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Monitoring & Logging

**PM2 Logs:**
```bash
pm2 logs medibook-api
pm2 monit
```

**Database Monitoring:**
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'doctor_appointments';

-- Check embedding table size
SELECT pg_size_pretty(pg_total_relation_size('doctor_embeddings'));

-- Check vector index performance
EXPLAIN ANALYZE 
SELECT * FROM doctor_embeddings 
ORDER BY embedding <=> '[0.1, 0.2, ...]' 
LIMIT 5;
```

---

## Performance Optimization

### Database Indexing

```sql
-- Index on appointments for availability checks
CREATE INDEX idx_appointments_doctor_date 
ON "Appointments" ("doctorId", "appointmentDate", "status");

-- Index on availability for slot generation
CREATE INDEX idx_availability_doctor_day 
ON "Availabilities" ("doctorId", "dayOfWeek", "isActive");

-- Vector index for fast similarity search (IVFFlat)
CREATE INDEX ON doctor_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

### Caching Strategy

**Redis Caching (optional):**

```javascript
// Cache doctor embeddings in Redis
const cachedEmbedding = await redis.get(`doctor:${doctorId}:embedding`);
if (cachedEmbedding) {
  return JSON.parse(cachedEmbedding);
}

const embedding = await generateEmbedding(text);
await redis.set(`doctor:${doctorId}:embedding`, JSON.stringify(embedding), 'EX', 3600);
```

### Rate Limiting

```javascript
// Protect AI endpoints
export const aiRateLimit = ({ max = 20 }) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max, // requests per window
    message: 'Too many AI requests, please try again later.'
  });
};
```

---

## Troubleshooting

### Common Issues

#### 1. pgvector Extension Not Found

```bash
# Install pgvector
sudo apt install postgresql-14-pgvector

# Or build from source
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

#### 2. OpenRouter API Errors

```javascript
// Check API key
console.log('API Key:', config.openRouter.apiKey ? 'Set' : 'Missing');

// Test embedding generation
const test = await generateEmbedding('test');
console.log('Embedding dimensions:', test.length); // Should be 1536
```

#### 3. JWT Token Expired

```javascript
// Implement token refresh logic
router.post('/auth/refresh', authenticate, async (req, res) => {
  const newToken = generateToken(req.user.id);
  res.json({ token: newToken });
});
```

#### 4. Google Calendar Sync Fails

```javascript
// Check token expiry and refresh
if (error.code === 401) {
  const { credentials } = await oauth2Client.refreshAccessToken();
  await Doctor.update({ googleCalendarToken: credentials }, { where: { id } });
}
```

---

## Conclusion

The MediBook backend is a sophisticated healthcare platform that combines:

1. **Graph-Based Data Model** - Relational entities with clear relationships
2. **AI-Powered Matching** - RAG system using vector embeddings
3. **Voice Interface** - Natural language processing for booking
4. **Real-Time Availability** - Dynamic slot generation
5. **Calendar Integration** - Two-way sync with Google Calendar

**Key Technologies:**
- PostgreSQL + pgvector for semantic search
- Sequelize ORM for graph relationships
- OpenRouter for LLM and embeddings
- JWT for secure authentication
- Express for RESTful API

**Graph Implementation Highlights:**
- Users, Doctors, Appointments, and Availability form a connected graph
- Vector embeddings enable semantic doctor search
- Efficient traversal using Sequelize associations
- Optimized with database indexes

This architecture provides a scalable, maintainable, and intelligent healthcare booking system.

---

## Additional Resources

- **Sequelize Documentation:** https://sequelize.org/docs/v6/
- **pgvector GitHub:** https://github.com/pgvector/pgvector
- **OpenRouter API:** https://openrouter.ai/docs
- **Google Calendar API:** https://developers.google.com/calendar

---

**Document Version:** 1.0  
**Last Updated:** January 2024  
**Author:** MediBook Development Team
