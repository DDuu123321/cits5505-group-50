from selenium.webdriver.common.by import By
import time

def test_timer_page_loads(browser, live_server):
    """测试计时器页面是否正常加载"""
    # 访问上传/计时器页面
    browser.get(f"{live_server}/upload")
    
    # 检查计时器元素
    timer_display = browser.find_element(By.ID, "timerDisplay")
    start_button = browser.find_element(By.ID, "startTimer")
    pause_button = browser.find_element(By.ID, "pauseTimer")
    reset_button = browser.find_element(By.ID, "resetTimer")
    
    # 验证元素存在
    assert timer_display.is_displayed()
    assert start_button.is_displayed()
    assert pause_button.is_displayed()
    assert reset_button.is_displayed()
    
    # 验证初始计时器显示为零
    assert "00:00:00" in timer_display.text

def test_timer_starts(browser, live_server):
    """测试计时器是否能正常启动"""
    # 访问上传/计时器页面
    browser.get(f"{live_server}/upload")
    
    # 获取开始按钮和计时器显示
    timer_display = browser.find_element(By.ID, "timerDisplay")
    start_button = browser.find_element(By.ID, "startTimer")
    
    # 点击开始按钮
    start_button.click()
    
    # 等待3秒
    time.sleep(3)
    
    # 验证计时器不再显示00:00:00
    assert timer_display.text != "00:00:00"