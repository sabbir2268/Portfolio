# ReDev Portfolio

A full-stack personal portfolio for showcasing projects, skills, experience and blogs, with a protected admin dashboard for managing projects.

**Live site:** [mdsabbirrahman.vercel.app](https://mdsabbirrahman.vercel.app/)

**Backend API:** `https://portfolio-3ukl.onrender.com`

## Features

- Responsive, mobile-first UI built with React, Vite, Tailwind CSS and DaisyUI
- Project showcase with category filtering and detail views
- Admin dashboard to add, edit and delete projects (Firebase Authentication protected)
- Projects stored in MongoDB Atlas, with a local JSON file fallback for offline development
- Contact section, CV download, social links and animated section transitions
- SEO-friendly page titles via `react-helmet-async`

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 7, Tailwind CSS 4, DaisyUI, Framer Motion, React Router 7 |
| Auth | Firebase Authentication (Google sign-in) |
| Backend | Node.js, Express 5, `mongodb` driver, CORS, dotenv |
| Database | MongoDB Atlas (`projectsDB.projects`) |
| Hosting | Vercel (client), Render (server) |

## Architecture

```
client/  ── fetch ${VITE_API_URL}/projects ──>  server/  ──>  MongoDB Atlas
   |                                                |
   └── Firebase ID token (admin writes) ────────────┘
```

- `GET /projects` is public and returns the project list.
- `POST /projects`, `PUT /projects/:id` and `DELETE /projects/:id` require a Firebase ID token in the `Authorization: Bearer <token>` header. The server validates the token and checks it against `ADMIN_EMAIL`.
- If MongoDB is not configured, the server falls back to `server/data/projects.json`.

## Getting started

### Prerequisites

- Node.js 18+ and npm
- A MongoDB Atlas cluster and a Firebase project (for admin access)

### 1. Clone

```bash
git clone https://github.com/sabbir2268/Portfolio.git
cd Portfolio
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
npm start
```

Server runs at `http://localhost:3000` by default.

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Frontend runs at `http://localhost:5173` by default. Point `VITE_API_URL` at the running backend (`http://localhost:3000`).

### Environment variables

`client/.env`

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Backend URL (no trailing slash). Set at build time. |
| `VITE_ADMIN_EMAIL` | Email allowed to access the admin panel. |
| `VITE_FIREBASE_*` | Firebase web app config (API key, auth domain, project id, storage bucket, messaging sender id, app id). |

`server/.env`

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string. |
| `MONGO_DB` | Database name (default `projectsDB`). |
| `FIREBASE_API_KEY` | Firebase web API key used to verify ID tokens. |
| `ADMIN_EMAIL` | Email allowed to manage projects. |
| `PORT` | Server port (default `3000`). |

Copy the `.env.example` files as a starting point. Never commit real `.env` files — both are gitignored.

### Production build

```bash
cd client
npm run build
```

The static output is generated in `client/dist/` and can be served by any static host. `client/vercel.json` rewrites all routes to `index.html` so client-side routing works on refresh.

## Deployment

- **Client:** Vercel, built from `client/` with the `VITE_*` environment variables configured in the project settings.
- **Server:** Render, started with `npm start` from `server/` with the server environment variables configured in the dashboard.
- When the deployed backend URL changes, update `VITE_API_URL` in the Vercel project and rebuild the client — Vite embeds this value at build time.

## API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/projects` | No | List all projects |
| `POST` | `/projects` | Admin | Create a project |
| `PUT` | `/projects/:id` | Admin | Update a project |
| `DELETE` | `/projects/:id` | Admin | Delete a project |

## Project structure

```
client/src/components   UI sections (about, contact, projects, navbar, footer, ...)
client/src/context      Auth and projects state providers
client/src/pages        Public pages and dashboard pages
client/src/router       Route definitions and private route guard
client/src/firebase     Firebase initialization
client/src/api.js       API base URL and auth header helper
server/index.js         Express API, auth verification and Mongo/JSON store
```

## Author

Md Sabbir Rahman — [GitHub](https://github.com/sabbir2268)
