# Graph Implementation Guide
## Understanding the Graph-Based Architecture

---

## Table of Contents

1. [What is a Graph Database Model?](#what-is-a-graph-database-model)
2. [Why Use a Graph Model?](#why-use-a-graph-model)
3. [Implementation in PostgreSQL](#implementation-in-postgresql)
4. [Graph Traversal Examples](#graph-traversal-examples)
5. [Vector Graph Extension](#vector-graph-extension)
6. [Performance Optimization](#performance-optimization)
7. [Real-World Use Cases](#real-world-use-cases)

---

## What is a Graph Database Model?

A **graph database model** represents data as:
- **Nodes (Vertices)** - Entities (Users, Doctors, Appointments)
- **Edges (Relationships)** - Connections between entities
- **Properties** - Attributes of nodes and edges

### Visual Representation

```
Traditional Relational View:

Users Table          Doctors Table         Appointments Table
┌──────────┐        ┌──────────┐          ┌──────────┐
│ id       │        │ id       │          │ id       │
│ email    │        │ userId   │──FK──►   │ clientId │──FK──►
│ name     │◄──FK───│ specialty│          │ doctorId │──FK──►
└──────────┘        └──────────┘          └──────────┘


Graph View:

        (User: John)
             │
             │ has_profile (1:1)
             ▼
        (Doctor: Dr. Smith)
             │
             │ has_availability (1:M)
             ├──► (Availability: Monday 9-5)
             ├──► (Availability: Tuesday 9-5)
             └──► (Availability: Friday 9-5)
             │
             │ has_appointments (1:M)
             ├──► (Appointment: 2024-01-15 14:00)
             │         │
             │         │ booked_by (M:1)
             │         ▼
             │    (User: Jane)
             │
             └──► (Appointment: 2024-01-16 10:00)
                       │
                       │ booked_by (M:1)
                       ▼
                  (User: Bob)
```

---

## Why Use a Graph Model?

### Advantages

1. **Natural Relationships** - Models real-world connections
2. **Efficient Traversal** - Follow relationships easily
3. **Flexible Schema** - Easy to add new relationships
4. **Query Simplicity** - Complex queries become intuitive
5. **Performance** - Fast for relationship-heavy queries

### Example: Find All Patients of a Doctor

**Traditional SQL (Multiple Joins):**
```sql
SELECT u.* 
FROM users u
JOIN appointments a ON u.id = a.client_id
JOIN doctors d ON a.doctor_id = d.id
WHERE d.user_id = ?
```

**Graph Thinking:**
```
User(doctor) → Doctor → Appointment → User(client)
```

**Sequelize (Graph-like):**
```javascript
const appointments = await doctor.getAppointments({
  include: [{ model: User, as: 'client' }]
});
```

---

## Implementation in PostgreSQL

### Step 1: Define Nodes (Entities)

```javascript
// User Node
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true },
  email: DataTypes.STRING,
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  role: DataTypes.ENUM('client', 'doctor', 'admin')
});

// Doctor Node
const Doctor = sequelize.define('Doctor', {
  id: { type: DataTypes.UUID, primaryKey: true },
  userId: { type: DataTypes.UUID },  // Foreign key
  specialization: DataTypes.STRING,
  bio: DataTypes.TEXT
});

// Appointment Node (Relationship Entity)
const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.UUID, primaryKey: true },
  clientId: { type: DataTypes.UUID },  // Foreign key
  doctorId: { type: DataTypes.UUID },  // Foreign key
  appointmentDate: DataTypes.DATEONLY,
  startTime: DataTypes.TIME,
  status: DataTypes.ENUM('pending', 'confirmed', 'cancelled')
});
```

### Step 2: Define Edges (Relationships)

```javascript
// User ↔ Doctor (1:1)
User.hasOne(Doctor, { 
  foreignKey: 'userId', 
  as: 'doctorProfile' 
});
Doctor.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user' 
});

// Doctor ↔ Appointment (1:M)
Doctor.hasMany(Appointment, { 
  foreignKey: 'doctorId', 
  as: 'appointments' 
});
Appointment.belongsTo(Doctor, { 
  foreignKey: 'doctorId', 
  as: 'doctor' 
});

// User ↔ Appointment (1:M as client)
User.hasMany(Appointment, { 
  foreignKey: 'clientId', 
  as: 'clientAppointments' 
});
Appointment.belongsTo(User, { 
  foreignKey: 'clientId', 
  as: 'client' 
});
```

### Step 3: Create Graph Structure

```sql
-- This creates a graph in PostgreSQL:

CREATE TABLE "Users" (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  ...
);

CREATE TABLE "Doctors" (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES "Users"(id),  -- Edge to User
  ...
);

CREATE TABLE "Appointments" (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES "Users"(id),  -- Edge to User (client)
  doctor_id UUID REFERENCES "Doctors"(id), -- Edge to Doctor
  ...
);
```

**This creates a directed graph:**

```
     User ──────► Doctor
      │             │
      │             │
      ▼             ▼
  Appointment ◄─────┘
```

---

## Graph Traversal Examples

### Example 1: Find Doctor's Patients

**Graph Path:** `User(doctor) → Doctor → Appointment → User(client)`

```javascript
// Step 1: Get doctor node
const doctor = await Doctor.findOne({ 
  where: { userId: doctorUserId } 
});

// Step 2: Traverse to appointments
const appointments = await doctor.getAppointments({
  // Step 3: Traverse to clients
  include: [{ 
    model: User, 
    as: 'client',
    attributes: ['id', 'firstName', 'lastName', 'email']
  }]
});

// Result: List of patients
const patients = appointments.map(apt => apt.client);
```

**SQL Generated:**
```sql
SELECT 
  a.*, 
  u.id, u.firstName, u.lastName, u.email
FROM "Appointments" a
JOIN "Users" u ON a.client_id = u.id
WHERE a.doctor_id = ?
```

**Graph Visualization:**

```
Start: User(doctor, id=123)
   │
   ├─ Traverse: User.doctorProfile
   │
   ▼
Doctor(id=456)
   │
   ├─ Traverse: Doctor.appointments
   │
   ├──► Appointment(id=789)
   │       │
   │       ├─ Traverse: Appointment.client
   │       │
   │       ▼
   │    User(client, id=111, name="Jane Doe")
   │
   ├──► Appointment(id=790)
   │       │
   │       ▼
   │    User(client, id=112, name="Bob Smith")
   │
   └──► Appointment(id=791)
           │
           ▼
        User(client, id=113, name="Alice Johnson")

Result: [Jane Doe, Bob Smith, Alice Johnson]
```

---

### Example 2: Find Client's Upcoming Appointments

**Graph Path:** `User(client) → Appointment → Doctor → User(doctor)`

```javascript
// Step 1: Start at client node
const user = await User.findByPk(clientId);

// Step 2: Traverse to appointments
const appointments = await user.getClientAppointments({
  where: { 
    appointmentDate: { [Op.gte]: new Date() },
    status: { [Op.notIn]: ['cancelled'] }
  },
  // Step 3: Traverse to doctor
  include: [{
    model: Doctor,
    as: 'doctor',
    // Step 4: Traverse to doctor's user
    include: [{
      model: User,
      as: 'user',
      attributes: ['firstName', 'lastName']
    }]
  }],
  order: [['appointmentDate', 'ASC'], ['startTime', 'ASC']]
});
```

**Graph Visualization:**

```
Start: User(client, id=111, name="Jane Doe")
   │
   ├─ Traverse: User.clientAppointments (where date >= today)
   │
   ├──► Appointment(id=789, date=2024-01-15, time=14:00)
   │       │
   │       ├─ Traverse: Appointment.doctor
   │       │
   │       ▼
   │    Doctor(id=456, specialization="Cardiology")
   │       │
   │       ├─ Traverse: Doctor.user
   │       │
   │       ▼
   │    User(doctor, id=123, name="Dr. Smith")
   │
   └──► Appointment(id=792, date=2024-01-20, time=10:00)
           │
           ▼
        Doctor(id=457, specialization="Dermatology")
           │
           ▼
        User(doctor, id=124, name="Dr. Jones")

Result: [
  { date: 2024-01-15, time: 14:00, doctor: "Dr. Smith" },
  { date: 2024-01-20, time: 10:00, doctor: "Dr. Jones" }
]
```

---

### Example 3: Find Available Doctors for a Specialty

**Graph Path:** `Doctor (filter by specialty) → Availability → Appointment (check conflicts)`

```javascript
// Step 1: Find doctors by specialty
const doctors = await Doctor.findAll({
  where: { specialization: 'Cardiology' },
  // Step 2: Include user info
  include: [{
    model: User,
    as: 'user',
    where: { isActive: true }
  }]
});

// Step 3: For each doctor, check availability
for (const doctor of doctors) {
  // Traverse to availability
  const availabilities = await doctor.getAvailabilities({
    where: { 
      dayOfWeek: targetDayOfWeek,
      isActive: true 
    }
  });
  
  // Traverse to existing appointments
  const appointments = await doctor.getAppointments({
    where: {
      appointmentDate: targetDate,
      status: { [Op.notIn]: ['cancelled'] }
    }
  });
  
  // Calculate free slots
  const freeSlots = calculateFreeSlots(availabilities, appointments);
  doctor.freeSlots = freeSlots;
}
```

**Graph Visualization:**

```
Start: Query (specialty="Cardiology")
   │
   ├─ Find all matching doctors
   │
   ├──► Doctor(id=456, specialization="Cardiology")
   │       │
   │       ├─ Traverse: Doctor.user
   │       │     └──► User(id=123, name="Dr. Smith", isActive=true)
   │       │
   │       ├─ Traverse: Doctor.availabilities (where dayOfWeek=1)
   │       │     ├──► Availability(Monday, 9:00-17:00, slotDuration=30)
   │       │
   │       └─ Traverse: Doctor.appointments (where date=2024-01-15)
   │             ├──► Appointment(14:00-14:30, status=confirmed)
   │             └──► Appointment(15:00-15:30, status=confirmed)
   │
   └──► Doctor(id=458, specialization="Cardiology")
           │
           ├─ Traverse: Doctor.user
           │     └──► User(id=125, name="Dr. Lee", isActive=true)
           │
           ├─ Traverse: Doctor.availabilities
           │     └──► Availability(Monday, 10:00-18:00, slotDuration=30)
           │
           └─ Traverse: Doctor.appointments
                 └──► Appointment(11:00-11:30, status=confirmed)

Result: [
  { doctor: "Dr. Smith", freeSlots: [9:00, 9:30, 10:00, ...] },
  { doctor: "Dr. Lee", freeSlots: [10:00, 10:30, 11:30, ...] }
]
```

---

### Example 4: Multi-Hop Traversal (Find Colleagues)

**Graph Path:** `User(doctor) → Doctor → Appointment → User(client) → Appointment → Doctor → User(colleague)`

Find other doctors who have treated the same patients.

```javascript
// Step 1: Get doctor's patients
const doctor = await Doctor.findOne({ where: { userId } });
const appointments = await doctor.getAppointments({
  include: [{ model: User, as: 'client' }]
});

const patientIds = appointments.map(apt => apt.clientId);

// Step 2: Find other appointments by these patients
const otherAppointments = await Appointment.findAll({
  where: {
    clientId: { [Op.in]: patientIds },
    doctorId: { [Op.ne]: doctor.id }  // Exclude self
  },
  include: [{
    model: Doctor,
    as: 'doctor',
    include: [{ model: User, as: 'user' }]
  }]
});

// Step 3: Extract colleague doctors
const colleagues = [...new Set(
  otherAppointments.map(apt => apt.doctor.user.id)
)];
```

**Graph Visualization:**

```
Start: User(doctor, id=123, name="Dr. Smith")
   │
   ▼
Doctor(id=456)
   │
   ├─ Appointments
   │     ├──► Appointment → User(client, id=111, "Jane")
   │     └──► Appointment → User(client, id=112, "Bob")
   │
   └─ Find other appointments by Jane & Bob
         │
         ├──► Appointment(by Jane) → Doctor(id=457) → User(id=124, "Dr. Jones")
         │
         └──► Appointment(by Bob) → Doctor(id=458) → User(id=125, "Dr. Lee")

Result: Colleagues = ["Dr. Jones", "Dr. Lee"]
```

---

## Vector Graph Extension

### Adding Semantic Layer to Graph

The **doctor_embeddings** table adds a **semantic dimension** to the graph:

```
Traditional Graph:
User → Doctor → Appointment

Enhanced Graph with Vectors:
User → Doctor → Appointment
       │
       └──► DoctorEmbedding (1536-dim vector)
                │
                └──► Vector Space (semantic similarity)
```

### Implementation

```sql
CREATE TABLE doctor_embeddings (
  doctor_id UUID PRIMARY KEY REFERENCES "Doctors"(id),
  embedding vector(1536),  -- pgvector type
  content_hash TEXT,
  updated_at TIMESTAMPTZ
);
```

### Vector Similarity as Graph Edge

```javascript
// Traditional graph traversal: Follow foreign keys
const doctor = await Doctor.findByPk(doctorId);

// Vector graph traversal: Follow semantic similarity
const similarDoctors = await sequelize.query(`
  SELECT d.*, (de.embedding <=> :queryVector) as distance
  FROM doctor_embeddings de
  JOIN "Doctors" d ON de.doctor_id = d.id
  ORDER BY distance ASC
  LIMIT 5
`, {
  replacements: { queryVector: JSON.stringify(embedding) }
});
```

**Visualization:**

```
Vector Space (High-Dimensional)

                    Dr. Smith (Cardiology)
                         ●
                        /│\
                       / │ \
         Distance: 0.12 │  \ 0.15
                     /  │   \
                    /   │    \
                   /    │     \
                  /     │      \
                 ●      │       ●
          Dr. Jones     │    Dr. Lee
         (Cardiology)   │  (Cardiology)
                        │
                        │ 0.78
                        │
                        ●
                   Dr. Garcia
                   (Neurology)

Query: "chest pain" → Closest to Cardiologists
```

---

## Performance Optimization

### 1. Indexing Graph Edges

```sql
-- Index foreign keys (edges)
CREATE INDEX idx_doctors_user ON "Doctors"(user_id);
CREATE INDEX idx_appointments_doctor ON "Appointments"(doctor_id);
CREATE INDEX idx_appointments_client ON "Appointments"(client_id);

-- Composite indexes for common traversals
CREATE INDEX idx_appointments_doctor_date 
ON "Appointments"(doctor_id, appointment_date, status);
```

### 2. Eager Loading (Avoid N+1)

**Bad (N+1 queries):**
```javascript
const appointments = await Appointment.findAll();
for (const apt of appointments) {
  const doctor = await apt.getDoctor();  // N queries!
  const client = await apt.getClient();  // N queries!
}
```

**Good (1 query):**
```javascript
const appointments = await Appointment.findAll({
  include: [
    { model: Doctor, as: 'doctor' },
    { model: User, as: 'client' }
  ]
});
```

### 3. Limiting Traversal Depth

```javascript
// Limit depth to avoid expensive queries
const doctors = await Doctor.findAll({
  include: [
    { 
      model: User, 
      as: 'user' 
    },
    { 
      model: Appointment, 
      as: 'appointments',
      limit: 10,  // Limit per doctor
      where: { appointmentDate: { [Op.gte]: new Date() } }
    }
  ]
});
```

### 4. Vector Index for Semantic Search

```sql
-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX idx_embeddings_vector 
ON doctor_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Speedup: 100x faster for similarity search
-- Trade-off: Slight accuracy loss (acceptable for most use cases)
```

---

## Real-World Use Cases

### Use Case 1: Patient Dashboard

**Requirement:** Show patient's upcoming appointments with doctor details.

**Graph Traversal:**
```
User(client) → Appointment → Doctor → User(doctor)
```

**Implementation:**
```javascript
const dashboard = await User.findByPk(clientId, {
  include: [{
    model: Appointment,
    as: 'clientAppointments',
    where: { 
      appointmentDate: { [Op.gte]: new Date() },
      status: { [Op.notIn]: ['cancelled'] }
    },
    include: [{
      model: Doctor,
      as: 'doctor',
      include: [{ model: User, as: 'user' }]
    }],
    order: [['appointmentDate', 'ASC']]
  }]
});
```

---

### Use Case 2: Doctor Schedule View

**Requirement:** Show doctor's daily schedule with patient info.

**Graph Traversal:**
```
User(doctor) → Doctor → Appointment → User(client)
```

**Implementation:**
```javascript
const schedule = await Doctor.findOne({
  where: { userId: doctorUserId },
  include: [{
    model: Appointment,
    as: 'appointments',
    where: { 
      appointmentDate: targetDate,
      status: { [Op.notIn]: ['cancelled'] }
    },
    include: [{
      model: User,
      as: 'client',
      attributes: ['firstName', 'lastName', 'phone']
    }],
    order: [['startTime', 'ASC']]
  }]
});
```

---

### Use Case 3: AI Doctor Recommendation

**Requirement:** Find best doctor for patient's symptoms using RAG.

**Graph Traversal:**
```
Query → Vector Space → DoctorEmbedding → Doctor → User
                                            ↓
                                       Availability → Appointment
```

**Implementation:**
```javascript
// Step 1: Generate query embedding
const queryEmbedding = await generateEmbedding(symptomDescription);

// Step 2: Vector similarity search
const results = await sequelize.query(`
  SELECT 
    d.id, d.specialization, d.bio,
    u.firstName, u.lastName,
    (de.embedding <=> :vector) as distance
  FROM doctor_embeddings de
  JOIN "Doctors" d ON de.doctor_id = d.id
  JOIN "Users" u ON d.userId = u.id
  WHERE u.isActive = true
  ORDER BY distance ASC
  LIMIT 5
`, {
  replacements: { vector: JSON.stringify(queryEmbedding) }
});

// Step 3: Check availability for top matches
for (const doctor of results) {
  const slots = await getAvailableSlots(doctor.id, targetDate);
  doctor.availableSlots = slots;
}
```

---

### Use Case 4: Appointment Conflict Detection

**Requirement:** Prevent double-booking when creating appointment.

**Graph Traversal:**
```
Doctor → Appointment (filter by date/time)
```

**Implementation:**
```javascript
const conflict = await Appointment.findOne({
  where: {
    doctorId,
    appointmentDate: date,
    status: { [Op.notIn]: ['cancelled'] },
    [Op.or]: [
      {
        // Check if new appointment overlaps existing
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime }
      }
    ]
  }
});

if (conflict) {
  throw new Error('Time slot already booked');
}
```

---

## Conclusion

### Key Takeaways

1. **Graph Model** = Entities (nodes) + Relationships (edges)
2. **PostgreSQL** can implement graphs using foreign keys
3. **Sequelize** provides graph-like traversal with associations
4. **Vector Embeddings** add semantic layer to graph
5. **Performance** requires proper indexing and eager loading

### Benefits of This Architecture

✅ **Intuitive** - Mirrors real-world relationships  
✅ **Flexible** - Easy to add new relationships  
✅ **Performant** - Optimized with indexes  
✅ **Intelligent** - Enhanced with AI/RAG  
✅ **Scalable** - Handles millions of nodes/edges  

### Next Steps

- Explore `BACKEND_DOCUMENTATION.md` for complete API reference
- See `GRAPH_ARCHITECTURE.md` for visual diagrams
- Check `BACKEND_QUICK_REFERENCE.md` for quick commands

---

**Document Version:** 1.0  
**Last Updated:** January 2024
