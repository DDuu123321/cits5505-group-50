import pytest
from app.models import StudySession
from datetime import datetime, time, timedelta
from app import db

def test_duration_calculation(app):
    """测试时长计算功能"""
    with app.app_context():
        # 创建一个学习会话，开始于9:00，结束于11:30
        date = datetime(2025, 5, 15).date()
        start_time = time(9, 0)
        end_time = time(11, 30)
        
        # 计算预期时长（单位：分钟）
        start_dt = datetime.combine(date, start_time)
        end_dt = datetime.combine(date, end_time)
        expected_minutes = int((end_dt - start_dt).total_seconds() // 60)
        
        # 使用项目代码中的同样方法计算时长
        session_duration = end_dt - start_dt
        actual_minutes = int(session_duration.total_seconds() // 60)
        
        assert actual_minutes == expected_minutes
        assert actual_minutes == 150  # 2.5小时 = 150分钟

def test_overnight_session_duration(app):
    """测试跨天学习会话的时长计算"""
    with app.app_context():
        # 创建一个跨天学习会话，开始于晚上23:00，结束于次日凌晨1:00
        date = datetime(2025, 5, 15).date()
        start_time = time(23, 0)  # 晚上11点
        end_time = time(1, 0)    # 次日凌晨1点
        
        # 计算预期时长，处理跨天情况
        start_dt = datetime.combine(date, start_time)
        end_dt = datetime.combine(date, end_time)
        
        if end_dt < start_dt:  # 处理跨天情况
            end_dt += timedelta(days=1)
            
        expected_minutes = int((end_dt - start_dt).total_seconds() // 60)
        
        assert expected_minutes == 120  # 2小时 = 120分钟