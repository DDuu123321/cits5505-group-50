from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_login_page(browser, live_server):
    """测试登录页面是否正常显示"""
    # 访问登录页面
    browser.get(f"{live_server}/login")
    
    # 检查表单元素
    email_field = browser.find_element(By.ID, "email")
    password_field = browser.find_element(By.ID, "password")
    login_button = browser.find_element(By.CSS_SELECTOR, "button[type='submit']")
    
    # 验证元素存在
    assert email_field.is_displayed()
    assert password_field.is_displayed()
    assert login_button.is_displayed()

def test_register_page(browser, live_server):
    """测试注册页面是否正常显示"""
    # 访问注册页面
    browser.get(f"{live_server}/register")
    
    # 检查表单元素
    username_field = browser.find_element(By.ID, "username")
    email_field = browser.find_element(By.ID, "email")
    password_field = browser.find_element(By.ID, "password")
    confirm_field = browser.find_element(By.ID, "confirm_password")
    
    # 验证元素存在
    assert username_field.is_displayed()
    assert email_field.is_displayed()
    assert password_field.is_displayed()
    assert confirm_field.is_displayed()