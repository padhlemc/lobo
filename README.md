# Course Registration and Management System

A full-stack web application built using **React**, **Node.js**, **Express**, and **MongoDB** with clean Vanilla CSS.

---

## 🎯 Features

### 🎓 Student Portal
- **Browse Course Catalog:** View all available courses with course code, title, department, instructor, credits, schedule, and live remaining seat count.
- **Search & Filters:** Search courses by keyword or filter by department.
- **Course Registration:** Register for courses with student credentials (Name, Roll No / Student ID, Email). Prevents duplicate registration and enrollment in full courses.
- **My Registrations:** View registered courses and drop/cancel registrations anytime (releasing seats in real-time).

### ⚙️ Admin Dashboard
- **Analytics Overview:** View metrics for Total Courses, Total Enrollments, and Remaining Seats.
- **Add Course (Create):** Create new courses with code, title, department, instructor, credits, capacity, and schedule.
- **Update Course (Update):** Edit existing course details through an interactive modal.
- **Delete Course (Delete):** Remove courses and cleanly clean up associated registrations.
- **Enrolled Students Roster:** Inspect the full roster of students registered for any specific course.

---

## 🛠️ Tech Stack
- **Frontend:** React (Hooks, state management, components, clean basic CSS)
- **Backend:** Node.js & Express (RESTful APIs with CORS and JSON parsing)
- **Database:** MongoDB (Collections: `Courses`, `Registrations`)
- **Styling:** Basic Vanilla CSS (responsive, clean layout, zero heavy external CSS frameworks)

---

## 🚀 How to Run Locally

### 1. Prerequisites
Ensure MongoDB is running locally:
```bash
# Default connection: mongodb://127.0.0.1:27017
```

### 2. Backend Setup
Navigate into the `lobo` folder and install dependencies:
```bash
cd lobo
npm install
```

*(Optional) Seed sample courses into MongoDB:*
```bash
node seed.js
```

Start the backend server (runs on Port `4000`):
```bash
node server.js
```

### 3. Frontend Setup
In a new terminal, navigate to the `client` directory:
```bash
cd lobo/client
npm install
npm start
```

The React development server will open automatically at:
```
http://localhost:3000
```
*(Or open `http://localhost:4000` directly if you built the production bundle via `npm run build`)*

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/courses` | Get all courses with live enrollment counts and remaining seats |
| `GET` | `/api/courses/:id` | Get details of a single course |
| `POST` | `/api/courses` | **[Admin]** Add a new course |
| `PUT` | `/api/courses/:id` | **[Admin]** Update an existing course |
| `DELETE` | `/api/courses/:id` | **[Admin]** Delete a course |
| `POST` | `/api/register` | **[Student]** Register for a course |
| `GET` | `/api/registrations?studentId=...` | Get registrations for a specific student |
| `GET` | `/api/registrations?courseId=...` | **[Admin]** Get students enrolled in a specific course |
| `DELETE` | `/api/registrations/:id` | Drop / cancel a course registration |
