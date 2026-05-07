# Prodini – Interstitial Journaling App

## Overview

Prodini is an interstitial journaling app that helps users become more aware of how they spend their time. It automatically tracks desktop activity and encourages frequent reflection by showing activity logs in a clean interface. Instead of relying only on manual journaling, Prodini connects real computer usage with mindful productivity tracking. Prodini combines activity tracking, productivity statistics, and visual summaries in a clean and simple interface, allowing users to better understand their focus patterns, distractions, and daily workflow.

---

## Features

* Automatic desktop activity tracking
* Real-time activity logs display
* Productivity statistics and visual activity insights
* Simple and clean UI
* Interstitial-style frequent logging
* Session-based focus tracking
* Break timer and productivity balance support
* Customizable productivity classifications
* Interactive activity charts and reports

---

## Tech Stack

* **Frontend:** Electron (HTML, CSS, JavaScript)
* **Backend:** Flask
* **Database:** SQLite (via SQLAlchemy)
* **Other Tools:** active-win, xdotool

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




