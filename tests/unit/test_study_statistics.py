import pytest
from app.models import User, StudySession
from app import db
from datetime import datetime, time, timedelta

def test_total_study_time_calculation(app):
    """测试计算总学习时间"""
    with app.app_context():
        # 创建测试用户
        user = User(username='statsuser', email='stats@example.com', password='password')
        db.session.add(user)
        db.session.flush()
        
        # 添加三条学习记录
        date1 = datetime(2025, 5, 15).date()
        session1 = StudySession(
            user_id=user.id,
            subject="Math",
            date=date1,
            start_time=time(9, 0),  # 9:00
            end_time=time(11, 0),   # 11:00
            location="Library",
            efficiency=5,
            notes="Test session 1"
        )
        
        date2 = datetime(2025, 5, 16).date()
        session2 = StudySession(
            user_id=user.id,
            subject="Physics",
            date=date2,
            start_time=time(14, 0),  # 14:00
            end_time=time(16, 30),   # 16:30
            location="Home",
            efficiency=4,
            notes="Test session 2"
        )
        
        date3 = datetime(2025, 5, 16).date()
        session3 = StudySession(
            user_id=user.id,
            subject="Literature",
            date=date3,
            start_time=time(20, 0),  # 20:00
            end_time=time(21, 0),    # 21:00
            location="Cafe",
            efficiency=3,
            notes="Test session 3"
        )
        
        db.session.add_all([session1, session2, session3])
        db.session.commit()
        
        # 计算总学习时间
        all_sessions = StudySession.query.filter_by(user_id=user.id).all()
        total_minutes = 0
        
        for session in all_sessions:
            start_dt = datetime.combine(session.date, session.start_time)
            end_dt = datetime.combine(session.date, session.end_time)
            
            if end_dt < start_dt:  # 处理跨天情况
                end_dt += timedelta(days=1)
                
            session_minutes = (end_dt - start_dt).total_seconds() // 60
            total_minutes += session_minutes
        
        # 预期总时间：2小时 + 2小时30分钟 + 1小时 = 5小时30分钟 = 330分钟
        assert total_minutes == 330

def test_longest_study_day(app):
    """测试确定最长学习日"""
    with app.app_context():
        # 创建测试用户
        user = User(username='dayuser', email='day@example.com', password='password')
        db.session.add(user)
        db.session.flush()
        
        # 日期1：总计3小时
        date1 = datetime(2025, 5, 15).date()
        session1 = StudySession(
            user_id=user.id,
            subject="Math",
            date=date1,
            start_time=time(9, 0),
            end_time=time(11, 0),  # 2小时
            location="Library",
            efficiency=5,
            notes="Test session 1"
        )
        
        session2 = StudySession(
            user_id=user.id,
            subject="Math",
            date=date1,
            start_time=time(14, 0),
            end_time=time(15, 0),  # 1小时
            location="Library",
            efficiency=5,
            notes="Test session 2"
        )
        
        # 日期2：总计4小时（应该是最长的）
        date2 = datetime(2025, 5, 16).date()
        session3 = StudySession(
            user_id=user.id,
            subject="Physics",
            date=date2,
            start_time=time(13, 0),
            end_time=time(17, 0),  # 4小时
            location="Home",
            efficiency=4,
            notes="Test session 3"
        )
        
        db.session.add_all([session1, session2, session3])
        db.session.commit()
        
        # 计算每天的总学习时间
        all_sessions = StudySession.query.filter_by(user_id=user.id).all()
        daily_minutes = {}
        
        for session in all_sessions:
            start_dt = datetime.combine(session.date, session.start_time)
            end_dt = datetime.combine(session.date, session.end_time)
            
            if end_dt < start_dt:  # 处理跨天情况
                end_dt += timedelta(days=1)
                
            session_minutes = int((end_dt - start_dt).total_seconds() // 60)
            
            if session.date in daily_minutes:
                daily_minutes[session.date] += session_minutes
            else:
                daily_minutes[session.date] = session_minutes
        
        # 找出学习时间最长的一天
        longest_day = max(daily_minutes, key=daily_minutes.get)
        longest_day_minutes = daily_minutes[longest_day]
        
        # 验证最长的一天是第二天（2025-5-16）
        assert longest_day == date2
        assert longest_day_minutes == 240  # 4小时 = 240分钟
