# A u.S Wirtschaftsberatung e.K. - Kanzlei-Leitstand (Admin Portal)

Production-ready administration portal and management cockpit for **A u.S Wirtschaftsberatung e.K.** Built with React 19, Vite, TypeScript, and modern styling.

---

## 🌟 Key Features

- **Administrative Cockpit & KPI Dashboard:** Real-time visibility into pending, confirmed, and completed consultations.
- **Appointments Workspace:** Comprehensive appointment list with multi-parameter filtering, search by client/phone/email, and status updates (Bestätigt, Abgelehnt, In Bearbeitung, Erledigt).
- **Advisor Availability Manager:** Configure weekly working schedules, consulting hours, buffer intervals, and exception dates.
- **Live Client Chat & Ticket Hub:** Real-time bi-directional messaging with clients across appointments.
- **Mandanten-Verzeichnis (Clients Directory):** Searchable registry of all active and past clients with appointment history.
- **Multi-Language Support:** Seamless toggling between German (de), English (en), and Urdu (ur).
- **Secure Authentication:** Gated access via credential authentication and Supabase Auth with persistent session state.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler & Build Tool:** Vite
- **Styling:** Tailwind CSS + Lucide Icons
- **Deployment Platform:** Vercel (100% Free Tier compatible)

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### 2. Installation
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```
Fill in the following variables:
```env
VITE_API_URL=http://localhost:3000
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=YourSecurePassword123!
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Development Server
```bash
npm run dev
```
Open `http://localhost:5174` (or port indicated by Vite) in your browser.

### 5. Production Build
```bash
npm run build
```

---

## ☁️ Free Deployment to Vercel

1. Push this repository to your GitHub account.
2. Sign in to [Vercel](https://vercel.com) using your GitHub account.
3. Click **"Add New..."** -> **"Project"**.
4. Select your **`aus-admin-portal`** repository.
5. In Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. Under **Environment Variables**, add:
   - `VITE_API_URL`: URL of your deployed backend server (e.g. `https://aus-server.koyeb.app`)
   - `VITE_ADMIN_USERNAME`: Your custom admin username
   - `VITE_ADMIN_PASSWORD`: Your custom admin password
   - `VITE_SUPABASE_URL` (optional)
   - `VITE_SUPABASE_ANON_KEY` (optional)
7. Click **Deploy**. Vercel will build and assign you a free `*.vercel.app` domain with automatic SSL and global CDN.

---

## 📄 License
Private & Proprietary - A u.S Wirtschaftsberatung e.K.
