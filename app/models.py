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
