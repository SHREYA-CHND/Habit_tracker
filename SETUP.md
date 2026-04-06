# Habit AI - Complete Setup Guide

## 🚀 Prerequisites

Before you begin, ensure you have these installed:
- **Node.js** (v16 or higher) - [Download Here](https://nodejs.org/)
- **PostgreSQL** - [Download Here](https://www.postgresql.org/download/)
- **Git** (optional) - [Download Here](https://git-scm.com/)

---

## 📋 Step 1: Database Setup

### Install PostgreSQL
1. Download and install PostgreSQL from the link above
2. During installation, remember your **password** (you'll need it)
3. Open **pgAdmin** (comes with PostgreSQL) or use command line

### Create Database
```sql
-- Open pgAdmin or psql and run:
CREATE DATABASE habit_ai;
```

### Create Tables
```sql
-- Connect to habit_ai database and run:
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    xp INTEGER DEFAULT 0,
    avatar_stage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    habit_name VARCHAR(255) NOT NULL,
    day VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE habit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    habit_id INTEGER REFERENCES habits(id),
    log_date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📂 Step 2: Project Setup

### Clone/Download Project
```bash
# If using Git:
git clone <your-repo-url> habit_ai
cd habit_ai

# OR download and extract the folder, then:
cd habit_ai
```

### Install Dependencies
```bash
npm install
```

---

## 🔧 Step 3: Environment Configuration

### Create Environment File
Create a file named `.env` in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=habit_ai
DB_USER=postgres
DB_PASSWORD=your_postgresql_password

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Server Configuration
PORT=3000
```

### Important Notes:
- Replace `your_postgresql_password` with your actual PostgreSQL password
- Replace `your_email@gmail.com` with your Gmail
- For Gmail, you need an **App Password**:
  1. Go to [Google Account Settings](https://myaccount.google.com/)
  2. Enable 2-Step Verification
  3. Go to Security → App Passwords
  4. Generate new app password and use it in `EMAIL_PASS`

---

## 🎯 Step 4: Run the Application

### Start the Server
```bash
node server.js
```

### Access the Application
Open your browser and go to:
```
http://localhost:3000
```

---

## ✅ Step 5: Test Everything

### Test Registration
1. Go to `http://localhost:3000`
2. Click "Create Account"
3. Fill form, submit
4. Check email for verification code
5. Enter code to verify

### Test Login
1. Use verified credentials to login
2. Should redirect to dashboard

### Test Features
- **Create Habits**: Add daily habits
- **Focus Mode**: Test focus timer
- **Dashboard**: Check XP and avatar
- **Settings**: Change password

---

## 🛠️ Troubleshooting

### Common Issues:

**Port 3000 already in use?**
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env to 3001, 8080, etc.
```

**Database connection failed?**
- Check PostgreSQL service is running
- Verify database name, user, password in .env
- Ensure habit_ai database exists

**Email not sending?**
- Verify Gmail app password is correct
- Check spam folder
- Ensure 2-step verification is enabled

**Node modules not found?**
```bash
npm install
```

**Permission denied errors?**
```bash
# On Windows, run as Administrator
# On Mac/Linux: sudo npm install
```

---

## 📱 Mobile Access

To access from other devices on same network:
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Use: `http://YOUR_IP:3000`

---

## 🔄 Development Mode

For automatic restart during development:
```bash
npm install -g nodemon
nodemon server.js
```

---

## 📁 Project Structure

```
habit_ai/
├── index.html          # Login page
├── register.html       # Registration
├── dashboard.html      # Main dashboard
├── focus.html          # Focus mode
├── habit.html          # Habit creation
├── settings.html       # User settings
├── verify.html         # Email verification
├── style.css           # Modern styling
├── script.js           # Frontend logic
├── server.js           # Backend server
├── package.json        # Dependencies
├── .env               # Environment variables
├── database.sql        # Database schema
└── avatars/           # Avatar images
    ├── skinny.png
    ├── normal.png
    ├── fit.png
    └── buff.png
```

---

## 🎉 You're Done!

Your Habit AI application is now running! Users can:
- Register and verify email
- Track daily habits
- Earn XP and level up avatars
- Use focus mode with music
- Monitor progress with charts

For any issues, check the troubleshooting section above. Happy habit building! 🚀
