# FUTMINNA–FEDPOFFA Student E-Clearance Management System (ECMS)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748.svg)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)](https://socket.io/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-green.svg)](https://vitest.dev/)

An enterprise-grade, web-based Electronic Clearance Management System designed for the **Federal Polytechnic Offa (FEDPOFFA)** in academic affiliation with the **Federal University of Technology, Minna (FUTMINNA)** for graduating National Diploma (ND), Higher National Diploma (HND), and Affiliate Bachelor of Technology (B.Tech) degree students.

The platform eliminates manual paper-based clearance itineraries, prevents document falsification, enforces strict institutional sign-off hierarchies, provides real-time event streaming, and issues cryptographically verifiable digital certificates.

---

## Key System Capabilities

- **Strict 7-Stage Sequential Workflow Engine**: Enforces ordered progression through all statutory clearance checkpoints. Out-of-order approvals are blocked by database schema constraints and backend state machines.
  1. **Stage 1 (Departmental HOD)**: Final year project hardcover submission, departmental dues, laboratory inventory handover.
  2. **Stage 2 (Faculty Dean)**: Faculty academic board clearance and faculty dues audit.
  3. **Stage 3 (Polytechnic Library)**: Library card surrender, overdue book returns, institutional repository archiving.
  4. **Stage 4 (Bursary Department)**: School fees reconciliation via Remita RRR, graduation levy, penalty audits.
  5. **Stage 5 (Student Affairs Division)**: Hostel allocation checkout, student union dues, disciplinary record audit.
  6. **Stage 6 (ICT Directorate)**: Student portal deactivation, institutional email archival, digital alumni registration.
  7. **Stage 7 (Academic Registry)**: Final academic qualification audit, statement of results clearance, statutory signoff, and automated certificate generation.
- **Granular 9-Role Access Control (RBAC)**: Secure multi-persona access control for `STUDENT`, `HOD`, `DEAN`, `LIBRARIAN`, `BURSAR`, `STUDENT_AFFAIRS`, `ICT_DIRECTOR`, `REGISTRY`, and `SUPER_ADMIN`.
- **Tamper-Evident Digital Clearance Certificate**: Generated automatically upon Stage 7 Registry approval. Includes student bio-data, academic metrics (CGPA, degree class, matriculation number), 7-stage approval ledger, cryptographic signature hashes, and a unique verification QR code.
- **Server-Side PDF Generation**: Generates high-fidelity, printable A4 digital clearance certificates on the fly using `pdf-lib` without browser or Chromium dependencies.
- **Public Certificate Verification Portal**: External employers, NYSC mobilization officials, and postgraduate institutions can scan the QR code or enter the certificate reference at `/verify` to inspect validity and audit history.
- **Real-Time Push Notifications**: WebSocket event gateway (`Socket.IO`) dispatches real-time stage approvals, corrective rejections, and certificate notifications to connected clients.
- **Immutable Audit Trail**: Append-only audit ledger (`AuditLog`) capturing all institutional endorsements, IP addresses, browser user-agents, and state transitions.

---

## Technology Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite 6** (Development server & asset compilation)
- **Tailwind CSS v4** (Modern utility-first styling with institutional violet `#4B0082` and emerald accents)
- **Lucide React** (Consistent icon library)
- **Recharts** (Administrative clearance velocity and institutional analytics)
- **Motion** (Smooth state and view transitions)

### Backend
- **Node.js 20+** & **Express 4** (RESTful API architecture)
- **TypeScript** via `tsx` in development and bundled `esbuild` for production
- **Socket.IO 4** (Bi-directional real-time notification engine)
- **pdf-lib** & **qrcode** (Vector-quality PDF certificate generation with embedded QR codes)
- **Nodemailer** (SMTP transactional email delivery for stage notifications)

