import pytest
from app import create_app, db
from app.models import User, Subject, StudySession, Report, DirectShare
import os
import tempfile




@pytest.fixture
def app():
    """创建并配置用于测试的Flask应用实例"""
    # 创建临时数据库文件
    db_fd, db_path = tempfile.mkstemp()
    
    # 直接在创建应用时传入测试配置 - 这是关键修改
    app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'WTF_CSRF_ENABLED': False,  # 在测试中禁用CSRF保护
    })

    # 创建数据库表并运行测试
    with app.app_context():
        db.create_all()
        yield app
        
        # 清理数据库
        db.session.remove()
        db.drop_all()
    
    # 关闭临时数据库文件
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """提供测试客户端"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """提供CLI测试运行器"""
    return app.test_cli_runner()

@pytest.fixture
def auth_client(app):
    """提供已认证的测试客户端，带有一个测试用户"""
    with app.app_context():
        # 创建测试用户
        from app import bcrypt
        hashed_password = bcrypt.generate_password_hash('password').decode('utf-8')
        user = User(
            username='testuser',
            email='test@example.com',
            password=hashed_password
        )
        db.session.add(user)
        db.session.commit()
    
    client = app.test_client()
    
    # 登录测试用户
    with client.session_transaction() as sess:
        sess['_user_id'] = '1'  # 假设用户ID为1
    
    yield client

    