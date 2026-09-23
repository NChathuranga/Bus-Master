# 🚌 Bus Management System

A full MERN-stack (MongoDB, Express, React, Node.js) project 

## Project Overview

A bus fleet rarely runs itself — routes need planning, drivers and vehicles need to be assigned without double-booking, and fuel/maintenance costs need to be tracked over time. The **Bus Management System** is a web application that brings all of this into one place for a transport company's staff and admins.

Instead of juggling spreadsheets, an admin can log in, add routes and vehicles, assign drivers to schedules, log fuel and maintenance as they happen, and instantly see the state of the fleet on a live dashboard. The system also blocks scheduling mistakes automatically — for example, it won't let you assign a vehicle or driver to two overlapping trips.

It's built as a typical **MERN stack** application: a React frontend talks to a Node.js/Express REST API, which stores everything in MongoDB. Access is protected by JWT-based authentication with role-based permissions (Admin vs Staff).

---

## Features

### 🔐 Authentication & User Roles
- Register and log in with a username/password
- Passwords are hashed (never stored in plain text)
- JWT tokens issued on login, used to authorize every API request
- Two roles: **Admin** (full access, including delete) and **Staff** (everyday operations)

### 📊 Dashboard
- Live stat cards: total routes, vehicles, active vehicles, drivers, schedules
- Fuel usage chart, grouped by month
- Upcoming schedules list, sorted by departure time

### 🛣️ Route Management
- Add, edit, and delete routes
- Define start point, end point, in-between stops, and distance

### 🗓️ Schedule Management
- Assign a route, vehicle, and driver to a departure/arrival time
- **Automatic time-conflict detection** — prevents the same vehicle or driver from being booked on two overlapping trips
- Edit or cancel existing schedules

### 🧑‍✈️ Driver Management
- Add driver profiles: name, license number, contact, license expiry date
- Visual warning when a driver's license is expiring within 30 days
- Active/inactive status tracking

### 🚌 Vehicle Management
- Add buses with registration number, type, and seating capacity
- Track vehicle status: available, on-route, or in maintenance

### ⛽ Fuel & Maintenance Logs
- Record fuel fill-ups per vehicle (liters, cost, date)
- Record maintenance/service history per vehicle (service type, cost, notes, date)

### 📈 Reports & Analytics
- Monthly fuel vs. maintenance cost trend chart
- Maintenance cost breakdown by service type (pie chart)
- One-click **PDF export** of the report for offline submission

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), React Router, Tailwind CSS, Recharts (charts), jsPDF (PDF export), Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose (ODM) |
| Auth | JSON Web Tokens (JWT), bcrypt.js for password hashing |
| Dev Tools | VS Code, Git & GitHub |

**Why these choices:** React + Express + MongoDB (the "MERN stack") is one of the most common combinations for full-stack JavaScript apps, since the same language (JavaScript) is used end-to-end. Tailwind CSS speeds up styling without writing custom CSS files. JWT keeps the API stateless — the server doesn't need to remember who's logged in, it just verifies the token on each request.

---

## 1. Install the tools you need (one-time setup)

You need 3 things on your computer:

1. **Node.js** (this runs both the backend and frontend)
   - Go to https://nodejs.org and download the **LTS** version.
   - Install it like any normal program (click Next, Next, Finish).
   - To check it worked, open a terminal/command prompt and type:
     ```
     node -v
     npm -v
     ```
     You should see version numbers, not an error.

