import pytest
from app.models import User, DirectShare
from app import db
from datetime import datetime, timedelta

def test_direct_share_creation(app):
    """测试创建DirectShare记录"""
    with app.app_context():
        # 创建两个测试用户
        user1 = User(username='user1', email='user1@example.com', password='password')
        user2 = User(username='user2', email='user2@example.com', password='password')
        
        db.session.add(user1)
        db.session.add(user2)
        db.session.flush()  # 确保用户获得ID
        
        # 创建DirectShare记录
        share = DirectShare(
            sharer_id=user1.id,
            recipient_id=user2.id,
            shared_total_study_time="5 hours 30 minutes",
            shared_longest_study_day_info="2025-05-15 (2 hours 15 minutes)"
        )
        
        db.session.add(share)
        db.session.commit()
        
        # 查询并验证
        saved_share = DirectShare.query.filter_by(sharer_id=user1.id, recipient_id=user2.id).first()
        
        assert saved_share is not None
        assert saved_share.shared_total_study_time == "5 hours 30 minutes"
        assert saved_share.shared_longest_study_day_info == "2025-05-15 (2 hours 15 minutes)"
        assert (datetime.utcnow() - saved_share.shared_at).total_seconds() < 5  # 确认时间戳是最近的

def test_query_received_shares(app):
    """测试查询接收到的分享记录"""
    with app.app_context():
        # 创建三个测试用户
        user1 = User(username='sender1', email='sender1@example.com', password='password')
        user2 = User(username='sender2', email='sender2@example.com', password='password')
        user3 = User(username='recipient', email='recipient@example.com', password='password')
        
        db.session.add_all([user1, user2, user3])
        db.session.flush()
        
        # 两个不同用户分享给同一个接收者
        share1 = DirectShare(
            sharer_id=user1.id, 
            recipient_id=user3.id,
            shared_total_study_time="10 hours",
            shared_longest_study_day_info="2025-05-15 (3 hours)"
        )
        
        share2 = DirectShare(
            sharer_id=user2.id, 
            recipient_id=user3.id,
            shared_total_study_time="8 hours",
            shared_longest_study_day_info="2025-05-14 (2 hours)"
        )
        
        db.session.add_all([share1, share2])
        db.session.commit()
        
        # 查询接收者收到的分享
        received_shares = DirectShare.query.filter_by(recipient_id=user3.id).all()
        
        assert len(received_shares) == 2
        senders = [share.sharer_id for share in received_shares]
        assert user1.id in senders
        assert user2.id in senders