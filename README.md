# IAIL – Mistake Tracking & Analysis System

IAIL (Internal Audit & Issue Logger) is a web-based system designed to track, manage, and analyze QC mistakes efficiently.
It allows teams to record mistakes, upload supporting screenshots, monitor analytics, and generate reports.

This project provides a **full-stack mistake tracking platform** with analytics and screenshot inspection.

---

# 🚀 Live Application

Frontend:
https://iail-prod.vercel.app

Backend API:
https://iail-prod.onrender.com

---

# 🧩 Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Chart.js
* Axios
* Lucide Icons
* React CountUp

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* Multer (File Upload)

### Database

* PostgreSQL hosted on Supabase

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: Supabase

---

# ✨ Features

### Authentication

* User Registration
* Secure Login
* JWT Token Authentication

### Mistake Management

* Add QC Mistake
* Upload Screenshot
* Verification Claim validation
* Delete Mistakes

### Analytics Dashboard

* Total mistakes count
* Monthly mistake trends
* Mistake type distribution
* Employee mistake tracking

### Advanced UI

* Screenshot zoom & drag
* Pagination
* Search and filtering
* CSV export

### File Handling

* Screenshot upload
* Static file serving

---

# 📊 Dashboard Capabilities

The dashboard provides visual insights including:

* Monthly mistake trends
* Mistake type distribution
* Top mistake categories
* Top employee mistake analysis

It also supports:

* Date filtering
* Employee filtering
* Mistake type filtering
* CSV report export

---

# 📂 Project Structure

```
IAIL_PROD
│
├── client
│   ├── src
│   │   ├── pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AddMistake.jsx
│   │   │   └── Register.jsx
│   │   │
│   │   ├── services
│   │   │   └── api.js
│   │   │
│   │   └── components
│   │
│   └── package.json
│
├── server
│   ├── routes
│   │   ├── authRoutes.js
│   │   └── mistakeRoutes.js
│   │
│   ├── uploads
│   │
│   ├── config
│   │   └── db.js
│   │
│   └── server.js
│
└── README.md
```

---

# ⚙️ Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=your_secret_key
PORT=5000
```

---

### Frontend (.env)

```
VITE_API_URL=https://iail-prod.onrender.com/api
```

---

# 📦 Installation

## Clone Repository

```
git clone https://github.com/madanvelamuri/IAIL_PROD.git
```

---

## Install Backend

```
cd server
npm install
npm start
```

Server runs on:

```
http://localhost:5000
```

---

## Install Frontend

```
cd client
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 📁 File Uploads

Screenshots are uploaded using **Multer** and stored in:

```
server/uploads
```

They are served via:

```
/uploads/:filename
```

Example:

```
https://iail-prod.onrender.com/uploads/example.png
```

---

# 🔐 Security

* Passwords hashed using bcrypt
* JWT authentication for API access
* Protected routes
* Token validation middleware

---

# 📈 Future Improvements

* Role-based access control
* Admin analytics dashboard
* Mistake approval workflow
* Notification system
* PDF reporting
* Cloud storage for screenshots

---

# 👨‍💻 Author

**Madan Mohan Velamuri**

GitHub
https://github.com/madanvelamuri

---

# 📜 License


# IAIL_PROD