2. **MongoDB** — you have two easy options, pick ONE:
   - **Option A (easiest, no install): MongoDB Atlas (cloud, free)**
     1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
     2. Create a free "Shared/M0" cluster.
     3. Click "Connect" → "Drivers" → copy the connection string. It looks like:
        `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
     4. Add `bus_management` at the end before the `?`, e.g.
        `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bus_management?retryWrites=true&w=majority`
     5. You'll paste this into `backend/.env` in Step 3 below.
   - **Option B: Install MongoDB locally**
     - Download from https://www.mongodb.com/try/download/community and install it (use default options). It runs automatically as a background service.

3. **VS Code** (code editor) — download from https://code.visualstudio.com and install it.

---

## 2. Open the project in VS Code

1. Unzip the project folder you downloaded.
2. Open VS Code → File → Open Folder → select the `bus-management-system` folder.
3. Open a terminal inside VS Code: **Terminal → New Terminal**.

You'll see two folders: `backend` and `frontend`. You need to set up and run BOTH.

---

## 3. Set up the Backend (the server + database connection)

In the VS Code terminal:

```bash
cd backend
npm install
```

This downloads all the packages the server needs (Express, MongoDB driver, JWT, etc). Wait for it to finish.

Now create your environment file:

1. Find the file `backend/.env.example`.
2. Make a copy of it in the same folder and rename the copy to exactly `.env`.
3. Open `.env` and fill it in:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/bus_management
   JWT_SECRET=any_long_random_text_you_want
   PORT=5000
   ```
   - If you used **MongoDB Atlas**, replace `MONGO_URI` with the connection string you copied in Step 1.
   - If you installed MongoDB **locally**, you can leave `MONGO_URI` exactly as shown above.
   - `JWT_SECRET` can be any random string — mash your keyboard, e.g. `kJ8x92mLpQ7vN3rT`.

Now start the backend:

```bash
npm run dev
```

You should see:
```
MongoDB connected successfully
Server running on port 5000
```

✅ Leave this terminal running. Your backend is now live at `http://localhost:5000`.

---

## 4. Set up the Frontend (the website you see in the browser)

