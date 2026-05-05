from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///activity.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    app_name = db.Column(db.String(100), nullable=False)
    window_title = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route("/logs", methods=["POST"])
def add_log():
    data = request.json

    log = ActivityLog(
        app_name=data.get("app_name", "Unknown App"),
        window_title=data.get("window_title", "Unknown Window")
    )

    db.session.add(log)
    db.session.commit()

    return jsonify({"message": "Log saved"}), 201

@app.route("/logs", methods=["GET"])
def get_logs():
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(100).all()

    return jsonify([
        {
            "id": log.id,
            "app_name": log.app_name,
            "window_title": log.window_title,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }
        for log in logs
    ])

if __name__ == "__main__":
    app.run(port=5000, debug=True)