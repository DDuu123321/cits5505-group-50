import pytest
from app.models import User
from app import bcrypt

def test_password_hashing(app):
    """测试密码哈希功能是否正确工作"""
    with app.app_context():
        u = User(username='test', email='test@example.com')
        u.password = bcrypt.generate_password_hash('cat').decode('utf-8')
        assert bcrypt.check_password_hash(u.password, 'cat')
        assert not bcrypt.check_password_hash(u.password, 'dog')

def test_password_hashing_creates_different_hashes(app):
    """测试相同密码产生不同的哈希值"""
    with app.app_context():
        u1 = User(username='user1', email='user1@example.com')
        u1.password = bcrypt.generate_password_hash('same_password').decode('utf-8')
        
        u2 = User(username='user2', email='user2@example.com')
        u2.password = bcrypt.generate_password_hash('same_password').decode('utf-8')
        
        # 确保哈希值不同
        assert u1.password != u2.password