Open a **second terminal** in VS Code (don't close the first one — click the `+` icon in the terminal panel), then:

```bash
cd frontend
npm install
npm run dev
```

You'll see something like:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open that link (`http://localhost:5173`) in your browser. You should see the **Login page**.

---

## 5. Create your first account

1. On the login page, click **Register**.
2. Pick a username, password, and set **Role = Admin** (so you can do everything, including deletes).
3. Click Register — you'll be logged in automatically and land on the Dashboard.

From here you can:
- Add **Routes** (start point, end point, stops, distance)
- Add **Vehicles** and **Drivers**
- Create **Schedules** (it will block you if you double-book a vehicle or driver at an overlapping time — that's the conflict detection working)
- Log **Fuel** and **Maintenance** records
- View **Reports** with charts and export a PDF

---

## 6. Push this project to GitHub (for your "Version Control" requirement)

1. Create a free account at https://github.com if you don't have one.
2. Click the **+** icon top-right → **New repository**. Name it e.g. `bus-management-system`. Don't add a README (you already have one). Click Create.
3. Back in VS Code terminal, **from the root `bus-management-system` folder** (not inside backend/frontend):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: full bus management system"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bus-management-system.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your actual GitHub username. It will ask you to sign in the first time.

Your `.env` files will NOT be pushed (they're excluded via `.gitignore`) — that's intentional, since they contain secrets. Each teammate will need to create their own `.env` from `.env.example` locally.

---

## 7. How the team can divide work from here (Agile / GitHub workflow)

Since the whole app is already built, your team can now focus on the **documentation and presentation** parts of the assignment instead of writing code from scratch:

- **Person 1**: Write up the Introduction, Project Objectives, and how you used Agile (e.g. weekly sprints, daily standups) + GitHub workflow (branches, commits, pull requests).
- **Person 2**: Write Functional Requirements (what the system does — list each feature), Non-Functional Requirements (performance, security, usability), and draw a Use Case Diagram (tools: draw.io / Lucidchart) showing actors (Admin, Staff) and their actions.
- **Person 3**: Draw the Database Design / ER Diagram (collections are listed below) and a Class Diagram of the models.
- **Person 4**: Write the Testing section (test each feature manually and note results in a table), a short User Manual (screenshots + how to use each page), and compile the final report.

If you genuinely want each person to also *touch the code* (e.g. for the GitHub commit history to show 4 contributors), the cleanest way is:
- Each person creates their own branch (`git checkout -b person1-auth`), makes a small cosmetic change to their component's files (e.g. tweak a label, add a comment, adjust a style), commits, and opens a Pull Request into `main`. This creates genuine commit history per person without breaking the working app.

---

## Database Collections Reference

This matches the structure you were given, with a few extra fields added so the app actually works end-to-end:

- **users**: username, password (hashed), role
- **drivers**: name, licenseNumber, contact, licenseExpiry, assignedRoute, status
- **vehicles**: registrationNumber, type, capacity, status
- **routes**: startPoint, endPoint, stops[], distance
- **schedules**: routeId, vehicleId, driverId, departureTime, arrivalTime
- **fuelLogs**: vehicleId, liters, cost, date
- **maintenance**: vehicleId, serviceType, cost, notes, date

---

## Troubleshooting

- **"MongoDB connection error"** → Check your `MONGO_URI` in `backend/.env` is correct, and (if using Atlas) that your IP is whitelisted (Atlas → Network Access → Add IP Address → Allow from anywhere, for testing).
- **Frontend shows network errors / can't log in** → Make sure the backend terminal is still running and shows "Server running on port 5000".
- **"Port already in use"** → Another program is using that port. Close other terminals running `npm run dev`, or change `PORT` in `.env`.
- **Tailwind styles not showing** → Make sure you ran `npm install` inside the `frontend` folder, then restart `npm run dev`.

Good luck with the project! 🚌# 🚌 Bus Management System

## 1. Install the tools you need (one-time setup)

You need 3 things on your computer:

1. **Node.js** (this runs both the backend and frontend)
   - Go to https://nodejs.org and download the **LTS** version.
   - Install it like any normal program (click Next, Next, Finish).
   - To check it worked, open a terminal/command prompt and type:
     ```
     node -v
     npm -v
     ```
     You should see version numbers, not an error.

2. **MongoDB** — you have two easy options, pick ONE:
   - **Option A (easiest, no install): MongoDB Atlas (cloud, free)**
     1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
     2. Create a free "Shared/M0" cluster.
     3. Click "Connect" → "Drivers" → copy the connection string. It looks like:
        `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
     4. Add `bus_management` at the end before the `?`, e.g.
        `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bus_management?retryWrites=true&w=majority`
     5. You'll paste this into `backend/.env` in Step 3 below.
   - **Option B: Install MongoDB locally**
     - Download from https://www.mongodb.com/try/download/community and install it (use default options). It runs automatically as a background service.

3. **VS Code** (code editor) — download from https://code.visualstudio.com and install it.

---

## 2. Open the project in VS Code

1. Unzip the project folder you downloaded.
2. Open VS Code → File → Open Folder → select the `bus-management-system` folder.
3. Open a terminal inside VS Code: **Terminal → New Terminal**.

You'll see two folders: `backend` and `frontend`. You need to set up and run BOTH.

---

## 3. Set up the Backend (the server + database connection)

In the VS Code terminal:

```bash
cd backend
npm install
```

This downloads all the packages the server needs (Express, MongoDB driver, JWT, etc). Wait for it to finish.

Now create your environment file:

1. Find the file `backend/.env.example`.
2. Make a copy of it in the same folder and rename the copy to exactly `.env`.
3. Open `.env` and fill it in:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/bus_management
   JWT_SECRET=any_long_random_text_you_want
   PORT=5000
   ```
   - If you used **MongoDB Atlas**, replace `MONGO_URI` with the connection string you copied in Step 1.
   - If you installed MongoDB **locally**, you can leave `MONGO_URI` exactly as shown above.
   - `JWT_SECRET` can be any random string — mash your keyboard, e.g. `kJ8x92mLpQ7vN3rT`.

Now start the backend:

```bash
npm run dev
```

You should see:
```
MongoDB connected successfully
Server running on port 5000
```

Leave this terminal running. Your backend is now live at `http://localhost:5000`.

---

## 4. Set up the Frontend (the website you see in the browser)

Open a **second terminal** in VS Code (don't close the first one — click the `+` icon in the terminal panel), then:

```bash
cd frontend
npm install
npm run dev
```

You'll see something like:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

Open that link (`http://localhost:5173`) in your browser. You should see the **Login page**.

---

## 5. Create your first account

1. On the login page, click **Register**.
2. Pick a username, password, and set **Role = Admin** (so you can do everything, including deletes).
3. Click Register — you'll be logged in automatically and land on the Dashboard.

From here you can:
- Add **Routes** (start point, end point, stops, distance)
- Add **Vehicles** and **Drivers**
- Create **Schedules** (it will block you if you double-book a vehicle or driver at an overlapping time — that's the conflict detection working)
- Log **Fuel** and **Maintenance** records
- View **Reports** with charts and export a PDF

---

## 6. Push this project to GitHub (for your "Version Control" requirement)

1. Create a free account at https://github.com if you don't have one.
2. Click the **+** icon top-right → **New repository**. Name it e.g. `bus-management-system`. Don't add a README (you already have one). Click Create.
3. Back in VS Code terminal, **from the root `bus-management-system` folder** (not inside backend/frontend):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: full bus management system"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bus-management-system.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your actual GitHub username. It will ask you to sign in the first time.

Your `.env` files will NOT be pushed (they're excluded via `.gitignore`) — that's intentional, since they contain secrets. Each teammate will need to create their own `.env` from `.env.example` locally.

---

## 7. How the team can divide work from here (Agile / GitHub workflow)

Since the whole app is already built, your team can now focus on the **documentation and presentation** parts of the assignment instead of writing code from scratch:

- **Person 1**: Write up the Introduction, Project Objectives, and how you used Agile (e.g. weekly sprints, daily standups) + GitHub workflow (branches, commits, pull requests).
- **Person 2**: Write Functional Requirements (what the system does — list each feature), Non-Functional Requirements (performance, security, usability), and draw a Use Case Diagram (tools: draw.io / Lucidchart) showing actors (Admin, Staff) and their actions.
- **Person 3**: Draw the Database Design / ER Diagram (collections are listed below) and a Class Diagram of the models.
- **Person 4**: Write the Testing section (test each feature manually and note results in a table), a short User Manual (screenshots + how to use each page), and compile the final report.

If you genuinely want each person to also *touch the code* (e.g. for the GitHub commit history to show 4 contributors), the cleanest way is:
- Each person creates their own branch (`git checkout -b person1-auth`), makes a small cosmetic change to their component's files (e.g. tweak a label, add a comment, adjust a style), commits, and opens a Pull Request into `main`. This creates genuine commit history per person without breaking the working app.

---

## Database Collections Reference

This matches the structure you were given, with a few extra fields added so the app actually works end-to-end:

- **users**: username, password (hashed), role
- **drivers**: name, licenseNumber, contact, licenseExpiry, assignedRoute, status
- **vehicles**: registrationNumber, type, capacity, status
- **routes**: startPoint, endPoint, stops[], distance
- **schedules**: routeId, vehicleId, driverId, departureTime, arrivalTime
- **fuelLogs**: vehicleId, liters, cost, date
- **maintenance**: vehicleId, serviceType, cost, notes, date

---

## Troubleshooting

- **"MongoDB connection error"** → Check your `MONGO_URI` in `backend/.env` is correct, and (if using Atlas) that your IP is whitelisted (Atlas → Network Access → Add IP Address → Allow from anywhere, for testing).
- **Frontend shows network errors / can't log in** → Make sure the backend terminal is still running and shows "Server running on port 5000".
- **"Port already in use"** → Another program is using that port. Close other terminals running `npm run dev`, or change `PORT` in `.env`.
- **Tailwind styles not showing** → Make sure you ran `npm install` inside the `frontend` folder, then restart `npm run dev`.

Good luck with the project! 🚌
