# Scholaris — School LMS (Frontend)

React frontend for Scholaris, a school management system with separate **Admin**, **Teacher** and
**Student** portals. It talks to the Scholaris REST API (Express + MongoDB).

## Demo login

Use these accounts to try each portal. Demo accounts sign in without an email code; deleting
records, changing the password and changing settings are turned off.

| Panel   | Login page       | Email                      | Password          |
| ------- | ---------------- | -------------------------- | ----------------- |
| Admin   | `/admin/login`   | `demo.admin@example.com`   | `DemoAdmin2026`   |
| Teacher | `/teacher/login` | `demo.teacher@example.com` | `DemoTeacher2026` |
| Student | `/student/login` | `demo.student@example.com` | `DemoStudent2026` |

## Features

- **Sign-in** with password + 6-digit email code, per-portal login pages, forced password change
- **Admin** — students, teachers, classes, subjects, attendance, exams & results, fees (PKR),
  editable timetable, announcements, settings, audit log, analytics dashboard
- **Teacher** — class rosters, attendance registers, marks entry with CSV import, assignments and grading
- **Student** — attendance, timetable, results, assignment submission, fee status
- **Exports** — every list to Excel (CSV) or PDF; receipts, marksheets, statements and reports as PDF

## Tech

React 18 · Vite · Tailwind CSS · React Router · Framer Motion · Recharts · Axios · jsPDF

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs on http://localhost:5273. Set `VITE_API_URL` in `.env` to the API's address
(default `http://localhost:5051/api`).

| Command           | Does                              |
| ----------------- | --------------------------------- |
| `npm run dev`     | development server                |
| `npm run build`   | production build into `dist/`     |
| `npm run preview` | serve the production build        |

## Structure

```
src/
  components/   shared UI (tables, modals, charts, layout)
  context/      authentication state
  lib/          API client, exports/PDF, helpers
  pages/        auth, admin, teacher and student screens
```
