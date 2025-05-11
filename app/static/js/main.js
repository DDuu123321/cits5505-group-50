/**
 * StudyTime Tracker - Main JavaScript
 * This file contains the core JavaScript functionality for the StudyTime Tracker application.
 * For the first presentation, this file includes placeholder functions and structure only.
 * CITS5505 Project
 */

// Define global variables
let timerRunning = false;
let timerPaused = false;
let timerInterval;
let seconds = 0;

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize components based on current page
  initCurrentPage();
});

/**
 * Determines which page is currently active and initializes appropriate components
 */
function initCurrentPage() {
  const currentPath = window.location.pathname;

  if (currentPath.includes("index") || currentPath === "/") {
    initHomePage();
  } else if (currentPath.includes("upload")) {
    initUploadPage();
  } else if (currentPath.includes("visualize")) {
    initVisualizePage();  
  } else if (currentPath.includes("share")) {
    initSharePage();
  }
}


/**
 * Initialize home page components
 */
function initHomePage() {

  // 移除原先的表单处理代码，因为我们现在使用Flask表单提交
  // const loginForm = document.getElementById("loginForm");
  // if (loginForm) {
  //   loginForm.addEventListener("submit", function (e) {
  //     e.preventDefault();
  //   });
  // }
  
  // 其他主页初始化代码...
}

/**
 * Initialize upload page components
 */
