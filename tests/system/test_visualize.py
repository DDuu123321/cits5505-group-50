from selenium.webdriver.common.by import By

def test_visualize_page_loads(browser, live_server):
    """测试数据可视化页面是否正常加载"""
    # 访问可视化页面
    browser.get(f"{live_server}/visualize")
    
    # 检查图表容器
    chart_containers = browser.find_elements(By.CLASS_NAME, "chart-container")
    assert len(chart_containers) > 0
    
    # 检查日期选择器
    date_selectors = browser.find_elements(By.CSS_SELECTOR, "input[type='date']")
    assert len(date_selectors) >= 2  # 应有起始和结束日期选择器

def test_filter_controls(browser, live_server):
    """测试数据过滤控件是否存在"""
    # 访问可视化页面
    browser.get(f"{live_server}/visualize")
    
    # 检查过滤按钮
    filter_button = browser.find_element(By.ID, "filterApply")
    assert filter_button.is_displayed()
    
    # 检查是否有图表ID
    chart_ids = ["studyBarChart", "subjectPieChart", "efficiencyTimeChart", 
                "locationEfficiencyChart", "timeLocationHeatmap"]
    
    for chart_id in chart_ids:
        elements = browser.find_elements(By.ID, chart_id)
        assert len(elements) > 0, f"找不到图表: {chart_id}"