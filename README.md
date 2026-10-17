# Support Desk — Customer Support Ticket Mini Dashboard

A full-stack, production-ready support ticket management web application built for internal customer support teams.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), Tailwind CSS, Axios, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Zod |
| **Database** | PostgreSQL (via Supabase) |
| **Auth** | JWT Authentication (Bearer Tokens) |
| **DevOps** | Docker, Docker Compose, Nginx |

---

## Key Features

- **JWT Authentication:** Secure user registration, login, and protected routing.
- **Ticket Lifecycle Management:** Full CRUD operations (Create, View, Update, and Delete tickets).
- **Ownership & Authorization:** Only the ticket creator can edit or delete a ticket (backend returns `403 Forbidden` if unauthorized).
- **Activity Audit Timeline:** Comprehensive event logging (`ticket_activity`) tracking ticket creation, field updates with before/after diffs (`old_value → new_value`), and status changes.
- **Server-Side Pagination & Filtering:** Dynamic Supabase SQL querying supporting multi-field search (`customer_name`, `customer_email`), category, priority, status, sorting, and pagination.
- **Live Dashboard KPIs:** High-level metrics for *Total, Open, In Progress, Resolved, Overdue, and High Priority* tickets powered by a dedicated analytics endpoint.
- **Data Export:** Export visible/filtered tickets as CSV directly from the frontend.
- **Responsive UI:** Modern, accessible interface optimized for desktop, tablet, and mobile views with loading skeletons and toast notifications.

---

## Database Setup (Supabase / PostgreSQL)

Create the following tables in your Supabase SQL editor:

```sql
-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tickets Table
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    issue_category TEXT NOT NULL CHECK (issue_category IN ('Technical', 'Billing', 'Account', 'Other')),
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ticket Activity Log Table
CREATE TABLE ticket_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- Docker & Docker Compose *(optional for containerized run)*
- A [Supabase](https://supabase.com) project with the tables created above

---

### Option A: Running with Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd ticket-dashboard
   ```

2. Create `backend/.env`:
   ```env
   PORT=3000
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```

3. Build and launch all services:
   ```bash
   docker compose up --build
   ```

4. Access the applications:
   - **Frontend:** `http://localhost:5173`
   - **Backend API:** `http://localhost:3000/api/v1`

---

### Option B: Running Locally

#### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=3000
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

Start the backend dev server:
```bash
npm run dev
```
*Backend runs on `http://localhost:3000`*

---

#### 2. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

Start the frontend dev server:
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## API Reference

### Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user (`username`, `password`) |
| `POST` | `/auth/login` | Login user, returns JWT Access Token |
| `POST` | `/auth/logout` | Logout user session |

---

### Ticket Endpoints (`/api/v1/ticket`)

All `/ticket` routes require a valid `Bearer <token>` in the `Authorization` header.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/ticket` | Get paginated tickets with optional filters & search |
| `GET` | `/ticket/dashboard` | Get aggregated KPI stats (*total, open, inProgress, resolved, highPriority, overdue*) |
| `GET` | `/ticket/:id` | Get single ticket details |
| `GET` | `/ticket/:id/activity` | Get chronological audit activity history for a ticket |
| `POST` | `/ticket` | Create a new ticket |
| `PATCH` | `/ticket/:id` | Update ticket details *(Owner only)* |
| `PATCH` | `/ticket/:id/status` | Quick update ticket status *(Owner only)* |
| `DELETE` | `/ticket/:id` | Delete a ticket *(Owner only)* |

#### Query Parameters for `GET /ticket`:
- `page` *(number, default: 1)* — Target page
- `limit` *(number, default: 10, max: 50)* — Items per page
- `status` *(string)* — `Open`, `In Progress`, `Resolved`
- `priority` *(string)* — `Low`, `Medium`, `High`
- `category` *(string)* — `Technical`, `Billing`, `Account`, `Other`
- `search` *(string)* — Fuzzy search on `customer_name` or `customer_email`
- `sortBy` *(string)* — `newest`, `oldest`, `due_soon`, `priority`

---

## Folder Structure

```
├── backend/
│   ├── src/
│   │   ├── Controllers/     # Route logic (ticket.controller.ts, users.controller.ts)
│   │   ├── DB/              # Supabase client connection
│   │   ├── Middlewares/     # JWT authentication middleware
│   │   ├── Routes/          # Express route definitions
│   │   ├── Utils/           # Custom error handlers & utilities
│   │   ├── validations/     # Zod request validation schemas
│   │   └── index.ts         # Server entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API services
│   │   ├── components/      # UI components (Layout, common, ActivityTimeline, etc.)
│   │   ├── context/         # AuthContext & ToastContext
│   │   ├── pages/           # Views (TicketList, CreateTicket, UpdateTicket, Login, Register)
│   │   └── utils/           # Client-side validation helpers
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```
