# Graph Architecture & Implementation
## MediBook Healthcare Platform - Visual Guide

---

## Table of Contents

1. [Entity-Relationship Graph](#entity-relationship-graph)
2. [Data Flow Graphs](#data-flow-graphs)
3. [RAG Pipeline Architecture](#rag-pipeline-architecture)
4. [Vector Space Visualization](#vector-space-visualization)
5. [API Request Flow](#api-request-flow)

---

## Entity-Relationship Graph

### Complete Graph Structure

```
                                    ┌─────────────────────────────────┐
                                    │          USER NODE              │
                                    │  ┌──────────────────────────┐  │
                                    │  │ id: UUID (PK)            │  │
                                    │  │ email: String (Unique)   │  │
                                    │  │ password: String (Hash)  │  │
                                    │  │ firstName: String        │  │
                                    │  │ lastName: String         │  │
                                    │  │ phone: String            │  │
                                    │  │ role: ENUM               │  │
                                    │  │ isActive: Boolean        │  │
                                    │  └──────────────────────────┘  │
                                    └───────┬─────────────┬───────────┘
                                            │             │
                                            │             │
                    ┌───────────────────────┘             └───────────────────────┐
                    │ (1:1)                                                       │ (1:M as client)
                    │ User.hasOne(Doctor)                                         │ User.hasMany(Appointment)
                    │ Doctor.belongsTo(User)                                      │ Appointment.belongsTo(User)
                    │                                                             │
                    ▼                                                             ▼
┌─────────────────────────────────┐                         ┌─────────────────────────────────┐
│       DOCTOR NODE               │                         │     APPOINTMENT NODE            │
│  ┌──────────────────────────┐  │                         │  ┌──────────────────────────┐  │
│  │ id: UUID (PK)            │  │                         │  │ id: UUID (PK)            │  │
│  │ userId: UUID (FK)        │  │                         │  │ clientId: UUID (FK)      │  │
│  │ specialization: String   │  │◄────────────────────────┼──│ doctorId: UUID (FK)      │  │
│  │ licenseNumber: String    │  │  (1:M)                  │  │ appointmentDate: Date    │  │
│  │ bio: Text                │  │  Doctor.hasMany()       │  │ startTime: Time          │  │
│  │ consultationFee: Decimal │  │  Appointment.belongsTo()│  │ endTime: Time            │  │
│  │ yearsOfExperience: Int   │  │                         │  │ status: ENUM             │  │
│  │ googleCalendarConnected  │  │                         │  │ reason: Text             │  │
│  │ googleCalendarToken: JSON│  │                         │  │ notes: Text              │  │
│  └──────────────────────────┘  │                         │  │ googleEventId: String    │  │
└───────┬─────────────┬───────────┘                         │  │ bookedVia: ENUM          │  │
        │             │                                     │  └──────────────────────────┘  │
        │             │                                     └─────────────────────────────────┘
        │             │
        │             └─────────────────────────┐
        │ (1:M)                                 │ (1:1)
        │ Doctor.hasMany(Availability)          │ Doctor.hasOne(DoctorEmbedding)
        │ Availability.belongsTo(Doctor)        │
        │                                       │
        ▼                                       ▼
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│    AVAILABILITY NODE            │   │   DOCTOR_EMBEDDING NODE         │
│  ┌──────────────────────────┐  │   │  ┌──────────────────────────┐  │
│  │ id: UUID (PK)            │  │   │  │ doctor_id: UUID (PK,FK)  │  │
│  │ doctorId: UUID (FK)      │  │   │  │ embedding: vector(1536)  │  │
│  │ dayOfWeek: Int (0-6)     │  │   │  │ content_hash: Text       │  │
│  │ startTime: Time          │  │   │  │ updated_at: Timestamp    │  │
│  │ endTime: Time            │  │   │  └──────────────────────────┘  │
│  │ slotDuration: Int        │  │   └─────────────────────────────────┘
│  │ isActive: Boolean        │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘


LEGEND:
━━━━━  Direct Foreign Key Relationship
─────  Association/Reference
(1:1)  One-to-One Relationship
(1:M)  One-to-Many Relationship
(M:1)  Many-to-One Relationship
```

---

## Graph Traversal Patterns

### Pattern 1: Client Booking Journey

```
START: User (Client)
│
├─ Step 1: Browse Doctors
│  └─ Query: User → Doctor → User (doctor profile)
│     SELECT * FROM Doctors JOIN Users ON Doctors.userId = Users.id
│
├─ Step 2: Check Availability
│  └─ Query: Doctor → Availability
│     SELECT * FROM Availabilities WHERE doctorId = ? AND dayOfWeek = ?
│
├─ Step 3: Get Available Slots
│  └─ Query: Doctor → Availability + Doctor → Appointment (existing)
│     Generate slots from Availability, exclude booked from Appointments
│
├─ Step 4: Book Appointment
│  └─ Insert: User (client) → Appointment ← Doctor
│     INSERT INTO Appointments (clientId, doctorId, date, time...)
│
└─ Step 5: View Appointments
   └─ Query: User → Appointment → Doctor → User (doctor info)
      SELECT * FROM Appointments 
      WHERE clientId = ? 
      JOIN Doctors ON Appointments.doctorId = Doctors.id
      JOIN Users ON Doctors.userId = Users.id
```

### Pattern 2: Doctor Dashboard View

```
START: User (Doctor)
│
├─ Step 1: Get Doctor Profile
│  └─ Query: User → Doctor
│     SELECT * FROM Doctors WHERE userId = ?
│
├─ Step 2: Get Today's Appointments
│  └─ Query: User → Doctor → Appointment → User (clients)
│     SELECT * FROM Appointments 
│     WHERE doctorId = (SELECT id FROM Doctors WHERE userId = ?)
│     AND appointmentDate = TODAY
│     JOIN Users ON Appointments.clientId = Users.id
│
├─ Step 3: Manage Availability
│  └─ Query/Update: Doctor → Availability
│     SELECT/UPDATE Availabilities WHERE doctorId = ?
│
└─ Step 4: Calendar Sync
   └─ External: Doctor → Google Calendar API
      Use googleCalendarToken to sync events
```

### Pattern 3: AI Doctor Recommendation (RAG)

```
START: User Query ("I have chest pain")
│
├─ Step 1: Symptom Analysis
│  └─ AI: Query → OpenRouter LLM → Specialty Classification
│     Input: "I have chest pain"
│     Output: { specialty: "Cardiology", confidence: 0.95 }
│
├─ Step 2: Generate Query Embedding
│  └─ AI: Query → OpenRouter Embeddings → Vector(1536)
│     Input: "I have chest pain"
│     Output: [0.023, -0.145, 0.891, ..., 0.234]
│
├─ Step 3: Vector Similarity Search
│  └─ Query: QueryVector → DoctorEmbedding → Doctor → User
│     SELECT d.*, u.*, (de.embedding <=> :queryVector) as distance
│     FROM doctor_embeddings de
│     JOIN Doctors d ON de.doctor_id = d.id
│     JOIN Users u ON d.userId = u.id
│     WHERE u.isActive = true
│     ORDER BY distance ASC
│     LIMIT 5
│
├─ Step 4: Check Availability
│  └─ Query: Doctor → Availability + Appointment
│     For each recommended doctor, get available slots
│
└─ Step 5: Return Recommendations
   └─ Response: Ranked list of doctors with availability
```

---

## Data Flow Graphs

### Flow 1: User Registration & Authentication

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REGISTRATION FLOW                           │
└─────────────────────────────────────────────────────────────────────┘

Client                  API Layer           Service Layer         Database
  │                        │                      │                   │
  │  POST /auth/register   │                      │                   │
  ├───────────────────────►│                      │                   │
  │  {email, password,     │  Validate Input      │                   │
  │   firstName, lastName, │  ────────────►       │                   │
  │   role}                │                      │                   │
  │                        │                      │  Check Email      │
  │                        │                      │  Exists           │
  │                        │                      ├──────────────────►│
  │                        │                      │                   │
  │                        │                      │◄──────────────────┤
  │                        │                      │  (email available)│
  │                        │                      │                   │
  │                        │                      │  Hash Password    │
  │                        │                      │  (bcrypt)         │
  │                        │                      │                   │
  │                        │                      │  Create User      │
  │                        │                      ├──────────────────►│
  │                        │                      │  INSERT INTO      │
  │                        │                      │  Users            │
  │                        │                      │                   │
  │                        │                      │◄──────────────────┤
  │                        │                      │  (user created)   │
  │                        │                      │                   │
  │                        │                      │  If role=doctor:  │
  │                        │                      │  Create Doctor    │
  │                        │                      ├──────────────────►│
  │                        │                      │  INSERT INTO      │
  │                        │                      │  Doctors          │
  │                        │                      │                   │
  │                        │                      │  Generate JWT     │
  │                        │                      │  Token            │
  │                        │◄─────────────────────┤                   │
  │                        │  {user, token}       │                   │
  │◄───────────────────────┤                      │                   │
  │  201 Created           │                      │                   │
  │  {user, token}         │                      │                   │
  │                        │                      │                   │
  │  Store token in        │                      │                   │
  │  localStorage          │                      │                   │
  │                        │                      │                   │
```

### Flow 2: AI-Powered Doctor Recommendation (RAG)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       RAG DOCTOR RECOMMENDATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────────────┘

Client          API Layer       Symptom         RAG Service      Embeddings     Database
                                Analyzer                         Service
  │                │               │                 │               │              │
  │  POST /ai/     │               │                 │               │              │
  │  recommend-    │               │                 │               │              │
  │  doctor        │               │                 │               │              │
  ├───────────────►│               │                 │               │              │
  │  {message:     │  Authenticate │                 │               │              │
  │   "chest       │  ────────►    │                 │               │              │
  │   pain"}       │               │                 │               │              │
  │                │               │                 │               │              │
  │                │  Call symptom │                 │               │              │
  │                │  analyzer     │                 │               │              │
  │                ├──────────────►│                 │               │              │
  │                │               │  Get available  │               │              │
  │                │               │  specialties    │               │              │
  │                │               ├─────────────────┼───────────────┼─────────────►│
  │                │               │                 │               │  SELECT      │
  │                │               │                 │               │  DISTINCT    │
  │                │               │                 │               │  specialization
  │                │               │◄────────────────┼───────────────┼──────────────┤
  │                │               │  [Cardiology,   │               │              │
  │                │               │   Neurology,...]│               │              │
  │                │               │                 │               │              │
  │                │               │  Call OpenRouter│               │              │
  │                │               │  LLM            │               │              │
  │                │               ├─────────────────►               │              │
  │                │               │  (OpenRouter API)               │              │
  │                │               │                 │               │              │
  │                │               │◄────────────────┤               │              │
  │                │               │  {specialty:    │               │              │
  │                │               │   "Cardiology", │               │              │
  │                │               │   confidence:   │               │              │
  │                │               │   0.95}         │               │              │
  │                │◄──────────────┤                 │               │              │
  │                │  Analysis     │                 │               │              │
  │                │  result       │                 │               │              │
  │                │               │                 │               │              │
  │                │  Call RAG     │                 │               │              │
  │                │  search       │                 │               │              │
  │                ├───────────────┼────────────────►│               │              │
  │                │               │                 │  Generate     │              │
  │                │               │                 │  query        │              │
  │                │               │                 │  embedding    │              │
  │                │               │                 ├──────────────►│              │
  │                │               │                 │               │  Call        │
  │                │               │                 │               │  OpenRouter  │
  │                │               │                 │               │  Embeddings  │
  │                │               │                 │               │              │
  │                │               │                 │◄──────────────┤              │
  │                │               │                 │  [0.023,      │              │
  │                │               │                 │   -0.145,     │              │
  │                │               │                 │   ...]        │              │
  │                │               │                 │               │              │
  │                │               │                 │  Vector       │              │
  │                │               │                 │  similarity   │              │
  │                │               │                 │  search       │              │
  │                │               │                 ├───────────────┼─────────────►│
  │                │               │                 │               │  SELECT *    │
  │                │               │                 │               │  FROM        │
  │                │               │                 │               │  doctor_     │
  │                │               │                 │               │  embeddings  │
  │                │               │                 │               │  ORDER BY    │
  │                │               │                 │               │  embedding   │
  │                │               │                 │               │  <=>         │
  │                │               │                 │               │  :vector     │
  │                │               │                 │               │  LIMIT 5     │
  │                │               │                 │◄──────────────┼──────────────┤
  │                │               │                 │  Top 5        │              │
  │                │               │                 │  doctors      │              │
  │                │               │                 │  (ranked)     │              │
  │                │◄──────────────┼─────────────────┤               │              │
  │                │  Recommended  │                 │               │              │
  │                │  doctors      │                 │               │              │
  │                │               │                 │               │              │
  │                │  Check        │                 │               │              │
  │                │  availability │                 │               │              │
  │                ├───────────────┼─────────────────┼───────────────┼─────────────►│
  │                │               │                 │               │  SELECT      │
  │                │               │                 │               │  available   │
  │                │               │                 │               │  slots       │
  │                │◄──────────────┼─────────────────┼───────────────┼──────────────┤
  │                │  Availability │                 │               │              │
  │                │               │                 │               │              │
  │                │  Generate     │                 │               │              │
  │                │  proposal     │                 │               │              │
  │                │  token (JWT)  │                 │               │              │
  │                │               │                 │               │              │
  │◄───────────────┤               │                 │               │              │
  │  200 OK        │               │                 │               │              │
  │  {            │               │                 │               │              │
  │   recommended  │               │                 │               │              │
  │   Doctor,      │               │                 │               │              │
  │   alternatives,│               │                 │               │              │
  │   availability,│               │                 │               │              │
  │   proposal     │               │                 │               │              │
  │   Token        │               │                 │               │              │
  │  }             │               │                 │               │              │
  │                │               │                 │               │              │
```

### Flow 3: Voice Appointment Booking

```
┌─────────────────────────────────────────────────────────────────────┐
│                    VOICE BOOKING FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

Client          Speech API      API Layer       AI Service      Database
(Browser)
  │                │                │               │              │
  │  User speaks:  │                │               │              │
  │  "Book with    │                │               │              │
  │   Dr. Smith    │                │               │              │
  │   tomorrow     │                │               │              │
  │   at 2pm"      │                │               │              │
  │                │                │               │              │
  │  Start         │                │               │              │
  │  recording     │                │               │              │
  ├───────────────►│                │               │              │
  │                │  Speech-to-    │               │              │
  │                │  Text          │               │              │
  │◄───────────────┤  (Web Speech   │               │              │
  │  "Book with    │   API)         │               │              │
  │   Dr. Smith    │                │               │              │
  │   tomorrow     │                │               │              │
  │   at 2pm"      │                │               │              │
  │                │                │               │              │
  │  POST /voice/  │                │               │              │
  │  process       │                │               │              │
  ├────────────────┼───────────────►│               │              │
  │  {transcript}  │                │  Extract      │              │
  │                │                │  intent       │              │
  │                │                ├──────────────►│              │
  │                │                │               │  Call        │
  │                │                │               │  OpenRouter  │
  │                │                │               │  LLM         │
  │                │                │               │              │
  │                │                │◄──────────────┤              │
  │                │                │  {intent:     │              │
  │                │                │   "book",     │              │
  │                │                │   doctorName: │              │
  │                │                │   "Smith",    │              │
  │                │                │   date:       │              │
  │                │                │   "2024-01-16"│              │
  │                │                │   time:       │              │
  │                │                │   "14:00"}    │              │
  │                │                │               │              │
  │                │                │  Find doctor  │              │
  │                │                ├───────────────┼─────────────►│
  │                │                │               │  SELECT *    │
  │                │                │               │  FROM Doctors│
  │                │                │               │  JOIN Users  │
  │                │                │               │  WHERE       │
  │                │                │               │  lastName    │
  │                │                │               │  LIKE '%Smith'
  │                │                │◄──────────────┼──────────────┤
  │                │                │  Doctor found │              │
  │                │                │               │              │
  │                │                │  Check        │              │
  │                │                │  availability │              │
  │                │                ├───────────────┼─────────────►│
  │                │                │               │  SELECT      │
  │                │                │               │  existing    │
  │                │                │               │  appointments│
  │                │                │◄──────────────┼──────────────┤
  │                │                │  Available    │              │
  │                │                │               │              │
  │                │                │  Book         │              │
  │                │                │  appointment  │              │
  │                │                ├───────────────┼─────────────►│
  │                │                │               │  INSERT INTO │
  │                │                │               │  Appointments│
  │                │                │               │  (bookedVia: │
  │                │                │               │   'voice')   │
  │                │                │◄──────────────┼──────────────┤
  │                │                │  Appointment  │              │
  │                │                │  created      │              │
  │                │                │               │              │
  │◄───────────────┼────────────────┤               │              │
  │  200 OK        │                │               │              │
  │  {success,     │                │               │              │
  │   message:     │                │               │              │
  │   "Confirmed   │                │               │              │
  │    for 2024-   │                │               │              │
  │    01-16 at    │                │               │              │
  │    14:00"}     │                │               │              │
  │                │                │               │              │
  │  Text-to-      │                │               │              │
  │  Speech        │                │               │              │
  ├───────────────►│                │               │              │
  │                │  Speak:        │               │              │
  │◄───────────────┤  "Your         │               │              │
  │                │   appointment  │               │              │
  │                │   is confirmed"│               │              │
  │                │                │               │              │
```

---

## RAG Pipeline Architecture

### Embedding Generation Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOCTOR EMBEDDING GENERATION                              │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────────┐
                        │   Doctor Profile     │
                        │   (Database)         │
                        └──────────┬───────────┘
                                   │
                                   │ Fetch doctor with user info
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Build Profile Text  │
                        │                      │
                        │  "Doctor Name: Dr.   │
                        │   Sarah Smith.       │
                        │   Specialization:    │
                        │   Cardiology.        │
                        │   Bio: Experienced   │
                        │   cardiologist...    │
                        │   Experience: 15     │
                        │   years.             │
                        │   Fee: $150"         │
                        └──────────┬───────────┘
                                   │
                                   │ Compute SHA256 hash
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Check if Changed    │
                        │  (compare hash)      │
                        └──────────┬───────────┘
                                   │
                                   │ If changed
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  OpenRouter          │
                        │  Embeddings API      │
                        │                      │
                        │  Model: text-        │
                        │  embedding-3-small   │
                        └──────────┬───────────┘
                                   │
                                   │ Generate 1536-dim vector
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  Embedding Vector    │
                        │                      │
                        │  [0.023, -0.145,     │
                        │   0.891, 0.234,      │
                        │   -0.567, 0.123,     │
                        │   ... (1536 dims)]   │
                        └──────────┬───────────┘
                                   │
                                   │ Store in database
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │  PostgreSQL          │
                        │  doctor_embeddings   │
                        │                      │
                        │  doctor_id | embedding│
                        │  ──────────┼──────────│
                        │  uuid-123  | vector   │
                        └──────────────────────┘
```

### Vector Similarity Search Process

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VECTOR SIMILARITY SEARCH                                 │
└─────────────────────────────────────────────────────────────────────────────┘

User Query: "I have chest pain and shortness of breath"
     │
     │ Step 1: Generate query embedding
     ▼
┌──────────────────────────────────────────────────────────────┐
│  OpenRouter Embeddings API                                   │
│  Input: "I have chest pain and shortness of breath"         │
│  Output: Query Vector Q = [q1, q2, q3, ..., q1536]         │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ Step 2: Compute cosine distance
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  PostgreSQL pgvector                                         │
│                                                              │
│  Doctor Embeddings:                                          │
│  ┌─────────────┬──────────────────────────────────────┐     │
│  │ Doctor ID   │ Embedding Vector                     │     │
│  ├─────────────┼──────────────────────────────────────┤     │
│  │ Dr. Smith   │ [0.025, -0.140, 0.895, ...]         │     │
│  │ (Cardiology)│                                      │     │
│  │             │ Distance from Q: 0.12 ◄─── Closest  │     │
│  ├─────────────┼──────────────────────────────────────┤     │
│  │ Dr. Jones   │ [0.020, -0.150, 0.880, ...]         │     │
│  │ (Cardiology)│                                      │     │
│  │             │ Distance from Q: 0.15                │     │
│  ├─────────────┼──────────────────────────────────────┤     │
│  │ Dr. Garcia  │ [-0.300, 0.450, -0.120, ...]        │     │
│  │ (Neurology) │                                      │     │
│  │             │ Distance from Q: 0.78                │     │
│  ├─────────────┼──────────────────────────────────────┤     │
│  │ Dr. Wilson  │ [0.600, 0.200, -0.350, ...]         │     │
│  │ (Pediatrics)│                                      │     │
│  │             │ Distance from Q: 0.92                │     │
│  └─────────────┴──────────────────────────────────────┘     │
│                                                              │
│  SQL Query:                                                  │
│  SELECT *, (embedding <=> :queryVector) as distance         │
│  FROM doctor_embeddings                                      │
│  ORDER BY distance ASC                                       │
│  LIMIT 5                                                     │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ Step 3: Return ranked results
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Ranked Doctors (by similarity)                              │
│                                                              │
│  1. Dr. Smith (Cardiology)     - Match Score: 0.88          │
│  2. Dr. Jones (Cardiology)     - Match Score: 0.85          │
│  3. Dr. Garcia (Neurology)     - Match Score: 0.22          │
│  4. Dr. Wilson (Pediatrics)    - Match Score: 0.08          │
└──────────────────────────────────────────────────────────────┘

Note: Match Score = 1 - distance (higher is better)
```

---

## Vector Space Visualization

### 2D Projection of Doctor Embeddings (Conceptual)

```
                                    Vector Space
                                    (1536 dimensions → 2D projection)

        Cardiology Cluster
              ┌────────────────────────────┐
              │                            │
              │    ● Dr. Smith             │
              │      (Cardiologist)        │
              │                            │
              │    ● Dr. Jones             │
              │      (Cardiologist)        │
              │                            │
              │    ● Dr. Lee               │
              │      (Cardiac Surgeon)     │
              │                            │
              └────────────────────────────┘
                         │
                         │
                         │
    ┌────────────────────┼────────────────────────────────┐
    │                    │                                │
    │                    │                                │
    │                    ▼                                │
    │         ★ Patient Query:                           │
    │         "chest pain, shortness                     │
    │          of breath"                                │
    │                    │                                │
    │                    │ (closest match)                │
    │                    │                                │
    │                                                     │
    │  Neurology Cluster                                 │   Pediatrics Cluster
    │  ┌──────────────────┐                              │   ┌──────────────────┐
    │  │                  │                              │   │                  │
    │  │  ● Dr. Garcia    │                              │   │  ● Dr. Wilson    │
    │  │    (Neurologist) │                              │   │    (Pediatrician)│
    │  │                  │                              │   │                  │
    │  │  ● Dr. Brown     │                              │   │  ● Dr. Taylor    │
    │  │    (Neurologist) │                              │   │    (Pediatrician)│
    │  │                  │                              │   │                  │
    │  └──────────────────┘                              │   └──────────────────┘
    │                                                     │
    └─────────────────────────────────────────────────────┘

Legend:
● = Doctor embedding vector
★ = Patient query vector
Distance = Cosine distance in 1536-dimensional space
Clusters = Doctors with similar specializations group together
```

### Embedding Dimensions Explained

```
Embedding Vector Structure (1536 dimensions)

Dimension Range    Semantic Meaning (Learned by Model)
───────────────    ────────────────────────────────────
0-200             General medical concepts
201-400           Specialty-specific terms
401-600           Symptoms and conditions
601-800           Treatment approaches
801-1000          Experience and credentials
1001-1200         Patient demographics
1201-1400         Procedural knowledge
1401-1536         Contextual nuances

Example Doctor Embedding:
Dr. Smith (Cardiologist, 15 years experience)

[
  0.023,   ← High activation for "medical"
  -0.145,  ← Low activation for "pediatric"
  0.891,   ← Very high for "cardiology"
  0.234,   ← Moderate for "heart"
  -0.567,  ← Negative for "children"
  0.123,   ← Low for "surgery"
  ...
  (1530 more dimensions)
]

Patient Query Embedding:
"chest pain and shortness of breath"

[
  0.025,   ← High activation for "medical"
  -0.140,  ← Low activation for "pediatric"
  0.895,   ← Very high for "cardiology"
  0.240,   ← Moderate for "heart"
  -0.560,  ← Negative for "children"
  0.120,   ← Low for "surgery"
  ...
]

→ Cosine Distance: 0.12 (very similar!)
→ Match Score: 0.88 (excellent match)
```

---

## API Request Flow

### Complete Request Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API REQUEST LIFECYCLE                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Client                                                              Server
  │                                                                    │
  │  1. HTTP Request                                                  │
  │  ─────────────────────────────────────────────────────────────►  │
  │  POST /api/appointments                                           │
  │  Headers: {                                                       │
  │    Authorization: Bearer <jwt-token>                              │
  │    Content-Type: application/json                                 │
  │  }                                                                │
  │  Body: {                                                          │
  │    doctorId: "uuid",                                              │
  │    appointmentDate: "2024-01-15",                                 │
  │    startTime: "14:00:00",                                         │
  │    endTime: "14:30:00"                                            │
  │  }                                                                │
  │                                                                    │
  │                                                                    ▼
  │                                                    ┌───────────────────────┐
  │                                                    │  Express Middleware   │
  │                                                    │  Pipeline             │
  │                                                    └───────────┬───────────┘
  │                                                                │
  │                                                                │ 2. CORS
  │                                                                │    Check origin
  │                                                                │
  │                                                                │ 3. Helmet
  │                                                                │    Set security headers
  │                                                                │
  │                                                                │ 4. Body Parser
  │                                                                │    Parse JSON
  │                                                                │
  │                                                                │ 5. Authenticate
  │                                                                │    Verify JWT
  │                                                                │    Load user
  │                                                                │
  │                                                                │ 6. Authorize
  │                                                                │    Check role
  │                                                                │
  │                                                                │ 7. Validate
  │                                                                │    Check input
  │                                                                │
  │                                                                ▼
  │                                                    ┌───────────────────────┐
  │                                                    │  Route Handler        │
  │                                                    └───────────┬───────────┘
  │                                                                │
  │                                                                ▼
  │                                                    ┌───────────────────────┐
  │                                                    │  Service Layer        │
  │                                                    │  (Business Logic)     │
  │                                                    └───────────┬───────────┘
  │                                                                │
  │                                                                │ 8. Check availability
  │                                                                │    Query database
  │                                                                │
  │                                                                │ 9. Create appointment
  │                                                                │    Insert record
  │                                                                │
  │                                                                │ 10. Sync calendar
  │                                                                │     (if connected)
  │                                                                │
  │                                                                ▼
  │                                                    ┌───────────────────────┐
  │                                                    │  Database Layer       │
  │                                                    │  (PostgreSQL)         │
  │                                                    └───────────┬───────────┘
  │                                                                │
  │                                                                │ 11. Transaction
  │                                                                │     BEGIN
  │                                                                │     INSERT
  │                                                                │     COMMIT
  │                                                                │
  │                                                                ▼
  │                                                    ┌───────────────────────┐
  │                                                    │  Response Builder     │
  │                                                    └───────────┬───────────┘
  │                                                                │
  │  12. HTTP Response                                            │
  │  ◄─────────────────────────────────────────────────────────── │
  │  201 Created                                                  │
  │  {                                                            │
  │    success: true,                                             │
  │    message: "Appointment booked successfully",                │
  │    data: {                                                    │
  │      appointment: {                                           │
  │        id: "uuid",                                            │
  │        appointmentDate: "2024-01-15",                         │
  │        startTime: "14:00:00",                                 │
  │        status: "confirmed"                                    │
  │      }                                                        │
  │    }                                                          │
  │  }                                                            │
  │                                                                │
```

---

## Graph Query Optimization

### Index Strategy

```sql
-- Appointment lookup by doctor and date (hot path)
CREATE INDEX idx_appointments_doctor_date 
ON "Appointments" ("doctorId", "appointmentDate", "status");

-- Appointment lookup by client
CREATE INDEX idx_appointments_client 
ON "Appointments" ("clientId", "appointmentDate");

-- Availability lookup by doctor and day
CREATE INDEX idx_availability_doctor_day 
ON "Availabilities" ("doctorId", "dayOfWeek", "isActive");

-- User lookup by email (login)
CREATE INDEX idx_users_email 
ON "Users" ("email");

-- Doctor lookup by user
CREATE INDEX idx_doctors_user 
ON "Doctors" ("userId");

-- Vector similarity search (IVFFlat index)
CREATE INDEX idx_embeddings_vector 
ON doctor_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
```

### Query Performance

```
Query: Get available slots for doctor on date

Without Index:
┌─────────────┐
│ Seq Scan    │  Cost: 1000-5000
│ Appointments│  Time: 50-200ms
└─────────────┘

With Index:
┌─────────────┐
│ Index Scan  │  Cost: 10-50
│ idx_doctor_ │  Time: 1-5ms
│ date        │
└─────────────┘

Speedup: 10-40x faster
```

---

## Conclusion

This graph architecture provides:

1. **Clear Entity Relationships** - Users, Doctors, Appointments, Availability
2. **Efficient Traversal** - Optimized with indexes and associations
3. **Semantic Search** - Vector embeddings for intelligent matching
4. **Scalability** - PostgreSQL with pgvector handles millions of records
5. **Maintainability** - Clean separation of concerns

The RAG system adds intelligence on top of the graph structure, enabling:
- Symptom-based doctor recommendations
- Natural language appointment booking
- Personalized healthcare experiences

---

**Document Version:** 1.0  
**Last Updated:** January 2024
