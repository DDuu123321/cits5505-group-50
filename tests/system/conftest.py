import pytest
import socket
import threading
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

@pytest.fixture(scope="function")
def browser():
    """提供已配置的Chrome浏览器实例"""
    # 设置Chrome选项
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # 无头模式，不显示浏览器窗口
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
   
    # 创建并配置浏览器
    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=chrome_options
    )
    driver.implicitly_wait(10)  # 设置隐式等待
   
    yield driver
   
    # 测试完成后关闭浏览器
    driver.quit()

@pytest.fixture(scope="function")
def test_app():
    """创建一个测试专用的Flask应用实例，与原应用完全隔离"""
    from app import create_app
    from app import db as _db
    
    # 创建测试专用配置
    test_config = {
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",  # 使用内存数据库隔离测试
        "WTF_CSRF_ENABLED": False,
        "SERVER_NAME": "localhost.localdomain",  # 确保域名隔离
        "PRESERVE_CONTEXT_ON_EXCEPTION": False
    }
    
    flask_app = create_app(test_config) 
    
    # 使用应用上下文
    with flask_app.app_context():
        _db.create_all()  # 创建测试数据库表
        
        yield flask_app  # 提供应用实例
        
        # 清理测试数据
        _db.session.remove()
        _db.drop_all()

@pytest.fixture(scope="function")
def live_server(test_app):
    """运行一个测试服务器实例，与主应用完全隔离"""
    # 选择一个随机端口，避免冲突
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()
   
    # 在单独的线程中运行Flask应用
    server = threading.Thread(target=test_app.run, kwargs={
        'port': port,
        'debug': False,
        'use_reloader': False,
        'threaded': True
    })
    server.daemon = True
    server.start()
   
    # 等待服务器启动
    import time
    time.sleep(1)
    
    # 返回服务器URL
    yield f"http://localhost:{port}"