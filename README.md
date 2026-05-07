# Prodini – Interstitial Journaling App

## Overview

Prodini is an interstitial journaling app that tracks your desktop activity in real time, turning everyday work into continuous, structured reflection. It reveals how your time is actually spent through clean, automatic logs and focused insights into your workflow patterns. With timely, context-aware notifications that prompt reflection in the moment, it makes sure your attention stays exactly where it needs to be.

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




