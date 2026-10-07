# Event Management System

A full-stack Event Management Web Application built with **Next.js**, **Node.js (Express)**, and **MySQL**.

---

## 🚀 Features

- **Authentication & Roles**: Admin, Organizer, and Attendee (Student) roles with JWT authentication.
- **Event Management**: Create, edit, publish, and cancel events with categories, covers, brochures, and dynamic highlights/benefits.
- **Registration & Ticketing**: Event registration, QR code tickets, PDF invoices, and payment management (Free & Paid events).
- **Attendance & Check-in**: Live QR scanner and manual check-in system for event organizers.
- **Admin Dashboard**: Analytics, user management, event moderation, reports, and brand settings.
- **Email Notifications**: Automated email notifications via Nodemailer / SMTP for registrations, updates, reminders, and contact inquiries.
- **Contact Form**: Direct contact form storing inquiries in MySQL with email notifications.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (React), Bootstrap 5, FontAwesome, Axios
- **Backend**: Node.js, Express, MySQL (mysql2/promise), JWT, Nodemailer, PDFKit, QRCode
- **Database**: MySQL / MariaDB

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL (v8.0+ or MariaDB) running on port `3306`

---

### 1. Database Setup

Create a MySQL database named `event_management` or configure your own database name in `.env`.

You can import the schema directly:
```bash
# Using MySQL CLI or phpMyAdmin:
mysql -u root -p event_management < backend/database.sql
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create or verify `backend/.env`:
```env
PORT=5001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=event_management
DB_PORT=3306

JWT_SECRET=your_jwt_secret_key_here

CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Optional SMTP Settings (defaults to simulation mode if empty)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

**Seed Database (Optional Demo Data):**
```bash
npm run seed:fresh
```

**Start Backend Server:**
```bash
npm run dev
# Server runs at http://localhost:5001
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create or verify `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

**Start Frontend Development Server:**
```bash
npm run dev
# App runs at http://localhost:3000
```

**Build for Production:**
```bash
npm run build
npm start
```

---

## 🔑 Default Demo Accounts

If you ran `npm run seed:fresh`, you can log in with:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `1234567890` |
| **Organizer** | `organizer@example.com` | `1234567890` |
| **Attendee** | `user@example.com` | `1234567890` |

---

## 📄 License

This project is licensed under the MIT License.
