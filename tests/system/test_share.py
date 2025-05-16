from selenium.webdriver.common.by import By

def test_share_page_loads(browser, live_server):
    """测试分享页面是否正常加载"""
    # 访问分享页面
    browser.get(f"{live_server}/share")
    
    # 检查页面标题
    assert "Share" in browser.title
    
    # 检查分享选项区域
    share_options = browser.find_elements(By.CLASS_NAME, "share-option")
    assert len(share_options) > 0
    
    # 检查直接分享表单元素
    recipient_field = browser.find_elements(By.ID, "recipient_email")
    share_button = browser.find_elements(By.CSS_SELECTOR, "button[type='submit']")
    
    assert len(recipient_field) > 0
    assert len(share_button) > 0