function initUploadPage() {
  console.log("Upload page initialized");

  // 定义全局计时器变量（改为局部变量，不影响外部定义的相同变量）
  let timerInterval = null;
  let seconds = 0;
  let efficiency = 5;  // 默认效率为5（最高）
  let timerRunning = false;
  let timerPaused = false;

  // 获取DOM元素
  const startBtn = document.getElementById('startTimer');
  const pauseBtn = document.getElementById('pauseTimer');
  const resetBtn = document.getElementById('resetTimer');
  const saveBtn = document.getElementById('saveSession');
  const timerDisplay = document.getElementById('timerDisplay');
  const efficiencyRating = document.getElementById('efficiencyRating');
  const efficiencyStars = document.querySelectorAll('.efficiency-star');

  if (startBtn && pauseBtn && resetBtn && saveBtn) {
    console.log("Timer controls found, adding event listeners");

    // 开始计时按钮
    startBtn.addEventListener('click', function() {
      if (!timerRunning) {
        startTimer();
      }
    });

    // 暂停按钮
    pauseBtn.addEventListener('click', function() {
      if (timerRunning) {
        pauseTimer();
      } else if (timerPaused) {
        resumeTimer();
      }
    });

    // 重置按钮
    resetBtn.addEventListener('click', function() {
      resetTimer();
    });

    // 保存会话按钮
    saveBtn.addEventListener('click', function() {
      saveStudySession();
    });
    
    // 添加效率星级评分事件监听
    if (efficiencyStars) {
      const ratingOptions = document.querySelectorAll('.rating-option');
      
      // 为每个评分选项添加事件监听
      if (ratingOptions.length > 0) {
        ratingOptions.forEach(option => {
          const star = option.querySelector('.efficiency-star');
          if (star) {
            const value = parseInt(star.getAttribute('data-value'));
            
            option.addEventListener('click', function() {
              setEfficiencyRating(value);
            });
            
            option.addEventListener('mouseover', function() {
              highlightStars(value);
            });
            
            option.addEventListener('mouseout', function() {
              highlightStars(efficiency);
            });
          }
        });
      } else {
        // 如果没有找到评分选项容器，则使用星星元素
        efficiencyStars.forEach(star => {
          star.addEventListener('click', function() {
            const value = parseInt(this.getAttribute('data-value'));
            setEfficiencyRating(value);
          });
          
          star.addEventListener('mouseover', function() {
            const value = parseInt(this.getAttribute('data-value'));
            highlightStars(value);
          });
          
          star.addEventListener('mouseout', function() {
            highlightStars(efficiency);
          });
        });
      }
    }
  } else {
    console.warn("Timer controls not found on this page");
  }

  // 补零函数
  function padNumber(num) {
    return String(num).padStart(2, '0');
  }
  
  // 开始计时
  function startTimer() {
    console.log("Starting timer");
    timerRunning = true;
    timerPaused = false;

    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) {
      pauseBtn.disabled = false;
      pauseBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
    }
    if (resetBtn) resetBtn.disabled = false;
    if (saveBtn) saveBtn.disabled = false;
    
    // 隐藏效率评分（只有在暂停或保存前才显示）
    if (efficiencyRating) efficiencyRating.style.display = 'none';

    // 开始计时
    timerInterval = setInterval(updateTimer, 1000);
  }

  // 暂停计时
  function pauseTimer() {
    console.log("Pausing timer");
    timerRunning = false;
    timerPaused = true;

    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-play me-2"></i>Resume';
    }
    
    // 显示效率评分
    if (efficiencyRating) efficiencyRating.style.display = 'block';
    
    // 突出显示当前效率评分
    highlightStars(efficiency);

    clearInterval(timerInterval);
  }

  // 恢复计时
  function resumeTimer() {
    console.log("Resuming timer");
    timerRunning = true;
    timerPaused = false;

    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
    }
    
    // 隐藏效率评分
    if (efficiencyRating) efficiencyRating.style.display = 'none';

    // 继续计时
    timerInterval = setInterval(updateTimer, 1000);
  }

  // 重置计时器
  function resetTimer() {
    console.log("Resetting timer");
    timerRunning = false;
    timerPaused = false;
    seconds = 0;
    efficiency = 5;  // 重置效率为默认值

    // 清除计时器
    clearInterval(timerInterval);

    // 重置UI元素
    if (timerDisplay) timerDisplay.textContent = "00:00:00";
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) {
      pauseBtn.disabled = true;
      pauseBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
    }
    if (resetBtn) resetBtn.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    
    // 隐藏效率评分
    if (efficiencyRating) efficiencyRating.style.display = 'none';
    
    // 重置星星显示
    highlightStars(0);
  }

  // 更新计时器显示
  function updateTimer() {
    seconds++;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (timerDisplay) {
      timerDisplay.textContent = `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(secs)}`;
    }
  }
  
  // 设置效率评分
  function setEfficiencyRating(value) {
    console.log(`Setting efficiency rating to ${value}`);
    efficiency = value;
    highlightStars(value);
    
    // 显示通知信息
    const ratingLabels = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];
    if (value >= 1 && value <= 5) {
      showNotification('Efficiency Rating', `Set to: ${ratingLabels[value]}`, 'info');
    }
  }
  
  // 高亮星星
  function highlightStars(count) {
    if (efficiencyStars) {
      const ratingOptions = document.querySelectorAll('.rating-option');
      
      ratingOptions.forEach(option => {
        const star = option.querySelector('.efficiency-star');
        if (star) {
          const starValue = parseInt(star.getAttribute('data-value'));
          const label = option.querySelector('.rating-label');
          
          if (starValue <= count) {
            star.classList.remove('far');
            star.classList.add('fas');
            star.classList.add('text-warning');
            option.style.fontWeight = 'bold';
            if (label) label.style.color = '#495057';
          } else {
            star.classList.remove('fas');
            star.classList.remove('text-warning');
            star.classList.add('far');
            option.style.fontWeight = 'normal';
            if (label) label.style.color = '#6c757d';
          }
          
          // 为当前选中的评分添加特殊样式
          if (starValue === count) {
            option.style.transform = 'scale(1.05)';
            option.style.backgroundColor = 'rgba(255, 152, 0, 0.1)';
          } else {
            option.style.transform = 'scale(1)';
            option.style.backgroundColor = 'transparent';
          }
        }
      });
    }
  }

  // 保存学习会话
  function saveStudySession() {
    // 防止重复提交
    if (saveBtn.disabled) {
      console.log("Already saving, ignoring duplicate submit");
      return;
    }
    
    const subjectSelect = document.getElementById('subjectSelect');
    const locationInput = document.getElementById('location');
    const timerDisplay = document.getElementById('timerDisplay');

    // 表单验证
    if (!subjectSelect || !locationInput) {
      console.error("Required form elements not found");
      showNotification('Error', 'Form elements not found', 'danger');
      return;
    }

    if (!subjectSelect.value || subjectSelect.value === 'Select a subject' || subjectSelect.value === 'add') {
      showNotification('Error', 'Please select a valid subject', 'danger');
      return;
    }

    if (!locationInput.value.trim()) {
      showNotification('Error', 'Please enter a study location', 'danger');
      return;
    }

    // 检查是否有计时数据
    if (seconds <= 0) {
      showNotification('Error', 'You need to study for at least a few seconds', 'danger');
      return;
    }

    // 计算学习时长
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const duration = `${hours}h ${minutes}m`;

    console.log(`Saving session: ${subjectSelect.value} at ${locationInput.value} for ${duration} with efficiency ${efficiency}`);

    // 准备数据对象
    const data = {
      subject_id: subjectSelect.value,
      location: locationInput.value,
      duration: duration,
      efficiency: efficiency,
      notes: document.querySelector('textarea')?.value || ""
    };

    // 获取CSRF令牌
    const csrfToken = document.querySelector('input[name="csrf_token"]').value;

    // 显示加载状态
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

    // 发送AJAX请求
    fetch('/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);
      
      // 恢复按钮状态
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Session';
      
      // 显示成功通知
      showNotification('Success', 'Study session saved successfully!', 'success');
      
      // 重置计时器
      resetTimer();
      
      // 添加动画效果
      const timerContainer = document.querySelector('.timer-container');
      if (timerContainer) {
        timerContainer.classList.add('border', 'border-success');
        setTimeout(() => {
          timerContainer.classList.remove('border', 'border-success');
        }, 1500);
      }
      
      // 重新加载页面以显示新记录
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    })
    .catch(error => {
      console.error('Error:', error);
      
      // 恢复按钮状态
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Session';
      
      // 显示错误通知
      showNotification('Error', `Failed to save study session: ${error.message}`, 'danger');
    });
  }
}

