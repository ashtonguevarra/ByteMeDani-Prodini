from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

from models import ActivityLog

@app.route("/logs", methods=["POST"])
def get_logs():
    logs = ActivityLog.query.order_by(ActivityLog.timestamp.desc()),all()

    return jsonify([
        {
            "id": log.id,
            "app_name": log.app_name,
            "window_title": log.window_title,
            "timestamp": log.timestamp.isoformat()                    
        }
        for log in logs
    ])

if __name__ == "__main__":
    app.run(debug=True)