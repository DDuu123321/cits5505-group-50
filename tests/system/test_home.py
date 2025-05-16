from selenium.webdriver.common.by import By

def test_homepage_loads(browser, live_server):
    """测试首页是否正常加载"""
    # 访问首页
    browser.get(f"{live_server}/")
    
    # 确认页面标题包含应用名称
    assert "StudyTime Tracker" in browser.title or "StudyTime" in browser.title
    
    # 检查页面是否包含欢迎信息和版权信息
    page_content = browser.page_source
    assert "CITS5505 Project" in page_content