// 显示通知消息
function showNotification(title, message, type = 'info') {
  // 检查是否已存在通知容器，没有则创建
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // 创建通知元素
  const toastId = `toast-${Date.now()}`;
  const toastEl = document.createElement('div');
  toastEl.className = `toast show border-0`;
  toastEl.id = toastId;
  
  // 设置背景颜色
  let bgColor = 'bg-info';
  if (type === 'success') bgColor = 'bg-success';
  if (type === 'danger') bgColor = 'bg-danger';
  if (type === 'warning') bgColor = 'bg-warning';
  
  // 设置图标
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'danger') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  // 创建通知内容
  toastEl.innerHTML = `
    <div class="toast-header ${bgColor} text-white">
      <i class="fas fa-${icon} me-2"></i>
      <strong class="me-auto">${title}</strong>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;
  
  // 添加到通知容器
  toastContainer.appendChild(toastEl);
  
  // 注册关闭事件
  const closeBtn = toastEl.querySelector('.btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toastEl.remove();
    });
  }
  
  // 自动关闭（3秒后）
  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.remove();
    }
  }, 3000);
}

// 添加通知样式
function addNotificationStyles() {
  // 添加通知的样式
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .toast-container {
      z-index: 1060;
    }
    .toast {
      min-width: 250px;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      border-radius: var(--border-radius);
      overflow: hidden;
    }
  `;
  document.head.appendChild(styleEl);
}

// 页面加载时添加通知样式
document.addEventListener('DOMContentLoaded', function() {
  addNotificationStyles();
  // 其他初始化代码...
});

/**
 * Initialize visualization page components
 */
