import pytest
from app.forms import LoginForm, RegistrationForm

def test_login_form_validation(app):
    """测试登录表单验证"""
    with app.app_context():
        # 测试有效表单数据
        form = LoginForm(data={
            'email': 'test@example.com',
            'password': 'password123'
        })
        assert form.validate() is True
        
        # 测试无效邮箱
        form = LoginForm(data={
            'email': 'notanemail',
            'password': 'password123'
        })
        assert form.validate() is False
        assert 'Invalid email address' in str(form.email.errors)
        
        # 测试空密码
        form = LoginForm(data={
            'email': 'test@example.com',
            'password': ''
        })
        assert form.validate() is False
        assert 'This field is required' in str(form.password.errors)

def test_registration_form_validation(app):
    """测试注册表单验证"""
    with app.app_context():
        # 测试有效表单数据
        form = RegistrationForm(data={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'Password123',
            'confirm_password': 'Password123'
        })
        assert form.validate() is True
        
        # 测试密码不匹配
        form = RegistrationForm(data={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'Password123',
            'confirm_password': 'DifferentPassword'
        })
        assert form.validate() is False
        assert 'Field must be equal to password' in str(form.confirm_password.errors)
        
        # 测试用户名太短
        form = RegistrationForm(data={
            'username': 'te',  # 太短
            'email': 'test@example.com',
            'password': 'Password123',
            'confirm_password': 'Password123'
        })
        assert form.validate() is False
        assert 'must be between' in str(form.username.errors)