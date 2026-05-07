# Prodini – Interstitial Journaling App

## Overview

Prodini is an interstitial journaling app that tracks your desktop activity in real time, turning everyday work into continuous, structured reflection. It reveals how your time is actually spent through clean, automatic logs and focused insights into your workflow patterns. With timely, context-aware notifications that prompt reflection in the moment, it makes sure your attention stays exactly where it needs to be.

# How It Works

Prodini is a desktop productivity tracker inspired by Interstitial Journaling. It automatically logs the apps and windows a user interacts with during a work session to help users understand how they spend their time.

---

## Workflow

### 1. Start a Session
- The user opens the app and starts tracking.
- A new productivity session is created.

### 2. Track Activity
The Electron app detects the currently active window/application.

Examples:
- VS Code
- Chrome
- Discord
- Spotify

The app continuously records:
- Application name
- Window title
- Timestamp

### 3. Save to Database
- Activity data is sent to the Flask backend through API routes.
- Logs are stored in a local SQLite database.

### 4. View Session History
- Users can open previous sessions in the History tab.
- Each session contains its own activity logs.

### 5. Analyze Productivity
- The dashboard visualizes usage data through charts and summaries.
- Users can identify productive vs distracting activities.

---

# Setup Instructions

## 1. Clone the Repository

```bash
git clone https://github.com/ashtonguevarra/Byte-Me-Dani.git
cd Byte-Me-Dani
```

---

## 2. Install Frontend Dependencies

From the root folder:

```bash
npm install
```

---

## 3. Setup the Flask Backend

Move into the backend folder:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

### Activate the Virtual Environment

#### Linux / macOS

```bash
source venv/bin/activate
```

#### Windows

```bash
venv\Scripts\activate
```

Install backend dependencies:

```bash
pip install flask flask_sqlalchemy flask_cors
```

Run the Flask backend:

```bash
python app.py
```

---

## 4. Run the Electron Application

Open another terminal in the project root folder and run:

```bash
npm start
```

## Common Issues

* Missing Flask modules:

```bash
pip install flask flask_sqlalchemy flask_cors
```

* Electron not found:

```bash
npm install electron --save-dev
```




