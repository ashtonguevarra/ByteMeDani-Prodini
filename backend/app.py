# ============================================
# ACTIVITY LOGGER - BACKEND API (Flask)
# ============================================
# This Flask application provides REST API endpoints for:
# - Managing tracking sessions (start/stop)
# - Storing and retrieving activity logs
# - Persisting data in a SQLite database
# ============================================

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

# Initialize Flask application
app = Flask(__name__)

# Enable CORS (Cross-Origin Resource Sharing) to allow requests from the Electron frontend
CORS(app)

# ============== DATABASE CONFIGURATION ==============
# Configure SQLite database for storing activity logs
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///activity.db"
# Disable modification tracking to improve performance
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize SQLAlchemy ORM (Object-Relational Mapping)
db = SQLAlchemy(app)

# ============== DATABASE MODELS ==============
/**
 * Session Model - Represents a tracking session
 * Stores the start and end times for periods when the user is being tracked
 */
class Session(db.Model):
    """
    Tracks a single session of activity monitoring
    """
    # Primary key - unique identifier for each session
    id = db.Column(db.Integer, primary_key=True)
    # Timestamp when the session started (auto-set to current time)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Timestamp when the session ended (NULL if still ongoing)
    ended_at = db.Column(db.DateTime, nullable=True)


/**
 * ActivityLog Model - Represents individual window activity entries
 * Each log entry records what application was active at a specific time
 */
class ActivityLog(db.Model):
    """
    Records a single window change event during a session
    """
    # Primary key - unique identifier for each log entry
    id = db.Column(db.Integer, primary_key=True)
    # Foreign key linking to the parent Session
    session_id = db.Column(db.Integer, db.ForeignKey("session.id"), nullable=False)
    # Name of the application that was active
    app_name = db.Column(db.String(100), nullable=False)
    # Title/content of the window
    window_title = db.Column(db.String(255), nullable=False)
    # Timestamp when this activity was recorded
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# ============== SESSION ENDPOINTS ==============
/**
 * POST /sessions/start
 * Starts a new tracking session
 * Returns the session ID to be used for subsequent log entries
 */
@app.route("/sessions/start", methods=["POST"])
def start_session():
    """
    Creates a new tracking session in the database
    """
    # Create a new session object (uses current time automatically)
    new_session = Session()
    # Add the session to the database transaction
    db.session.add(new_session)
    # Commit the transaction to persist to disk
    db.session.commit()

    # Return the new session ID to the client
    return jsonify({
        "message": "Session started",
        "session_id": new_session.id
    }), 201


/**
 * POST /sessions/<session_id>/stop
 * Ends a tracking session
 * Records the end time for the specified session
 */
@app.route("/sessions/<int:session_id>/stop", methods=["POST"])
def stop_session(session_id):
    """
    Marks a session as ended by setting the ended_at timestamp
    """
    # Retrieve the session from the database, return 404 if not found
    session = Session.query.get_or_404(session_id)
    # Set the end time to the current time
    session.ended_at = datetime.utcnow()
    # Commit the changes to the database
    db.session.commit()

    return jsonify({"message": "Session stopped"})

# ============== ACTIVITY LOG ENDPOINTS ==============
/**
 * POST /logs
 * Adds a new activity log entry
 * Records that a specific window was active at a specific time
 */
@app.route("/logs", methods=["POST"])
def add_log():
    """
    Creates a new activity log entry in the database
    Expected JSON format: {
        "session_id": <int>,
        "app_name": <string>,
        "window_title": <string>
    }
    """
    # Parse the incoming JSON data
    data = request.get_json()

    # Validate that JSON data was provided
    if not data:
        return jsonify({"error": "No JSON received"}), 400

    # Extract the session ID (required)
    session_id = data.get("session_id")
    # Extract the application name (optional, defaults to "Unknown")
    app_name = data.get("app_name")
    # Extract the window title (optional, defaults to "Unknown")
    window_title = data.get("window_title")

    # Validate that a session_id was provided
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400

    # Create a new activity log entry
    log = ActivityLog(
        session_id=session_id,
        app_name=app_name or "Unknown",  # Use "Unknown" if app_name is not provided
        window_title=window_title or "Unknown"  # Use "Unknown" if window_title is not provided
    )

    # Add the log entry to the database transaction
    db.session.add(log)
    # Commit the transaction to persist to disk
    db.session.commit()

    # Return the new log ID to the client
    return jsonify({"message": "Log saved", "log_id": log.id}), 201

# ============== UTILITY ENDPOINTS ==============
/**
 * GET /
 * Health check endpoint
 * Returns a simple message to verify the backend is running
 */
@app.route("/")
def home():
    """
    Simple health check - returns 200 OK if the server is running
    """
    return "Backend running", 200

# ============== QUERY ENDPOINTS ==============
/**
 * GET /sessions
 * Retrieves all tracking sessions
 * Returns sessions in descending order (newest first)
 */
@app.route("/sessions", methods=["GET"])
def get_sessions():
    """
    Fetches all sessions from the database ordered by start time (newest first)
    """
    # Query all sessions, ordered by start time in descending order
    sessions = Session.query.order_by(Session.started_at.desc()).all()

    # Format the sessions as JSON
    return jsonify([
        {
            "id": s.id,
            "started_at": s.started_at.isoformat(),  # Convert to ISO format string
            "ended_at": s.ended_at.isoformat() if s.ended_at else None  # NULL if still ongoing
        }
        for s in sessions
    ])


/**
 * GET /sessions/<session_id>/logs
 * Retrieves all activity logs for a specific session
 * Returns logs in ascending order (oldest first)
 */
@app.route("/sessions/<int:session_id>/logs", methods=["GET"])
def get_session_logs(session_id):
    """
    Fetches all activity logs for a specific session, ordered by timestamp (oldest first)
    """
    # Query all logs for the given session, ordered chronologically
    logs = ActivityLog.query.filter_by(session_id=session_id).order_by(ActivityLog.timestamp.asc()).all()

    # Format the logs as JSON
    return jsonify([
        {
            "id": log.id,
            "session_id": log.session_id,
            "app_name": log.app_name,
            "window_title": log.window_title,
            "timestamp": log.timestamp.isoformat()  # Convert to ISO format string
        }
        for log in logs
    ])

# ============== DATABASE INITIALIZATION ==============
# Run this code when the Flask app context is active
with app.app_context():
    # Create all database tables defined by the models
    # If tables already exist, this does nothing
    db.create_all()

# ============== APPLICATION STARTUP ==============
# Only run the development server if this file is executed directly
if __name__ == "__main__":
    # Start Flask development server
    # debug=True enables auto-reload on code changes and detailed error pages
    # port=5000 runs on localhost:5000
    app.run(debug=True, port=5000)


