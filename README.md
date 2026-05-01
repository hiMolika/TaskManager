#  TaskFlow — Team Task Manager

> A full-stack web application for managing projects, assigning tasks, and tracking team progress — with role-based access control for Admins and Members.

![TaskFlow Banner](https://img.shields.io/badge/Status-Live-brightgreen) ![Node.js](https://img.shields.io/badge/Node.js-18.x-green) ![React](https://img.shields.io/badge/React-18-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue) ![Railway](https://img.shields.io/badge/Deployed-Railway-purple)

---

## 🌐 Live Demo

** Live URL:** `https://YOUR-APP.up.railway.app`  
** Demo Video:** [Watch on YouTube / Loom](https://your-video-link.com)  
** GitHub Repo:** `https://github.com/YOUR_USERNAME/taskflow`

---

##  Screenshots

| Dashboard | Project View | Kanban Board |
|-----------|-------------|--------------|
| Overview of all tasks & stats | Team members & task list | Drag-drop by status |

---

## Features

###  Authentication
- Signup & Login with JWT tokens
- Passwords hashed with bcryptjs
- Protected routes — unauthorized users redirected to login
- Token stored in localStorage, auto-expires in 7 days

### 👥 Role-Based Access Control
| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Add/remove members | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Edit/delete any task | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ |
| Delete project | ✅ | ❌ |

###  Project Management
- Create projects with name & description
- Add team members by email address
- Remove members (Admin only)
- View all projects you belong to

###  Task Management
- Create tasks with title, description, due date, priority
- Assign tasks to team members
- Three statuses: **Todo → In Progress → Done**
- Three priority levels: **Low / Medium / High**
- Overdue detection (past due date, not done)
- Edit and delete tasks

###  Dashboard
- Total tasks count
- Breakdown: Todo / In Progress / Done
- Overdue tasks count
- Your assigned tasks at a glance

###  Kanban Board View
- Tasks organized by status in columns
- Visual cards showing priority, assignee, due date

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios, date-fns |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (with pg driver) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | express-validator |
| Deployment | Railway |

---

##  Database Schema

```
users
  id, name, email, password_hash, created_at

projects
  id, name, description, owner_id → users, created_at

project_members
  id, project_id → projects, user_id → users, role (admin|member), joined_at

tasks
  id, project_id → projects, title, description,
  status (todo|in_progress|done), priority (low|medium|high),
  assigned_to → users, created_by → users, due_date, created_at, updated_at
```

---

##  REST API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login & receive JWT |
| GET | `/api/auth/me` | Get current user info |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all my projects |
| POST | `/api/projects` | Create new project |
| GET | `/api/projects/:id` | Get project details + members |
| DELETE | `/api/projects/:id` | Delete project (Admin only) |
| POST | `/api/projects/:id/members` | Add member by email (Admin only) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (Admin only) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/project/:projectId` | Get all tasks in a project |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/dashboard` | Get dashboard stats |

---

##  Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskmanager
JWT_SECRET=your-long-random-secret-here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Create the database:
```sql
-- In psql or pgAdmin:
CREATE DATABASE taskmanager;
```

Start backend:
```bash
npm run dev
#  Database tables ready
#  Server running on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm start
# App runs at http://localhost:3000
```

---

##  Deployment on Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: TaskFlow full-stack app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

### Step 2 — Deploy Backend
1. Go to [railway.app](https://railway.app) → **New Project** → Deploy from GitHub
2. Select your repo → set **Root Directory** to `backend`
3. Add a **PostgreSQL** plugin: click **+ New** → **Database** → **Add PostgreSQL**
4. Railway auto-injects `DATABASE_URL` ✅
5. Add these environment variables in Railway dashboard:
   - `JWT_SECRET` = generate at https://generate-secret.vercel.app/32
   - `FRONTEND_URL` = *(set this after deploying frontend)*
   - `NODE_ENV` = `production`
6. Railway auto-detects `start` script from `package.json` ✅

### Step 3 — Deploy Frontend
1. In same Railway project → **New Service** → Deploy from GitHub → select `frontend` folder
2. Add environment variable:
   - `REACT_APP_API_URL` = `https://YOUR-BACKEND.up.railway.app/api`
3. Set build command: `npm run build`
4. Set start command: `npx serve -s build`

### Step 4 — Final Config
- Copy your frontend Railway URL and set it as `FRONTEND_URL` in your backend service
- Redeploy backend

### Health Check
Your backend exposes `/health` — Railway uses this automatically to monitor uptime.

---

##  Project Structure

```
taskflow/
├── backend/
│   ├── db/
│   │   └── index.js          # PostgreSQL pool + table init
│   ├── middleware/
│   │   └── auth.js           # JWT authenticate + requireProjectAdmin
│   ├── routes/
│   │   ├── auth.js           # Signup, login, /me
│   │   ├── projects.js       # CRUD + member management
│   │   └── tasks.js          # CRUD + dashboard stats
│   ├── server.js             # Express app entry point
│   ├── railway.json          # Railway deploy config
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.js      # Axios instance + API calls
│   │   ├── context/
│   │   │   └── AuthContext.js # Global auth state
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Projects.js
│   │   │   └── ProjectDetail.js
│   │   └── components/
│   │       └── Navbar.js
│   └── package.json
├── .gitignore
└── README.md
```

---

##  Security

- Passwords are **never stored in plain text** — bcrypt with 10 salt rounds
- JWT tokens signed with a secret key, expire in 7 days
- All protected routes validate the JWT on every request
- Role checks enforced server-side (not just on frontend)
- SQL queries use **parameterized statements** — no SQL injection possible
- CORS configured to only allow the frontend domain in production

---

## Test Accounts

After deploying, you can register directly via the app. For demo purposes:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo1234 |
| Member | member@demo.com | demo1234 |

*(Create these after first deployment by signing up)*

---

##  Assignment Checklist

| Requirement | Status |
|-------------|--------|
| Authentication (Signup/Login) 
| Role-based access (Admin/Member) 
| Project & team management 
| Task creation, assignment & status tracking 
| Dashboard (tasks, status, overdue) 
| REST APIs 
| Database with relationships (SQL) 
| Proper validations
| Deployed live on Railway
| GitHub repo
| README
| Demo video 

---

##  License

MIT
