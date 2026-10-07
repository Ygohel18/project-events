# cPanel Shared Hosting (Phusion Passenger) Deployment Guide

This comprehensive guide details step-by-step instructions for deploying the **Event Management System** to **cPanel Shared Hosting** using CloudLinux **"Setup Node.js App"** and **Phusion Passenger**.

---

## 🏗️ Architecture Overview

In a typical production setup on cPanel with subdomains:

- **Frontend Application**: `https://events.yourdomain.com` (or `https://yourdomain.com`)
  - Runs Next.js SSR through Phusion Passenger via `frontend/app.js` (or `frontend/server.js`).
- **Backend REST API**: `https://api.yourdomain.com`
  - Runs Express.js through Phusion Passenger via `backend/app.js`.
- **MySQL Database**: Local MySQL service managed through cPanel MySQL Databases and phpMyAdmin.
- **Uploads & Static Media**: Served directly through the backend at `https://api.yourdomain.com/uploads/...` with cross-origin resource policy enabled.

---

## 📋 Step 1: Create MySQL Database in cPanel

1. Log in to your cPanel dashboard.
2. In the **Databases** section, click **MySQL® Databases**:
   - Under **Create New Database**, enter a name (e.g., `event_management`) and click **Create Database**. Note the full database name (e.g., `cpaneluser_eventdb`).
3. Under **Add New User**:
   - Enter a username (e.g., `dbadmin`). Note the full username (e.g., `cpaneluser_dbadmin`).
   - Generate a strong password and save it securely.
   - Click **Create User**.
4. Under **Add User to Database**:
   - Select your newly created user and database.
   - Click **Add**.
   - Check **ALL PRIVILEGES** and click **Make Changes**.
5. Import Database Schema:
   - Return to the cPanel home screen and click **phpMyAdmin**.
   - Select your database from the left sidebar.
   - Click the **Import** tab at the top.
   - Click **Choose File** and select `backend/database.sql` from your computer.
   - Click **Import** (or **Go**) at the bottom.

---

## 📁 Step 2: Upload Project Files to cPanel

Using cPanel **File Manager** or **FTP (FileZilla)** or **Git Version Control**:

1. Recommended directory layout:
   ```text
   /home/cpaneluser/
   ├── backend/               <-- Backend code (outside public_html)
   │   ├── app.js             <-- Passenger entry point
   │   ├── server.js
   │   ├── .env               <-- Production configuration
   │   ├── package.json
   │   └── uploads/           <-- Uploaded media directory
   └── frontend/              <-- Frontend code
       ├── app.js             <-- Passenger entry point
       ├── server.js
       ├── .env.local         <-- Frontend API URL
       ├── .next/             <-- Compiled Next.js build
       └── package.json
   ```

2. Upload `backend/` and `frontend/` folders into your user home directory `/home/cpaneluser/`.

3. Ensure directory permissions:
   - Ensure `backend/uploads/` and its subdirectories (`events`, `profiles`, `gallery`, `documents`, `payments`, `invoices`, `tickets`) have write permissions (`chmod 755`).

---

## ⚙️ Step 3: Configure Backend in "Setup Node.js App"

1. In cPanel, navigate to the **Software** section and click **Setup Node.js App**.
2. Click **Create Application**:
   - **Node.js version**: Choose `20.x` or `18.x`.
   - **Application mode**: `Production`
   - **Application root**: `backend` (relative to your home directory).
   - **Application URL**: `api.yourdomain.com` (select the subdomain you created for your API).
   - **Application startup file**: `app.js`
3. Add **Environment Variables** (under *Environment variables* section):
   | Variable | Value | Description |
   |---|---|---|
   | `DB_HOST` | `localhost` | MySQL host in cPanel |
   | `DB_USER` | `cpaneluser_dbadmin` | Your cPanel MySQL username |
   | `DB_PASSWORD` | `your_mysql_password` | Your MySQL password |
   | `DB_NAME` | `cpaneluser_eventdb` | Your cPanel MySQL database |
   | `DB_PORT` | `3306` | Standard MySQL port |
   | `JWT_SECRET` | `your_production_secret_key` | Strong random secret |
   | `CLIENT_URL` | `https://yourdomain.com` | Your frontend production URL |
   | `ALLOWED_ORIGINS` | `https://yourdomain.com,https://events.yourdomain.com` | Permitted origins |
   | `ROOT_DOMAIN` | `yourdomain.com` | Allows all subdomains (*.yourdomain.com) |
4. Click **Create**.
5. Install Dependencies:
   - Under the created application, click the **Run NPM Install** button (or run `npm install` via SSH/Terminal).
6. Click **Restart Application**.
7. Test the API:
   - Visit `https://api.yourdomain.com/api` in your browser. You should see `{ "success": true, "message": "Event Management System API is running" }`.

---

## 🎨 Step 4: Configure Frontend in "Setup Node.js App"

1. Build Next.js Production Bundle:
   - On your local machine or via cPanel Terminal inside the `frontend` directory, ensure production build is compiled:
     ```bash
     cd frontend
     npm install
     npm run build
     ```
   - Upload the resulting `.next/` directory along with `node_modules` (or run npm install on cPanel).

2. Create Frontend Application in cPanel **Setup Node.js App**:
   - Click **Create Application**:
     - **Node.js version**: Choose the same version (e.g., `20.x`).
     - **Application mode**: `Production`
     - **Application root**: `frontend`
     - **Application URL**: `yourdomain.com` (or `events.yourdomain.com`).
     - **Application startup file**: `app.js` (or `server.js`).
   - Add **Environment Variables**:
     | Variable | Value |
     |---|---|
     | `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com/api` |
     | `NODE_ENV` | `production` |
3. Click **Create**.
4. Click **Run NPM Install** if needed.
5. Click **Restart Application**.

---

## 🔄 Step 5: How to Restart Apps in cPanel

When you update code or settings on cPanel:
1. In cPanel **Setup Node.js App**, click the **Restart** button next to your application.
2. Alternatively via SSH or File Manager:
   - Create or update the file `tmp/restart.txt` in your application root:
     ```bash
     mkdir -p tmp && touch tmp/restart.txt
     ```
   - Passenger detects changes to `tmp/restart.txt` and automatically reloads the Node.js process without downtime.

---

## 🛠️ Troubleshooting Common cPanel Passenger Issues

### 1. `500 Internal Server Error` or Passenger Error Page
- **Check Error Logs**: In your application root, view `stderr.log` or cPanel **Metrics > Errors**.
- **Missing modules**: Ensure `npm install` completed successfully.
- **Node version mismatch**: Ensure Node.js version is at least 18.x.

### 2. CORS Blocked across Subdomains
- Ensure `ALLOWED_ORIGINS` in `backend/.env` contains your exact frontend origin (including `https://`).
- Set `ROOT_DOMAIN=yourdomain.com` in `backend/.env` to automatically permit all subdomains.

### 3. Uploaded Images Not Showing
- Verify that `backend/uploads/` permissions are set to `755`.
- Verify that `NEXT_PUBLIC_API_URL` in the frontend points to `https://api.yourdomain.com/api`.
