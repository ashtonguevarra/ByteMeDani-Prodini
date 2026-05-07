# Prodini – Interstitial Journaling App

## Overview

Prodini is an interstitial journaling app that helps users become more aware of how they spend their time. It automatically tracks desktop activity and encourages frequent reflection by showing activity logs in a clean interface. Instead of relying only on manual journaling, Prodini connects real computer usage with mindful productivity tracking.

---

## Features

* Automatic desktop activity tracking
* Real-time activity logs display
* Flask backend with SQL database storage
* Simple and clean Electron UI
* Interstitial-style frequent logging

---

## Tech Stack

* **Frontend:** Electron (HTML, CSS, JavaScript)
* **Backend:** Flask
* **Database:** SQLite (via SQLAlchemy)
* **Other Tools:** active-win

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/ashtonguevarra/Byte-Me-Dani.git
cd Prodini
```

---

### 2. Install frontend dependencies

```bash
npm install
```

---

### 3. Setup Flask backend

```bash
cd backend
python -m venv venv
```

Activate environment:

**Linux / macOS**

```bash
source venv/bin/activate
```

**Windows**

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install flask flask_sqlalchemy flask_cors
```

Run backend:

```bash
python app.py
```

---

### 4. Run the application

From root folder:

```bash
npm start
```

---

## Common Issues

* Missing Flask modules:

```bash
pip install flask flask_sqlalchemy flask_cors
```

* Electron not found:

```bash
npm install electron --save-dev
```

---

## 🎯 Purpose

This project helps users track productivity and analyze their daily digital habits through automatic logging and simple visualization.