function initVisualizePage() {
  
  // 设置默认日期范围（过去30天）
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(today.getDate() - 30);
  
  const dateFromInput = document.getElementById("dateFrom");
  const dateToInput = document.getElementById("dateTo");
  const filterApplyBtn = document.getElementById("filterApply");
  
  if (dateFromInput && dateToInput) {
    // 设置默认日期
    dateFromInput.value = oneMonthAgo.toISOString().split("T")[0];
    dateToInput.value = today.toISOString().split("T")[0];
    
    // 页面加载时自动获取初始数据
    fetchAndUpdateAnalytics(dateFromInput.value, dateToInput.value);
  }
  
  // 应用筛选按钮事件监听
  if (filterApplyBtn) {
    filterApplyBtn.addEventListener("click", function() {
      const dateFrom = dateFromInput.value;
      const dateTo = dateToInput.value;
      
      // 添加加载状态
      document.querySelectorAll(".chart-placeholder").forEach(el => {
        el.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
      });
      
      // 获取并更新数据
      fetchAndUpdateAnalytics(dateFrom, dateTo);
    });
  }
  
  // AI推荐按钮事件监听
  const aiRecommendBtn = document.getElementById("getAiRecommendations");
  if (aiRecommendBtn) {
    aiRecommendBtn.addEventListener("click", async function() {
      // 获取当前筛选条件
      const dateFrom = dateFromInput.value;
      const dateTo = dateToInput.value;
      
      if (!dateFrom || !dateTo) {
        showNotification('Error', 'Please select a date range and apply filters first to load your study data.', 'danger');
        return;
      }
      
      try {
        // 显示加载指示器
        document.getElementById("aiRecommendationsContent").classList.add("d-none");
        document.getElementById("aiLoadingIndicator").classList.remove("d-none");
        
        // 获取数据并生成AI推荐
        const sessions = await fetchFilteredData(dateFrom, dateTo);
        if (!sessions || sessions.length === 0) {
          document.getElementById("aiLoadingIndicator").classList.add("d-none");
          document.getElementById("aiRecommendationsContent").classList.remove("d-none");
          document.getElementById("aiRecommendationsContent").innerHTML = `
            <div class="text-center py-4">
              <i class="fas fa-info-circle fa-3x text-warning mb-3"></i>
              <p class="text-muted">No study data available for analysis.</p>
              <small class="text-muted">Please select a date range with recorded study sessions.</small>
            </div>
          `;
          return;
        }
        
        // 获取AI推荐结果
        const result = await getAIRecommendations(sessions);
        
        // 隐藏加载指示器
        document.getElementById("aiLoadingIndicator").classList.add("d-none");
        document.getElementById("aiRecommendationsContent").classList.remove("d-none");
        
        // 显示推荐结果
        if (result.success === false) {
          document.getElementById("aiRecommendationsContent").innerHTML = `
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-circle me-2"></i>
              ${result.message || "Couldn't generate recommendations at this time."}
            </div>
          `;
        } else {
          // 使用打字效果显示推荐内容
          displayAIRecommendations(result.recommendations);
        }
      } catch (error) {
        console.error('Error generating AI recommendations:', error);
        document.getElementById("aiLoadingIndicator").classList.add("d-none");
        document.getElementById("aiRecommendationsContent").classList.remove("d-none");
        document.getElementById("aiRecommendationsContent").innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Failed to load AI recommendations: ${error.message || "Unknown error"}
          </div>
        `;
      }
    });
  }
  
  // 数据导出功能
  const exportDataBtn = document.querySelector('.btn-outline-primary');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', function() {
      exportStudyData();
    });
  }
}

// 获取CSRF令牌
function getCSRFToken() {
  const tokenElement = document.querySelector('input[name="csrf_token"]');
  return tokenElement ? tokenElement.value : '';
}

// 获取数据并更新所有图表
function fetchAndUpdateAnalytics(dateFrom, dateTo) {
  console.log('fetchAndUpdateAnalytics called', dateFrom, dateTo);
  
  // 显示加载状态
  document.querySelectorAll(".chart-placeholder").forEach(el => {
    el.innerHTML = `
      <div class="d-flex justify-content-center align-items-center h-100">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted">Loading data...</p>
        </div>
      </div>
    `;
  });
  
  fetch('/api/analytics-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken()
    },
    body: JSON.stringify({ dateFrom, dateTo })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('API response data:', data);
    
    // 用更直接的方式重新插入图表canvas元素
    // 首先获取所有图表容器
    let chartContainers = document.querySelectorAll('.chart-placeholder');
    console.log('Found chart placeholders:', chartContainers.length);
    
    // 重置每个容器
    chartContainers.forEach(container => {
      console.log('Resetting container:', container);
      container.innerHTML = '';
    });
    
    // 为每个特定的容器重新创建canvas - 使用ID更精确的选择器
    // 首先为每个图表容器添加ID以便更可靠地选择
    document.querySelectorAll('.card-header').forEach(header => {
      const headerText = header.textContent.trim();
      const cardBody = header.nextElementSibling;
      
      if (cardBody && cardBody.classList.contains('card-body')) {
        const chartPlaceholder = cardBody.querySelector('.chart-placeholder');
        
        if (chartPlaceholder) {
          if (headerText.includes('Study Time Over Selected Range')) {
            chartPlaceholder.id = 'studyBarChartContainer';
          } else if (headerText.includes('Subject Distribution')) {
            chartPlaceholder.id = 'subjectPieChartContainer';
          } else if (headerText.includes('Average Efficiency by Time of Day')) {
            chartPlaceholder.id = 'efficiencyTimeChartContainer';
          }
        }
      }
    });
    
    // 现在使用ID选择器找到容器
    const studyBarContainer = document.getElementById('studyBarChartContainer');
    if (studyBarContainer) {
      console.log('Found study bar container by ID');
      studyBarContainer.innerHTML = '<canvas id="studyBarChart" height="280" style="max-width: 100%; max-height: 100%;"></canvas>';
    } else {
      console.error('Could not find study bar container by ID');
    }
    
    const subjectPieContainer = document.getElementById('subjectPieChartContainer');
    if (subjectPieContainer) {
      console.log('Found subject pie container by ID');
      subjectPieContainer.innerHTML = '<canvas id="subjectPieChart" height="280" style="max-width: 100%; max-height: 100%;"></canvas>';
    } else {
      console.error('Could not find subject pie container by ID');
    }
    
    const efficiencyTimeContainer = document.getElementById('efficiencyTimeChartContainer');
    if (efficiencyTimeContainer) {
      console.log('Found efficiency time container by ID');
      efficiencyTimeContainer.innerHTML = '<canvas id="efficiencyTimeChart" height="280" style="max-width: 100%; max-height: 100%;"></canvas>';
    } else {
      console.error('Could not find efficiency time container by ID');
    }
    
    // 特殊处理Location Efficiency图表，它的容器结构不同
    // 直接从HTML看，这个div有明确的样式属性
    const locationContainer = document.querySelector('.col-lg-4 .card-body div[style*="height: 250px"]');
    if (locationContainer) {
      console.log('Found location container with correct style:', locationContainer);
      locationContainer.innerHTML = '<canvas id="locationEfficiencyChart" style="max-height: 100%; max-width: 100%;"></canvas>';
    } else {
      // 备用方法
      console.warn('Location container with style not found, trying alternative selector');
      const altLocationContainer = document.querySelector('.col-lg-4 .card-body div');
      if (altLocationContainer) {
        console.log('Found location container with alt selector:', altLocationContainer);
        altLocationContainer.innerHTML = '<canvas id="locationEfficiencyChart" style="max-height: 100%; max-width: 100%;"></canvas>';
      } else {
        console.error('Location container not found with any selector!');
      }
    }
    
    // 更新统计数据
    updateStatsCards(data.summary);
    
    // 更新各个图表
    if (data.sessions && data.sessions.length > 0) {
      console.log('Calling chart update functions');
      try {
        // 逐个尝试更新图表，捕获个别错误不影响其他图表
        try {
          console.log('Updating study bar chart...');
          updateStudyBarChart(data.sessions, data.summary.day_distribution);
        } catch(e) {
          console.error('Error updating study bar chart:', e);
        }
        
        try {
          console.log('Updating subject pie chart...');
          updateSubjectPieChart(data.summary.subject_distribution);
        } catch(e) {
          console.error('Error updating subject pie chart:', e);
        }
        
        try {
          console.log('Updating efficiency time chart...');
          if (document.getElementById('efficiencyTimeChart')) {
            updateEfficiencyTimeChart(data.sessions);
          } else {
            console.error('Efficiency time chart element not found');
          }
        } catch(e) {
          console.error('Error updating efficiency time chart:', e);
        }
        
        try {
          console.log('Updating location efficiency chart...');
          if (document.getElementById('locationEfficiencyChart')) {
            updateLocationEfficiencyChart(data.sessions);
          } else {
            console.error('Location efficiency chart element not found');
          }
        } catch(e) {
          console.error('Error updating location efficiency chart:', e);
        }
        
        try {
          console.log('Updating time-location heatmap...');
          updateTimeLocationHeatmap(data.sessions);
        } catch(e) {
          console.error('Error updating time-location heatmap:', e);
        }
        
        // 显示数据表格
        updateDataTable(data.sessions);
      } catch (error) {
        console.error('Error updating charts:', error);
      }
    } else {
      // 无数据情况
      console.log('No data to display');
      showNoDataMessage();
    }
  })
  .catch(error => {
    showErrorMessage();
  });
}

// 更新统计卡片
function updateStatsCards(summary) {
  document.getElementById("totalStudyTime").textContent = summary.total_time || "--";
  document.getElementById("studyVariance").textContent = summary.study_variance || "--";
  document.getElementById("avgEfficiency").textContent = summary.avg_efficiency ? `${summary.avg_efficiency}/5` : "--";
  
  // 找出最多学习时间的一天
  if (summary.day_distribution) {
    const entries = Object.entries(summary.day_distribution);
    if (entries.length > 0) {
      const mostActive = entries.reduce((max, current) => 
        current[1] > max[1] ? current : max, entries[0]
      );
      const date = new Date(mostActive[0]);
      document.getElementById("mostActiveDay").textContent = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  }
}

/**
 * Initialize share page components
 */
function initSharePage() {

  // Modal functionality is handled by Bootstrap
  // In the future, this would handle report creation and sharing
}

// =================================================================
// 图表相关函数
// =================================================================

// 处理日期格式化
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

// 无数据时的提示
function showNoDataMessage() {
  document.querySelectorAll(".chart-placeholder").forEach(el => {
    el.innerHTML = `
      <div class="d-flex flex-column justify-content-center align-items-center h-100 py-5">
        <i class="fas fa-chart-bar fa-4x text-muted mb-3"></i>
        <p class="text-muted">No study data available for the selected date range.</p>
        <small class="text-muted">Try selecting a different date range or record some study sessions.</small>
      </div>
    `;
  });
}

// 错误消息显示
function showErrorMessage() {
  document.querySelectorAll(".chart-placeholder").forEach(el => {
    el.innerHTML = `
      <div class="d-flex flex-column justify-content-center align-items-center h-100 py-5">
        <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
        <p class="text-muted">Failed to load analytics data.</p>
        <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.location.reload()">
          <i class="fas fa-redo me-1"></i>Retry
        </button>
      </div>
    `;
  });
}

// 更新学习时间条形图
function updateStudyBarChart(sessions, dayDistribution) {
  console.log('updateStudyBarChart called');
  console.log('Sessions:', sessions);
  console.log('Day Distribution:', dayDistribution);
  
  const chartElement = document.getElementById('studyBarChart');
  if (!chartElement) {
    console.error('studyBarChart element not found');
    return;
  }
  
  // 获取Canvas上下文前检查是否已经有图表实例
  if (window.studyBarChartInstance) {
    window.studyBarChartInstance.destroy();
  }
  
  const ctx = chartElement.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context');
    return;
  }
  
  // 如果没有日期分布数据，则使用会话数据生成
  if (!dayDistribution) {
    dayDistribution = {};
    sessions.forEach(session => {
      if (dayDistribution[session.date]) {
        dayDistribution[session.date] += session.minutes;
      } else {
        dayDistribution[session.date] = session.minutes;
      }
    });
  }
  
  // 按日期排序
  const sortedDays = Object.entries(dayDistribution).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  
  // 提取标签和数据
  const labels = sortedDays.map(day => formatDate(day[0]));
  const minutesData = sortedDays.map(day => day[1]);
  
  // 转换为小时
  const hoursData = minutesData.map(minutes => Math.round(minutes / 60 * 10) / 10);
  
  // 计算移动平均线
  const movingAvgHours = calculateMovingAverage(hoursData, 3);
  
  // 创建图表
  window.studyBarChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Hours Studied',
          data: hoursData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: '3-Day Moving Average',
          data: movingAvgHours,
          type: 'line',
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          fill: false,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hours'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `${context.dataset.label}: ${value} hours`;
            }
          }
        }
      }
    }
  });
}

// 计算移动平均
function calculateMovingAverage(data, window) {
  const result = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      // 前几个点不足窗口长度，取当前数据点
      result.push(data[i]);
    } else {
      // 计算移动平均
      let sum = 0;
      for (let j = 0; j < window; j++) {
        sum += data[i - j];
      }
      result.push(Math.round((sum / window) * 10) / 10);
    }
  }
  
  return result;
}

// 更新主题分布饼图
function updateSubjectPieChart(subjectDistribution) {
  console.log('updateSubjectPieChart called with data:', subjectDistribution);
  
  const chartElement = document.getElementById('subjectPieChart');
  if (!chartElement) {
    console.error('subjectPieChart element not found');
    return;
  }
  
  // 获取Canvas上下文前检查是否已经有图表实例
  if (window.subjectPieChartInstance) {
    window.subjectPieChartInstance.destroy();
  }
  
  const ctx = chartElement.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context for subject pie chart');
    return;
  }
  
  // 确保数据是有效的
  if (!subjectDistribution || Object.keys(subjectDistribution).length === 0) {
    console.error('No subject distribution data available');
    return;
  }
  
  // 处理数据用于图表
  const subjects = [];
  const minutesData = [];
  
  try {
    // 按学习时间排序（从高到低）
    const sortedSubjects = Object.entries(subjectDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8); // 最多显示8个学科
    
    sortedSubjects.forEach(([subject, minutes]) => {
      subjects.push(subject);
      minutesData.push(minutes);
    });
    
    // 转换为小时
    const hoursData = minutesData.map(minutes => Math.round(minutes / 60 * 10) / 10);
    
    // 生成随机颜色
    const colors = subjects.map(() => getRandomColor());
    
    console.log('Pie chart data prepared:', {
      subjects,
      hoursData,
      colors
    });
    
    // 创建图表
    window.subjectPieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: subjects,
        datasets: [{
          data: hoursData,
          backgroundColor: colors,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${context.label}: ${value} hours (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  } catch (e) {
    console.error('Error creating subject pie chart:', e);
  }
}

// 更新效率时间图
function updateEfficiencyTimeChart(sessions) {
  console.log('updateEfficiencyTimeChart called with sessions:', sessions.length);
  
  const chartElement = document.getElementById('efficiencyTimeChart');
  if (!chartElement) {
    console.error('efficiencyTimeChart element not found');
    return;
  }
  
  // 获取Canvas上下文前检查是否已经有图表实例
  if (window.efficiencyTimeChartInstance) {
    window.efficiencyTimeChartInstance.destroy();
  }
  
  const ctx = chartElement.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context for efficiency time chart');
    return;
  }
  
  // 按小时聚合效率数据
  const hourData = {};
  
  // 初始化24小时数据
  for (let i = 0; i < 24; i++) {
    hourData[i] = {
      totalEfficiency: 0,
      count: 0,
      average: 0
    };
  }
  
  // 处理数据
  try {
    sessions.forEach(session => {
      const startTimeStr = session.start_time;
      // 确保时间格式正确，例如 "14:30" 或 "14:30:00"
      let hour;
      if (startTimeStr.includes(':')) {
        hour = parseInt(startTimeStr.split(':')[0], 10);
      } else {
        console.warn('Invalid time format:', startTimeStr);
        return; // 跳过这个session
      }
      
      if (isNaN(hour) || hour < 0 || hour > 23) {
        console.warn('Hour out of range:', hour, 'from time:', startTimeStr);
        return; // 跳过这个session
      }
      
      hourData[hour].totalEfficiency += session.efficiency;
      hourData[hour].count += 1;
    });
  } catch (e) {
    console.error('Error processing session data for efficiency chart:', e);
  }
  
  // 计算平均值
  for (let hour in hourData) {
    if (hourData[hour].count > 0) {
      hourData[hour].average = Math.round((hourData[hour].totalEfficiency / hourData[hour].count) * 10) / 10;
    }
  }
  
  // 提取数据
  const labels = Array.from({length: 24}, (_, i) => `${i}:00`);
  const averageData = Array.from({length: 24}, (_, i) => hourData[i].average);
  const countData = Array.from({length: 24}, (_, i) => hourData[i].count);
  
  console.log('Efficiency time chart data:', {
    averageData,
    countData
  });
  
  // 创建图表
  window.efficiencyTimeChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Average Efficiency',
          data: averageData,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Session Count',
          data: countData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          type: 'bar',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 5,
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Efficiency Rating (1-5)'
          }
        },
        y1: {
          min: 0,
          type: 'linear',
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          title: {
            display: true,
            text: 'Number of Sessions'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const datasetLabel = context.dataset.label;
              const value = context.raw;
              if (datasetLabel === 'Average Efficiency') {
                return `Average Efficiency: ${value}/5`;
              } else {
                return `Sessions: ${value}`;
              }
            }
          }
        }
      }
    }
  });
}

// 更新位置效率图
function updateLocationEfficiencyChart(sessions) {
  console.log('updateLocationEfficiencyChart called with sessions:', sessions.length);
  
  const chartElement = document.getElementById('locationEfficiencyChart');
  if (!chartElement) {
    console.error('locationEfficiencyChart element not found');
    return;
  }
  
  // 获取Canvas上下文前检查是否已经有图表实例
  if (window.locationEfficiencyChartInstance) {
    window.locationEfficiencyChartInstance.destroy();
  }
  
  const ctx = chartElement.getContext('2d');
  if (!ctx) {
    console.error('Failed to get canvas context for location chart');
    return;
  }
  
  // 按位置聚合效率数据
  const locationData = {};
  
  // 处理数据
  sessions.forEach(session => {
    if (locationData[session.location]) {
      locationData[session.location].totalEfficiency += session.efficiency;
      locationData[session.location].count += 1;
    } else {
      locationData[session.location] = {
        totalEfficiency: session.efficiency,
        count: 1
      };
    }
  });
  
  // 计算平均值并排序
  const locations = [];
  const avgEfficiency = [];
  const sessionCounts = [];
  const bgColors = [];
  
  Object.entries(locationData)
    .sort((a, b) => (b[1].totalEfficiency / b[1].count) - (a[1].totalEfficiency / a[1].count))
    .slice(0, 6)  // 只取前6个地点
    .forEach(([location, data]) => {
      locations.push(location);
      avgEfficiency.push(Math.round((data.totalEfficiency / data.count) * 10) / 10);
      sessionCounts.push(data.count);
      bgColors.push(getRandomColor());
    });
  
  console.log('Location chart data:', {
    locations,
    avgEfficiency,
    sessionCounts
  });
  
  // 创建图表
  window.locationEfficiencyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: locations,
      datasets: [
        {
          axis: 'y',
          label: 'Average Efficiency',
          data: avgEfficiency,
          backgroundColor: bgColors,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 5,
          title: {
            display: true,
            text: 'Efficiency (1-5)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const count = sessionCounts[context.dataIndex];
              return [
                `Efficiency: ${value}/5`,
                `Sessions: ${count}`
              ];
            }
          }
        }
      }
    }
  });
}

// 更新时间×地点效率三维散点图
function updateTimeLocationHeatmap(sessions) {
  const container = document.getElementById('timeLocationHeatmap');
  
  // 如果没有数据或sessions少于5个，不显示图表
  if (!sessions || sessions.length < 5) {
    container.innerHTML = `
      <div class="d-flex flex-column justify-content-center align-items-center h-100 py-5">
        <i class="fas fa-chart-area fa-3x text-muted mb-3"></i>
        <p class="text-muted">Not enough data to generate 3D chart</p>
        <small class="text-muted">At least 5 study sessions needed</small>
      </div>
    `;
    return;
  }
  
  // 定义时间段和它们的分钟范围
  const timeSlots = {
    "Late Night": [0, 360],     // 00:00 - 06:00
    "Early Morning": [360, 600], // 06:00 - 10:00
    "Morning": [600, 720],       // 10:00 - 12:00
    "Afternoon": [720, 960],     // 12:00 - 16:00
    "Evening": [960, 1140],      // 16:00 - 19:00
    "Night": [1140, 1380]        // 19:00 - 23:00
  };

  // 提取所有时间段和唯一的地点名称
  const xLabels = Object.keys(timeSlots);
  const yLabels = [...new Set(sessions.map(s => s.location))].slice(0, 8); // 限制最多8个地点，避免过度复杂

  // 初始化数据数组
  const x = [], y = [], z = [], colors = [], sizes = [], texts = [];
  const efficiencyCounts = {}; // 用于跟踪每个时间段和地点组合的会话数

  // 处理每个学习会话
  sessions.forEach(s => {
    try {
      // 确保地点在我们的列表中
      if (!yLabels.includes(s.location)) return;
      
      // 将"HH:MM"时间格式转换为分钟
      const startTimeStr = s.start_time;
      const timeComponents = startTimeStr.split(":").map(Number);
      
      if (timeComponents.length < 2 || isNaN(timeComponents[0]) || isNaN(timeComponents[1])) {
        console.warn('Invalid time format:', startTimeStr);
        return;
      }
      
      const [hour, minute] = timeComponents;
      const totalMinutes = hour * 60 + minute;

      // 确定时间段
      let slot = xLabels.find(label => {
        const [min, max] = timeSlots[label];
        return totalMinutes >= min && totalMinutes < max;
      });

      if (!slot) return;

      // 获取时间段和地点的索引
      const xIdx = xLabels.indexOf(slot);
      const yIdx = yLabels.indexOf(s.location);
      const efficiency = s.efficiency;
      
      // 创建唯一的键以识别这个组合
      const key = `${xIdx}-${yIdx}`;
      
      if (!efficiencyCounts[key]) {
        efficiencyCounts[key] = {
          totalEfficiency: efficiency,
          count: 1,
          sessions: [s]
        };
      } else {
        efficiencyCounts[key].totalEfficiency += efficiency;
        efficiencyCounts[key].count += 1;
        efficiencyCounts[key].sessions.push(s);
      }
    } catch (e) {
      console.error('Error processing session for 3D chart:', e, s);
    }
  });
  
  // 处理聚合数据
  for (const key in efficiencyCounts) {
    const [xIdx, yIdx] = key.split('-').map(Number);
    const data = efficiencyCounts[key];
    const avgEfficiency = Math.round((data.totalEfficiency / data.count) * 10) / 10;
    
    // 为这个组合添加一个数据点
    x.push(xIdx);
    y.push(yIdx);
    z.push(avgEfficiency);
    
    // 气泡大小基于会话数量
    const sessionCount = data.count;
    const size = Math.max(8, Math.min(20, 8 + sessionCount * 2)); // 8-20 范围内
    sizes.push(size);
    
    // 颜色基于效率值
    colors.push(avgEfficiency);
    
    // 详细信息文本
    const sessionDates = [...new Set(data.sessions.map(s => s.date))].length;
    texts.push(`${xLabels[xIdx]} @ ${yLabels[yIdx]}<br>` +
               `Avg. Efficiency: ${avgEfficiency}/5<br>` +
               `Sessions: ${sessionCount}<br>` + 
               `Unique Days: ${sessionDates}`);
  }

  // 检查是否有足够的数据点
  if (x.length < 3) {
    container.innerHTML = `
      <div class="d-flex flex-column justify-content-center align-items-center h-100 py-5">
        <i class="fas fa-chart-area fa-3x text-muted mb-3"></i>
        <p class="text-muted">Not enough valid data points for 3D visualization</p>
        <small class="text-muted">Try more varied study times and locations</small>
      </div>
    `;
    return;
  }

  // 配置散点图
  const trace = {
    x: x,
    y: y,
    z: z,
    type: 'scatter3d',
    mode: 'markers',
    marker: {
      size: sizes,
      color: colors,
      colorscale: 'RdYlGn', // 红黄绿色阶，红色表示低效率，绿色表示高效率
      cmin: 1,
      cmax: 5,
      colorbar: {
        title: 'Efficiency',
        tickvals: [1, 2, 3, 4, 5],
        ticktext: ['1 - Poor', '2', '3', '4', '5 - Excellent']
      },
      opacity: 0.8,
      line: {
        width: 0.5,
        color: 'rgba(0,0,0,0.2)'
      }
    },
    text: texts,
    hoverinfo: 'text'
  };

  // 配置图表布局
  const layout = {
    title: 'Study Efficiency in 3D Space',
    autosize: true,
    height: 380,
    margin: { t: 30, l: 0, r: 0, b: 0, pad: 0 },
    scene: {
      xaxis: {
        title: 'Time Slot',
        tickvals: xLabels.map((_, i) => i),
        ticktext: xLabels,
        gridcolor: 'rgba(0,0,0,0.1)'
      },
      yaxis: {
        title: 'Location',
        tickvals: yLabels.map((_, i) => i),
        ticktext: yLabels,
        gridcolor: 'rgba(0,0,0,0.1)'
      },
      zaxis: {
        title: 'Efficiency',
        range: [0, 5],
        gridcolor: 'rgba(0,0,0,0.1)'
      },
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.2 },
        center: { x: 0, y: 0, z: 0 }
      },
      aspectratio: { x: 1, y: 1, z: 0.95 }
    },
    hoverlabel: {
      bgcolor: 'white',
      font: { size: 12 }
    }
  };
  
  const config = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'study_efficiency_3d',
      height: 600,
      width: 900,
      scale: 2
    }
  };

  // 渲染图表
  Plotly.newPlot("timeLocationHeatmap", [trace], layout, config);
  
  // 添加提示消息
  setTimeout(() => {
    const controlsDiv = document.querySelector('.chart-controls');
    if (controlsDiv) {
      controlsDiv.innerHTML = `
        <small class="text-muted d-block mb-1">Tip: Click and drag to rotate view</small>
        <small class="text-muted d-block">Hover over bubbles for details</small>
      `;
    }
  }, 1500);
}

// 更新AI推荐内容
function updateAIRecommendations(recommendations) {
  const container = document.getElementById('aiRecommendationsContent');
  
  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-3x text-secondary mb-3"></i>
        <p class="text-muted">Not enough data to generate recommendations.</p>
        <small class="text-muted">Study more and check back later!</small>
      </div>
    `;
    return;
  }
  
  // 构建推荐卡片
  let html = `<div class="row g-3">`;
  
  recommendations.forEach(rec => {
    html += `
      <div class="col-12">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <div class="d-flex">
              <div class="flex-shrink-0">
                <i class="fas ${rec.icon} fa-2x text-primary"></i>
              </div>
              <div class="flex-grow-1 ms-3">
                <h6 class="fw-bold mb-1">${rec.title}</h6>
                <p class="mb-0">${rec.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

// 更新数据表格
function updateDataTable(sessions) {
  const dataTableContainer = document.querySelector('.data-table-container');
  if (!dataTableContainer) return;
  
  // 按日期逆序排序
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 生成表格HTML
  let tableHtml = `
    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Date</th>
            <th>Subject</th>
            <th>Time</th>
            <th>Duration</th>
            <th>Location</th>
            <th>Efficiency</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  sortedSessions.forEach(session => {
    // 星级HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= session.efficiency) {
        starsHtml += '<i class="fas fa-star text-warning"></i>';
      } else {
        starsHtml += '<i class="far fa-star text-warning"></i>';
      }
    }
    
    tableHtml += `
      <tr>
        <td>${formatDate(session.date)}</td>
        <td>${session.subject}</td>
        <td>${session.start_time} - ${session.end_time}</td>
        <td>${session.duration}</td>
        <td>${session.location}</td>
        <td>${starsHtml}</td>
      </tr>
    `;
  });
  
  tableHtml += `
        </tbody>
      </table>
    </div>
  `;
  
  dataTableContainer.innerHTML = tableHtml;
}

// 导出学习数据
function exportStudyData() {
  const dateFrom = document.getElementById("dateFrom").value;
  const dateTo = document.getElementById("dateTo").value;
  
  fetch('/api/analytics-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken()
    },
    body: JSON.stringify({ dateFrom, dateTo })
  })
  .then(response => response.json())
  .then(data => {
    if (!data.sessions || data.sessions.length === 0) {
      showNotification('Export Failed', 'No data available to export', 'warning');
      return;
    }
    
    // 准备CSV数据
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Subject,Start Time,End Time,Duration,Location,Efficiency,Notes\n";
    
    data.sessions.forEach(session => {
      csvContent += `${session.date},${session.subject},${session.start_time},${session.end_time},${session.duration},"${session.location}",${session.efficiency},"${session.notes || ''}"\n`;
    });
    
    // 创建下载链接
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `study_data_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    
    // 触发下载
    link.click();
    
    // 清理DOM
    document.body.removeChild(link);
    
    showNotification('Export Success', 'Your study data has been exported to CSV', 'success');
  })
  .catch(error => {
    console.error('Error exporting data:', error);
    showNotification('Export Failed', 'Could not export data. Please try again.', 'danger');
  });
}

// 获取随机颜色
function getRandomColor() {
  const colors = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 167, 69, 0.7)',
    'rgba(220, 53, 69, 0.7)'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}