### Database & Security
- **Prisma ORM v7** with MySQL / MariaDB engine adapter
- **Dual-Mode Engine**: Operates against production MySQL databases or transitions to the built-in development data store for rapid prototyping and offline evaluation
- **Bcrypt.js** (Salted cryptographic password hashing)
- **JSON Web Tokens (JWT)** (Stateless, time-bounded session authorization)
- **Helmet & Express Rate Limit** (HTTP security headers and brute-force protection)

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your workstation:
- **Node.js** (v20.x or later recommended)
- **npm** (v10.x or later)
- **MySQL** / **MariaDB** (v8.0+ / v10.5+, optional for development if using auto-fallback mode)

---

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/futminna-fedpoffa/ecms.git
cd ecms
npm install
```

---

### 2. Environment Configuration

Copy the sample environment file to create your local `.env`:

```bash
cp .env.example .env
```

Open `.env` and adjust the variables for your environment:

```env
# Database Connection
DATABASE_URL="mysql://root:password@localhost:3306/clearance_db"

# Storage Backend Mode: 'MYSQL' enforces live MySQL; 'AUTO' or 'IN_MEMORY' allows fallback in development
DB_MODE="AUTO"

# JWT Authentication Secret
JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"

# Client CORS Origin
CLIENT_ORIGIN="http://localhost:3000"

# SMTP Transactional Mailer (Optional / Dev Mailtrap)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="clearance-portal@futminna-fedpoffa.edu.ng"
EMAIL_NOTIFICATION_ENABLED=true
```

---

### 3. Database Migration & Client Generation

Generate the Prisma Client and apply migrations to your database:

```bash
# Generate Prisma Client models
npx prisma generate

# Apply migrations to target database
npx prisma migrate deploy

# (Optional) Seed the database with institutional default accounts and workflows
npx prisma db seed
```

> **Note:** If testing without a live MySQL instance, the application will automatically run in `AUTO` mode, providing a pre-seeded, in-memory institutional dataset with all 9 clearance roles, sample student applications, and historical audit logs.

---

### Persistence Architecture: Dual-Mode Data Layer

The application genuinely operates in one of two modes, decided once at startup by `dbStore.hydrateFromDatabase()` (`src/server/db/client.ts`):

- **Live database mode** — when `DATABASE_URL` points to a reachable MySQL/MariaDB instance, the server loads all institutional and clearance data from it at startup (auto-bootstrapping roles, permissions, faculties, departments, the workflow, and demo accounts the first time it connects to an empty schema — see `src/server/db/seedDatabase.ts`). From then on, every clearance action — initiating a request, submitting or resubmitting documents, an officer's approval or rejection, certificate issuance, and every audit log and notification generated along the way — is written through to the real database via `src/server/db/prismaRepository.ts`, not just held in memory.
- **In-memory fallback mode** — when no live database is reachable, the server falls back to the original rich in-memory demo dataset (`RelationalStore.initRelations()`), so the full application remains explorable without any database setup. Every write in this mode is safely scoped to the running process and does not persist across restarts.

Both modes share the exact same route handlers and workflow-engine business logic (`src/server/workflow/workflowEngine.ts`); only the data-access layer differs, and the switch is transparent to the rest of the application.

**Current scope:** the clearance domain (`ClearanceRequest`, `ClearanceStageProgress`, `Document`, `ApprovalDecision`, `ClearanceCertificate`, `Notification`, `AuditLog`) and authentication (`User`, `Student`, password reset) are fully wired to live-database mode. Admin-panel CRUD screens for faculties, departments, and workflow-stage configuration, the "clearance units" list, and the in-app evaluation survey responses currently remain in-memory-only in both modes and are the natural next scope to extend using the same `mirror*` method pattern already established in `prismaRepository.ts`.

---

### 4. Running the Application

#### Development Mode
Starts the combined Express backend and Vite middleware on port 3000:

```bash
npm run dev
```

Visit `http://localhost:3000` in your web browser.

#### Production Build & Start
Compile the React frontend and bundle the backend server:

```bash
# Build Vite client and bundle server.ts with esbuild
npm run build

# Start the compiled production server
npm start
```

---

### 5. Running Automated Tests

The project includes unit and integration test suites powered by **Vitest** and **Supertest**:

```bash
# Run all automated test suites
npm test
```

