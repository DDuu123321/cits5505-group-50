from app import db
from flask_login import UserMixin
from datetime import datetime

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(60), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    subjects = db.relationship('Subject', backref='owner', lazy=True)
    study_sessions = db.relationship('StudySession', backref='user', lazy=True)

    def __repr__(self):
        return f"User('{self.username}', '{self.email}')"

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    color_code = db.Column(db.String(20), default="#3498db")
    target_hours_per_week = db.Column(db.Float, default=5.0)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def __repr__(self):
        return f"Subject('{self.name}')"

class StudySession(db.Model):
    __tablename__ = 'study_session'
    __table_args__ = (
        db.Index('idx_user_date', 'user_id', 'date'),
    )
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    location = db.Column(db.String(100), nullable=False)
    efficiency = db.Column(db.Integer, nullable=False)
    notes = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def __repr__(self):
        return f"StudySession('{self.subject}', '{self.date}', '{self.start_time}-{self.end_time}')"

class Report(db.Model):
    __tablename__ = 'report'
    __table_args__ = (
        db.Index('idx_access_code', 'access_code'),
    )
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    access_code = db.Column(db.String(10), unique=True)
    permission_level = db.Column(db.String(20), default='view')  # 'view' or 'comment'
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    subjects = db.Column(db.Text)  # Comma-separated list of subjects
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    owner = db.relationship('User', backref='reports')
    # Add relationship to SharedWith
    
    def __repr__(self):
        return f"Report('{self.title}', created by {self.owner.username})"


class DirectShare(db.Model):
    __tablename__ = 'direct_share' # 表名
    id = db.Column(db.Integer, primary_key=True) # 每条分享的唯一ID
    sharer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # 分享者的用户ID
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False) # 接收者的用户ID
    shared_total_study_time = db.Column(db.String(100)) # 分享的总学习时间 (文本)
    shared_longest_study_day_info = db.Column(db.String(150)) # 分享的学习最久的那天信息 (文本)
    shared_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow) # 分享的时间

    # 建立与 User 模型的关系，方便我们通过 DirectShare 对象直接获取分享者和接收者的用户信息
    sharer = db.relationship('User', foreign_keys=[sharer_id], backref=db.backref('sent_shares', lazy='dynamic'))
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref=db.backref('received_shares', lazy='dynamic'))

    def __repr__(self):
        return f'<DirectShare from {self.sharer_id} to {self.recipient_id} at {self.shared_at}>'
