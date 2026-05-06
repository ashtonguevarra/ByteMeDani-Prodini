from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///activity.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class Session(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("session.id"), nullable=False)
    app_name = db.Column(db.String(100), nullable=False)
    window_title = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

@app.route("/sessions/start", methods=["POST"])
def start_session():
    new_session = Session()
    db.session.add(new_session)
    db.session.commit()

    return jsonify({
        "message": "Session started",
        "session_id": new_session.id
    }), 201

@app.route("/sessions/<int:session_id>/stop", methods=["POST"])
def stop_session(session_id):
    session = Session.query.get_or_404(session_id)
    session.ended_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Session stopped"})

@app.route("/logs", methods=["POST"])
def add_log():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    session_id = data.get("session_id")
    app_name = data.get("app_name")
    window_title = data.get("window_title")

    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400

    log = ActivityLog(
        session_id=session_id,
        app_name=app_name or "Unknown",
        window_title=window_title or "Unknown"
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Log saved", "log_id": log.id}), 201

@app.route("/")
def home():
    return "Backend running", 200

@app.route("/sessions", methods=["GET"])
def get_sessions():
    sessions = Session.query.order_by(Session.started_at.desc()).all()

    return jsonify([
        {
            "id": s.id,
            "started_at": s.started_at.isoformat(),
            "ended_at": s.ended_at.isoformat() if s.ended_at else None
        }
        for s in sessions
    ])

@app.route("/sessions/<int:session_id>/logs", methods=["GET"])
def get_session_logs(session_id):
    logs = ActivityLog.query.filter_by(session_id=session_id).order_by(ActivityLog.timestamp.asc()).all()

    return jsonify([
        {
            "id": log.id,
            "session_id": log.session_id,
            "app_name": log.app_name,
            "window_title": log.window_title,
            "timestamp": log.timestamp.isoformat()
        }
        for log in logs
    ])

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True, port=5000)

@app.route("/sessions", methods=["GET"])
def get_sessions():
    sessions = Session.query.order_by(Session.started_at.desc()).all()

    return jsonify([
        {
            "id": s.id,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None
        }
        for s in sessions
    ])