Test coverage includes:
- **RBAC & Auth Middleware**: Token verification, role guards, and permission matching.
- **Workflow State Machine**: 7-stage sequential transitions, duplicate submission prevention, and illegal skip rejections.
- **Clearance End-to-End Pipeline**: Full student submission $\rightarrow$ 7-stage officer approvals $\rightarrow$ automated certificate issuance $\rightarrow$ binary PDF streaming.

---

## Default Demonstration Accounts

For academic defense, evaluation, and system demonstration, the system includes pre-configured demo credentials across all institutional roles.

**Default Password for all demo accounts**: `Clearance@2026`

| Persona | Email Address | Assigned Role | Institutional Scope |
| :--- | :--- | :--- | :--- |
| **Student** | `student.test@futminna-fedpoffa.edu.ng` | `STUDENT` | B.Tech Computer Science (Affiliate) |
| **HOD** | `hod.csc@fedpoffa.edu.ng` | `HOD` | Department of Computer Science (Stage 1) |
| **Dean** | `dean.fast@fedpoffa.edu.ng` | `DEAN` | Faculty of Applied Sciences & Tech (Stage 2) |
| **Librarian** | `library.officer@fedpoffa.edu.ng` | `LIBRARIAN` | Polytechnic Main Library (Stage 3) |
| **Bursar** | `bursar.clearance@fedpoffa.edu.ng` | `BURSAR` | Directorate of Bursary & Payments (Stage 4) |
| **Student Affairs** | `studentaffairs@fedpoffa.edu.ng` | `STUDENT_AFFAIRS` | Directorate of Student Affairs (Stage 5) |
| **ICT Director** | `ict.director@fedpoffa.edu.ng` | `ICT_DIRECTOR` | Directorate of ICT & Web Services (Stage 6) |
| **Registry Officer** | `registry.clearance@futminna.edu.ng` | `REGISTRY` | Academic Affairs Directorate (Stage 7) |
| **System Admin** | `admin.security@futminna-fedpoffa.edu.ng` | `SUPER_ADMIN` | Institutional System & Security Administration |

---

## Project Structure

```text
├── prisma/
│   └── schema.prisma              # 19-entity normalized relational schema
├── src/
│   ├── components/                # Modular UI components
│   │   ├── auth/                  # Authentication forms & ProtectedRoute
│   │   ├── certificate/           # Digital clearance certificate visualizer
│   │   ├── layout/                # Institutional header, navbar, and footer
│   │   ├── officer/               # Review queue, modal signoffs, and reject forms
│   │   └── student/               # 7-stage timeline, requirement cards, document upload
│   ├── context/                   # React Context (AuthContext, SocketContext)
│   ├── pages/                     # Routed view pages (Dashboard, Verification, Audit, etc.)
│   ├── server/                    # Full-stack backend application
│   │   ├── app.ts                 # Express application factory with middleware
│   │   ├── certificates/          # pdf-lib server-side PDF certificate generator
│   │   ├── db/                    # Prisma database adapter & in-memory test store
│   │   ├── middleware/            # JWT authentication & RBAC authorization guards
│   │   ├── routes/                # REST endpoints (auth, clearance, admin, notifications)
│   │   ├── socket/                # Socket.IO WebSocket server implementation
│   │   └── workflow/              # 7-stage clearance state machine engine
│   ├── App.tsx                    # Route definitions and client-side protection
│   └── main.tsx                   # React client entry point
├── tests/
│   ├── integration/               # API route integration tests with Supertest
│   └── unit/                      # RBAC middleware & workflow engine unit tests
├── server.ts                      # Development & production server entry point
├── package.json                   # Dependencies, scripts, and build pipeline
├── DOCS_ERD_SUMMARY.md            # Comprehensive Database ERD & Architecture documentation
└── README.md                      # Project documentation and setup guide
```

---

## License & Academic Attribution

Developed for the final-year research project and academic demonstration for the **Federal University of Technology, Minna (FUTMINNA)** in collaboration with the **Federal Polytechnic Offa (FEDPOFFA)**. All rights reserved.
