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
  let efficiency = 5; // 默认效率为5（最高）
  let timerRunning = false;
  let timerPaused = false;

  // 获取DOM元素
  const startBtn = document.getElementById("startTimer");
  const pauseBtn = document.getElementById("pauseTimer");
  const resetBtn = document.getElementById("resetTimer");
  const saveBtn = document.getElementById("saveSession");
  const timerDisplay = document.getElementById("timerDisplay");
  const efficiencyRating = document.getElementById("efficiencyRating");
  const efficiencyStars = document.querySelectorAll(".efficiency-star");

  if (startBtn && pauseBtn && resetBtn && saveBtn) {
    console.log("Timer controls found, adding event listeners");

    // 开始计时按钮
    startBtn.addEventListener("click", function () {
      if (!timerRunning) {
        startTimer();
      }
    });

    // 暂停按钮
    pauseBtn.addEventListener("click", function () {
      if (timerRunning) {
        pauseTimer();
      } else if (timerPaused) {
        resumeTimer();
      }
    });

    // 重置按钮
    resetBtn.addEventListener("click", function () {
      resetTimer();
    });

    // 保存会话按钮
    saveBtn.addEventListener("click", function () {
      saveStudySession();
    });

    // 添加效率星级评分事件监听
    if (efficiencyStars) {
      const ratingOptions = document.querySelectorAll(".rating-option");

      // 为每个评分选项添加事件监听
      if (ratingOptions.length > 0) {
        ratingOptions.forEach((option) => {
          const star = option.querySelector(".efficiency-star");
          if (star) {
            const value = parseInt(star.getAttribute("data-value"));

            option.addEventListener("click", function () {
              setEfficiencyRating(value);
            });

            option.addEventListener("mouseover", function () {
              highlightStars(value);
            });

            option.addEventListener("mouseout", function () {
              highlightStars(efficiency);
            });
          }
        });
      } else {
        // 如果没有找到评分选项容器，则使用星星元素
        efficiencyStars.forEach((star) => {
          star.addEventListener("click", function () {
            const value = parseInt(this.getAttribute("data-value"));
            setEfficiencyRating(value);
          });

          star.addEventListener("mouseover", function () {
            const value = parseInt(this.getAttribute("data-value"));
            highlightStars(value);
          });

          star.addEventListener("mouseout", function () {
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
    return String(num).padStart(2, "0");
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
    if (efficiencyRating) efficiencyRating.style.display = "none";

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
    if (efficiencyRating) efficiencyRating.style.display = "block";

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
    if (efficiencyRating) efficiencyRating.style.display = "none";

    // 继续计时
    timerInterval = setInterval(updateTimer, 1000);
  }

  // 重置计时器
  function resetTimer() {
    console.log("Resetting timer");
    timerRunning = false;
    timerPaused = false;
    seconds = 0;
    efficiency = 5; // 重置效率为默认值

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
    if (efficiencyRating) efficiencyRating.style.display = "none";

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
      timerDisplay.textContent = `${padNumber(hours)}:${padNumber(
        minutes
      )}:${padNumber(secs)}`;
    }
  }

  // 设置效率评分
  function setEfficiencyRating(value) {
    console.log(`Setting efficiency rating to ${value}`);
    efficiency = value;
    highlightStars(value);

    // 显示通知信息
    const ratingLabels = [
      "",
      "Poor",
      "Below Average",
      "Average",
      "Good",
      "Excellent",
    ];
    if (value >= 1 && value <= 5) {
      showNotification(
        "Efficiency Rating",
        `Set to: ${ratingLabels[value]}`,
        "info"
      );
    }
  }

  // 高亮星星
  function highlightStars(count) {
    if (efficiencyStars) {
      const ratingOptions = document.querySelectorAll(".rating-option");

      ratingOptions.forEach((option) => {
        const star = option.querySelector(".efficiency-star");
        if (star) {
          const starValue = parseInt(star.getAttribute("data-value"));
          const label = option.querySelector(".rating-label");

          if (starValue <= count) {
            star.classList.remove("far");
            star.classList.add("fas");
            star.classList.add("text-warning");
            option.style.fontWeight = "bold";
            if (label) label.style.color = "#495057";
          } else {
            star.classList.remove("fas");
            star.classList.remove("text-warning");
            star.classList.add("far");
            option.style.fontWeight = "normal";
            if (label) label.style.color = "#6c757d";
          }

          // 为当前选中的评分添加特殊样式
          if (starValue === count) {
            option.style.transform = "scale(1.05)";
            option.style.backgroundColor = "rgba(255, 152, 0, 0.1)";
          } else {
            option.style.transform = "scale(1)";
            option.style.backgroundColor = "transparent";
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

    const subjectSelect = document.getElementById("subjectSelect");
    const locationInput = document.getElementById("location");
    const timerDisplay = document.getElementById("timerDisplay");

    // 表单验证
    if (!subjectSelect || !locationInput) {
      console.error("Required form elements not found");
      showNotification("Error", "Form elements not found", "danger");
      return;
    }

    if (
      !subjectSelect.value ||
      subjectSelect.value === "Select a subject" ||
      subjectSelect.value === "add"
    ) {
      showNotification("Error", "Please select a valid subject", "danger");
      return;
    }

    if (!locationInput.value.trim()) {
      showNotification("Error", "Please enter a study location", "danger");
      return;
    }

    // 检查是否有计时数据
    if (seconds <= 0) {
      showNotification(
        "Error",
        "You need to study for at least a few seconds",
        "danger"
      );
      return;
    }

    // 计算学习时长
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const duration = `${hours}h ${minutes}m`;

    console.log(
      `Saving session: ${subjectSelect.value} at ${locationInput.value} for ${duration} with efficiency ${efficiency}`
    );

    // 准备数据对象
    const data = {
      subject_id: subjectSelect.value,
      location: locationInput.value,
      duration: duration,
      efficiency: efficiency,
      notes: document.querySelector("textarea")?.value || "",
    };

    // 获取CSRF令牌
    const csrfToken = document.querySelector('input[name="csrf_token"]').value;

    // 显示加载状态
    saveBtn.disabled = true;
    saveBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

    // 发送AJAX请求
    fetch("/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrfToken,
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Server responded with ${response.status}: ${response.statusText}`
          );
        }
        return response.json();
      })
      .then((data) => {
        console.log("Success:", data);

        // 恢复按钮状态
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Session';

        // 显示成功通知
        showNotification(
          "Success",
          "Study session saved successfully!",
          "success"
        );

        // 重置计时器
        resetTimer();

        // 添加动画效果
        const timerContainer = document.querySelector(".timer-container");
        if (timerContainer) {
          timerContainer.classList.add("border", "border-success");
          setTimeout(() => {
            timerContainer.classList.remove("border", "border-success");
          }, 1500);
        }

        // 重新加载页面以显示新记录
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      })
      .catch((error) => {
        console.error("Error:", error);

        // 恢复按钮状态
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Session';

        // 显示错误通知
        showNotification(
          "Error",
          `Failed to save study session: ${error.message}`,
          "danger"
        );
      });
  }
}

// 显示通知消息
function showNotification(title, message, type = "info") {
  // 检查是否已存在通知容器，没有则创建
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    document.body.appendChild(toastContainer);
  }

  // 创建通知元素
  const toastId = `toast-${Date.now()}`;
  const toastEl = document.createElement("div");
  toastEl.className = `toast show border-0`;
  toastEl.id = toastId;

  // 设置背景颜色
  let bgColor = "bg-info";
  if (type === "success") bgColor = "bg-success";
  if (type === "danger") bgColor = "bg-danger";
  if (type === "warning") bgColor = "bg-warning";

  // 设置图标
  let icon = "info-circle";
  if (type === "success") icon = "check-circle";
  if (type === "danger") icon = "exclamation-circle";
  if (type === "warning") icon = "exclamation-triangle";

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
  const closeBtn = toastEl.querySelector(".btn-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
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
  const styleEl = document.createElement("style");
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
document.addEventListener("DOMContentLoaded", function () {
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
    filterApplyBtn.addEventListener("click", function () {
      const dateFrom = dateFromInput.value;
      const dateTo = dateToInput.value;

      // 添加加载状态
      /*
      document.querySelectorAll(".chart-placeholder").forEach(el => {
        el.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
      }); */

      // 获取并更新数据
      fetchAndUpdateAnalytics(dateFrom, dateTo);
    });
  }

  // AI推荐按钮事件监听
  const aiRecommendBtn = document.getElementById("getAiRecommendations");
  if (aiRecommendBtn) {
    // 先移除所有现有的点击事件处理程序，防止重复绑定
    aiRecommendBtn.replaceWith(aiRecommendBtn.cloneNode(true));

    // 重新获取按钮（因为cloneNode会删除所有事件监听器）
    const newAiRecommendBtn = document.getElementById("getAiRecommendations");

    // 添加新的事件处理程序
    newAiRecommendBtn.addEventListener("click", async function () {
      // 获取当前筛选条件
      const dateFrom = dateFromInput.value;
      const dateTo = dateToInput.value;

      if (!dateFrom || !dateTo) {
        showNotification(
          "Error",
          "Please select a date range and apply filters first to load your study data.",
          "danger"
        );
        return;
      }

      try {
        // 显示加载指示器
        document
          .getElementById("aiRecommendationsContent")
          .classList.add("d-none");
        document
          .getElementById("aiLoadingIndicator")
          .classList.remove("d-none");

        // 获取数据并生成AI推荐
        const sessions = window.filteredSessionsForAI || [];
        if (!sessions || sessions.length === 0) {
          document.getElementById("aiLoadingIndicator").classList.add("d-none");
          document
            .getElementById("aiRecommendationsContent")
            .classList.remove("d-none");
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
        document
          .getElementById("aiRecommendationsContent")
          .classList.remove("d-none");

        // 显示推荐结果
        if (result.success === false) {
          document.getElementById("aiRecommendationsContent").innerHTML = `
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-circle me-2"></i>
              ${
                result.message ||
                "Couldn't generate recommendations at this time."
              }
            </div>
          `;
        } else {
          // 使用打字效果显示推荐内容
          displayAIRecommendations(result.recommendations);
        }
      } catch (error) {
        console.error("Error generating AI recommendations:", error);
        document.getElementById("aiLoadingIndicator").classList.add("d-none");
        document
          .getElementById("aiRecommendationsContent")
          .classList.remove("d-none");
        document.getElementById("aiRecommendationsContent").innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-triangle me-2"></i>
            Failed to load AI recommendations: ${
              error.message || "Unknown error"
            }
          </div>
        `;
      }
    });
  }

  // 数据导出功能
  const exportDataBtn = document.querySelector(".btn-outline-primary");
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", function () {
      exportStudyData();
    });
  }
}

// 获取CSRF令牌
function getCSRFToken() {
  const tokenElement = document.querySelector('input[name="csrf_token"]');
  return tokenElement ? tokenElement.value : "";
}

// 获取数据并更新所有图表
function fetchAndUpdateAnalytics(dateFrom, dateTo) {
  // 1. 显示通用加载状态 (作用于所有 .chart-placeholder)
  /* document.querySelectorAll(".chart-placeholder").forEach(el => {
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
  });*/

  // (获取 totalStudyTimeEl 等元素的代码可以保留，如果将来 main.js 需要直接操作它们)
  // const totalStudyTimeEl = document.getElementById("totalStudyTime");
  // ...

  fetch("/api/analytics-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(), // 确保 getCSRFToken 已定义
    },
    body: JSON.stringify({ dateFrom, dateTo }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    })
    .then((data) => {
      console.log("API response data:", data);

      if (data.sessions && data.sessions.length > 0) {
        // 数据有效，直接调用更新函数
        updateStatsCards(data.sessions);
        updateStudyBarChart(data.sessions); // 直接调用
        updateSubjectPieChart(data.sessions); // 如果实现，也直接调用
        updateEfficiencyTimeChart(data.sessions);
        updateLocationEfficiencyChart(data.sessions);
        updateTimeLocation3DChart(data.sessions);
        window.filteredSessionsForAI = data.sessions; // 将数据存储在全局变量中，以便后续AI推荐使用
        // ... 其他图表函数

        if (typeof updateDataTable === "function") {
          updateDataTable(data.sessions);
        }
      } else {
        // 无数据情况
        updateStatsCards([]); // 更新统计卡片为无数据状态 ("--")
        updateStudyBarChart([]); // 更新条形图为无数据状态 (charts.js中应处理此情况)
        updateSubjectPieChart([]);
        updateEfficiencyTimeChart([]);
        updateLocationEfficiencyChart([]);
        updateTimeLocation3DChart([]);
        // ...

        // 对于没有被特定图表更新函数处理的 .chart-placeholder，可以设置通用无数据提示

        /*document.querySelectorAll(".chart-placeholder").forEach(el => {
        // 不再检查特定ID
        el.innerHTML = `...`;
      }); */
        if (typeof updateDataTable === "function") {
          updateDataTable([]);
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching analytics data:", error);

      updateStatsCards([]); // 更新统计卡片为错误状态 ("--")
      updateStudyBarChart([]); // 更新条形图为错误状态
      // updateSubjectPieChart([]);
      // ...

      if (typeof updateDataTable === "function") {
        updateDataTable([]);
      }
    });
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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// 更新AI推荐内容
function updateAIRecommendations(recommendations) {
  const container = document.getElementById("aiRecommendationsContent");

  // 完全重置容器内容和状态
  container.scrollTop = 0;
  container.innerHTML = "";

  // 如果没有推荐，显示提示信息
  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-3x text-secondary mb-3"></i>
        <p class="text-muted">没有足够的数据生成推荐。</p>
        <small class="text-muted">多学习一段时间后再来查看！</small>
      </div>
    `;
    return;
  }

  // 创建一个包含所有内容的容器
  const mainContent = document.createElement("div");

  // 添加固定标题用于说明内容
  const titleElem = document.createElement("div");
  titleElem.className = "mb-3";
  titleElem.innerHTML = `<p>基于您的学习数据，以下是一些个性化推荐：</p>`;
  mainContent.appendChild(titleElem);

  // 构建推荐卡片
  recommendations.forEach((rec, index) => {
    const cardEl = document.createElement("div");
    cardEl.className = "mb-3";
    cardEl.innerHTML = `
      <div class="card border-0 shadow-sm" id="rec-card-${index}">
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
    `;
    mainContent.appendChild(cardEl);
  });

  // 添加内容到容器
  container.appendChild(mainContent);

  // 确保容器滚动到顶部
  setTimeout(() => {
    container.scrollTop = 0;
  }, 10);
}

// 更新数据表格
function updateDataTable(sessions) {
  const dataTableContainer = document.querySelector(".data-table-container");
  if (!dataTableContainer) return;

  // 按日期逆序排序
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

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

  sortedSessions.forEach((session) => {
    // 星级HTML
    let starsHtml = "";
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

  fetch("/api/analytics-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken(),
    },
    body: JSON.stringify({ dateFrom, dateTo }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.sessions || data.sessions.length === 0) {
        showNotification(
          "Export Failed",
          "No data available to export",
          "warning"
        );
        return;
      }

      // 准备CSV数据
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent +=
        "Date,Subject,Start Time,End Time,Duration,Location,Efficiency,Notes\n";

      data.sessions.forEach((session) => {
        csvContent += `${session.date},${session.subject},${
          session.start_time
        },${session.end_time},${session.duration},"${session.location}",${
          session.efficiency
        },"${session.notes || ""}"\n`;
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

      showNotification(
        "Export Success",
        "Your study data has been exported to CSV",
        "success"
      );
    })
    .catch((error) => {
      console.error("Error exporting data:", error);
      showNotification(
        "Export Failed",
        "Could not export data. Please try again.",
        "danger"
      );
    });
}

// 获取随机颜色
function getRandomColor() {
  const colors = [
    "rgba(255, 99, 132, 0.7)",
    "rgba(54, 162, 235, 0.7)",
    "rgba(255, 206, 86, 0.7)",
    "rgba(75, 192, 192, 0.7)",
    "rgba(153, 102, 255, 0.7)",
    "rgba(255, 159, 64, 0.7)",
    "rgba(199, 199, 199, 0.7)",
    "rgba(83, 102, 255, 0.7)",
    "rgba(40, 167, 69, 0.7)",
    "rgba(220, 53, 69, 0.7)",
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}
