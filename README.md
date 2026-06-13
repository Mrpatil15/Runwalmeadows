# 🏠 Runwal Meadows – Lead Generation Website
**Agency:** Heawen Property | heawen@runwalmeadows.info

---

## Project Structure
```
Runwalmeadows/
├── server.js          ← Node.js Express backend
├── package.json       ← Dependencies
├── .env               ← Your config (create from .env.example)
├── .env.example       ← Config template
├── leads.json         ← Auto-created, stores all leads
└── public/
    └── index.html     ← Complete website (all images embedded)
```

---

## ⚡ Quick Start (5 minutes)

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version)

### Step 2 — Install dependencies
Open a terminal/command prompt in this folder and run:
```
npm install
```

### Step 3 — Configure email
1. Copy `.env.example` to `.env`
2. Open `.env` and fill in:

```
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password       ← NOT your Gmail password!
LEAD_EMAIL=heawen@runwalmeadows.info
ADMIN_KEY=heawen2024
```

**How to get Gmail App Password:**
- Go to myaccount.google.com
- Security → 2-Step Verification (must be ON)
- App Passwords → Create → Mail → Copy the 16-character password

### Step 4 — Start the server
```
npm start
```

### Step 5 — Open the website
```
http://localhost:3000
```

---

## 📊 View All Leads
```
http://localhost:3000/leads?key=heawen2024
```
Shows a live dashboard of all leads with name, phone, location, source, timestamp.

---

## 📧 How Email Works
Every form submission:
1. Saves lead instantly to `leads.json` (never lost even if email fails)
2. Sends a formatted HTML email to `LEAD_EMAIL` with:
   - Name, Phone (clickable call link), Location
   - Lead Source (which button they clicked)
   - Timestamp (IST)

---

## 🚀 Deploy Online (optional)
To make the website live on the internet:

**Option A – Railway (free, easiest)**
1. Push this folder to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Add environment variables from `.env`
4. Done! Railway gives you a public URL

**Option B – VPS (any hosting)**
```bash
npm install -g pm2
pm2 start server.js --name runwal-meadows
pm2 save
```

---

## 📞 Contact
- Phone: 98210 59656
- Email: heawen@runwalmeadows.info
- RERA Agent: A51800003433
