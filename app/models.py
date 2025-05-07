from . import db  # ✅ 从当前模块引入已初始化的 db

class StudySession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    efficiency = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    interruptions = db.Column(db.Integer, nullable=False, default=0)

''' shared db'''
from datetime import datetime
import uuid
from app import db

class SharedReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    report_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    data = db.Column(db.Text, nullable=False)  # You can store JSON-serialized data here
    is_public = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f'<SharedReport {self.report_id} by User {self.user_id}>'
