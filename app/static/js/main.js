/**
 * StudyTime Tracker - Main JavaScript
 * This file contains the core JavaScript functionality for the StudyTime Tracker application.
 * For the first presentation, this file includes placeholder functions and structure only.
 * CITS5505 Project
 */

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("StudyTime Tracker initialized");

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
  console.log("Home page initialized");

  // Login form handling (placeholder)
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("Login form submitted (demo only)");
      // In the real implementation, this would handle authentication
    });
  }

  // For the first presentation, we're not implementing actual functionality
}

/**
 * Initialize upload page components
 */
function initUploadPage() {
  console.log("Upload page initialized");

  // Study timer elements (placeholders)
  const startTimerBtn = document.getElementById("startTimer");
  const pauseTimerBtn = document.getElementById("pauseTimer");
  const resetTimerBtn = document.getElementById("resetTimer");
  const timerDisplay = document.getElementById("timerDisplay");

  // Add event listeners to timer buttons (for future implementation)
  if (startTimerBtn && pauseTimerBtn && resetTimerBtn) {
    startTimerBtn.addEventListener("click", function () {
      console.log("Timer would start here");
      // In future: startTimer();
    });

    pauseTimerBtn.addEventListener("click", function () {
      console.log("Timer would pause here");
      // In future: pauseTimer();
    });

    resetTimerBtn.addEventListener("click", function () {
      console.log("Timer would reset here");
      // In future: resetTimer();
    });
  }

  // Interruption tracking (placeholder)
  const recordInterruptionBtn = document.getElementById("recordInterruption");
  if (recordInterruptionBtn) {
    recordInterruptionBtn.addEventListener("click", function () {
      console.log("Interruption would be recorded here");
      // In future: recordInterruption();
    });
  }
}

/**
 * Initialize visualization page components
 */
function initVisualizePage() {
  console.log("Visualize page initialized");

  const applyButton = document.getElementById("filterApply");
  if (applyButton) {
    applyButton.addEventListener("click", async function () {
      const dateFrom = document.getElementById("dateFrom").value;
      const dateTo = document.getElementById("dateTo").value;

      if (!dateFrom || !dateTo) {
        alert("Please select both start and end dates.");
        return;
      }

      try {
        const sessions = await fetchFilteredData(dateFrom, dateTo);
        drawSubjectPieChart(sessions);
        // 🚧 未来这里也可以加其他图表的绘制函数，比如 drawEfficiencyBarChart(sessions);
        drawSummaryCards(sessions);// 这个函数用于绘制汇总卡片
        drawStudyBarChart(sessions);  // 这个函数用于绘制柱状图，显示每天的学习时间
        drawEfficiencyTimeChart(sessions);// 这个函数用于绘制柱状图，显示一天内各时间段的平均效率
        drawLocationEfficiencyChart(sessions);// 这个函数用于绘制柱状图，显示各地点的平均效率
        drawTimeLocation3DChart(sessions); // 这个函数用于绘制3D散点图，显示各时间段和地点的效率




      } catch (error) {
        console.error("Error processing filtered data:", error);
      }
      // 在 initVisualizePage 函数末尾的 catch 块之后、函数结束前添加

  // 添加 AI 推荐按钮事件处理
  const aiRecommendButton = document.getElementById("getAiRecommendations");
  if (aiRecommendButton) {
    aiRecommendButton.addEventListener("click", async function() {
      // 获取当前过滤出的会话数据
      const dateFrom = document.getElementById("dateFrom").value;
      const dateTo = document.getElementById("dateTo").value;

      if (!dateFrom || !dateTo) {
        alert("Please select a date range and apply filters first to load your study data.");
        return;
      }

      try {
        // 显示加载指示器
        document.getElementById("aiRecommendationsContent").classList.add("d-none");
        document.getElementById("aiLoadingIndicator").classList.remove("d-none");
        
        // 获取数据并生成AI推荐
        const sessions = await fetchFilteredData(dateFrom, dateTo);
        const result = await getAIRecommendations(sessions);
        
        // 隐藏加载指示器
        document.getElementById("aiLoadingIndicator").classList.add("d-none");
        document.getElementById("aiRecommendationsContent").classList.remove("d-none");
        
        if (result.success) {
          displayAIRecommendations(result.recommendations);
        } else {
          // 显示错误信息
          document.getElementById("aiRecommendationsContent").innerHTML = `
            <div class="alert alert-warning" role="alert">
              <i class="fas fa-exclamation-triangle me-2"></i> ${result.message}
            </div>
          `;
        }
      } catch (error) {
        console.error("Error getting AI recommendations:", error);
        document.getElementById("aiLoadingIndicator").classList.add("d-none");
        document.getElementById("aiRecommendationsContent").classList.remove("d-none");
        document.getElementById("aiRecommendationsContent").innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i> Failed to get recommendations. Please try again later.
          </div>
        `;
      }
    });
  }
    });
  }
}//发送请求到后端，获取指定日期范围内的学习会话数据




/**
 * Initialize share page components
 */
function initSharePage() {
  console.log("Share page initialized");

  // Modal functionality is handled by Bootstrap
  // In the future, this would handle report creation and sharing
}

// Placeholder functions for study timer (to be implemented later)
let timerInterval;
let seconds = 0;

function startTimer() {
  // Timer logic will be implemented here
}

function pauseTimer() {
  // Pause functionality will be implemented here
}

function resetTimer() {
  // Reset functionality will be implemented here
}

function formatTime(totalSeconds) {
  // Format seconds into HH:MM:SS
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((v) => (v < 10 ? "0" + v : v)).join(":");
}

/**
 * Future data handling functions
 * These are placeholders for the actual implementation that will come later
 */
function saveStudySession(sessionData) {
  // This will save study session data to the backend
  console.log("Would save study session:", sessionData);
}

function loadStudySessions() {
  // This will load study sessions from the backend
  console.log("Would load study sessions");
  return []; // Placeholder
}

function createShareableReport(reportData) {
  // This will create a shareable report
  console.log("Would create report:", reportData);
  return { id: "demo-report-id" }; // Placeholder
}

async function fetchFilteredData(dateFrom, dateTo) {
  const response = await fetch("/api/analytics-data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date_from: dateFrom,
      date_to: dateTo,
    }),
  });

  const data = await response.json();  //接收后端返回的数据
  console.log("Filtered session data:", data.sessions);
  return data.sessions;
}// 这个函数用于发送请求到后端，获取指定日期范围内的学习会话数据

function drawSubjectPieChart(sessions) {
  const subjectTimeMap = {};
  sessions.forEach((s) => {
    const match = s.duration.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const totalMinutes = hours * 60 + minutes;

      if (subjectTimeMap[s.subject]) {
        subjectTimeMap[s.subject] += totalMinutes;
      } else {
        subjectTimeMap[s.subject] = totalMinutes;
      }
    }
  });

  const labels = Object.keys(subjectTimeMap);
  const values = Object.values(subjectTimeMap);

  const pieCanvas = document.getElementById("subjectPieChart");
  if (pieCanvas) {
    if (window.subjectChart) {
      window.subjectChart.destroy();
    }

    window.subjectChart = new Chart(pieCanvas, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  }
} // 这个函数用于绘制饼图，显示各科目学习时间的占比


function drawSummaryCards(sessions) {
  if (!sessions.length) {
    document.getElementById("totalStudyTime").innerText = "0";
    document.getElementById("studyVariance").innerText = "0";
    document.getElementById("avgEfficiency").innerText = "0/5";
    document.getElementById("mostActiveDay").innerText = "--";
    return;
  }

  // 1. 计算总时长
  let totalMinutes = 0;
  const dailyTotals = {};
  let totalEfficiency = 0;

  sessions.forEach((s) => {
    const match = s.duration.match(/(\d+)h\s*(\d+)m/); // 正则表达式提取小时和分钟
    if (match) {
      const mins = parseInt(match[1]) * 60 + parseInt(match[2]); //把时分转换为分钟
      totalMinutes += mins; // 累加总时长

      // 累加每天的学习时间
      if (!dailyTotals[s.date]) dailyTotals[s.date] = 0;
      dailyTotals[s.date] += mins;
    }

    totalEfficiency += s.efficiency;
  });

  // 2. 填入总时长
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  document.getElementById("totalStudyTime").innerText = `${hours}h ${minutes}m`; //填入html中的totalStudyTime元素

  // 3. 计算方差
  const values = Object.values(dailyTotals);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + (val - avg) ** 2, 0) / values.length;
  document.getElementById("studyVariance").innerText = variance.toFixed(2);

  // 4. 平均效率
  const avgEfficiency = totalEfficiency / sessions.length;
  document.getElementById("avgEfficiency").innerText = `${avgEfficiency.toFixed(1)}/5`;

  // 5. 最活跃的一天
  const mostActiveDate = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0][0];
  document.getElementById("mostActiveDay").innerText = mostActiveDate;
}


function drawStudyBarChart(sessions) {
  const dateMap = {};

  sessions.forEach((s) => {
    const match = s.duration.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      const mins = parseInt(match[1]) * 60 + parseInt(match[2]);
      if (dateMap[s.date]) {
        dateMap[s.date] += mins;
      } else {
        dateMap[s.date] = mins;
      }
    }
  });

  const labels = Object.keys(dateMap).sort();
  const values = labels.map(date => dateMap[date]);

  const ctx = document.getElementById("studyBarChart");
  if (ctx) {
    if (window.studyChart) {
      window.studyChart.destroy();
    }

    window.studyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Study Time (mins)',
          data: values,
          backgroundColor: '#36A2EB',
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
// 这个函数用于绘制柱状图，显示每天的学习时间

function drawEfficiencyTimeChart(sessions) {
  const buckets = {
    "Early Morning": [],
    "Morning": [],
    "Afternoon": [],
    "Evening": [],
    "Night": [],
    "Late Night": []
  };

  sessions.forEach(s => {
    const [hour, minute] = s.start_time.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;

    if (totalMinutes >= 360 && totalMinutes < 600) {
      buckets["Early Morning"].push(s.efficiency);
    } else if (totalMinutes >= 600 && totalMinutes < 720) {
      buckets["Morning"].push(s.efficiency);
    } else if (totalMinutes >= 720 && totalMinutes < 960) {
      buckets["Afternoon"].push(s.efficiency);
    } else if (totalMinutes >= 960 && totalMinutes < 1140) {
      buckets["Evening"].push(s.efficiency);
    } else if (totalMinutes >= 1140 && totalMinutes < 1380) {
      buckets["Night"].push(s.efficiency);
    } else {
      buckets["Late Night"].push(s.efficiency);
    }
  }); //这样处理是为了避免字符串比较带来的问题

  const labels = Object.keys(buckets);
  const averages = labels.map(slot => {
    const values = buckets[slot];
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg.toFixed(2);
  });

  const ctx = document.getElementById("efficiencyTimeChart");
  if (ctx) {
    if (window.efficiencyTimeChart instanceof Chart) {
      window.efficiencyTimeChart.destroy();
    }
    

    window.efficiencyTimeChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Avg. Efficiency",
          data: averages,
          backgroundColor: "#36A2EB"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 5
          }
        }
      }
    });
  }
}
// 这个函数用于绘制柱状图，显示各时间段的平均效率


function drawLocationEfficiencyChart(sessions) {
  const locationMap = {};

  // 1. 分组收集效率值
  sessions.forEach(s => {
    const loc = s.location;
    if (!locationMap[loc]) {
      locationMap[loc] = [];
    }
    locationMap[loc].push(s.efficiency);
  });

  // 2. 计算平均值
  const labels = Object.keys(locationMap);
  const averages = labels.map(loc => {
    const values = locationMap[loc];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg.toFixed(2);
  });

  // 3. 绘图
  const ctx = document.getElementById("locationEfficiencyChart");
  if (ctx) {
    if (window.locationEfficiencyChart instanceof Chart) {
      window.locationEfficiencyChart.destroy();
    }

    window.locationEfficiencyChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Avg. Efficiency",
          data: averages,
          backgroundColor: "#4BC0C0"
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 5
          }
        }
      }
    });
  }
}
// 这个函数用于绘制柱状图，显示各地点的平均效率

function drawTimeLocation3DChart(sessions) {
  const timeSlots = {
    "Late Night": [0, 360],
    "Early Morning": [360, 600],
    "Morning": [600, 720],
    "Afternoon": [720, 960],
    "Evening": [960, 1140],
    "Night": [1140, 1380]
  };

  const xLabels = Object.keys(timeSlots);
  const yLabels = [...new Set(sessions.map(s => s.location))];

  const x = [], y = [], z = [], colors = [];

  sessions.forEach(s => {
    const [hour, minute] = s.start_time.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;

    let slot = xLabels.find(label => {
      const [min, max] = timeSlots[label];
      return totalMinutes >= min && totalMinutes < max;
    });

    if (!slot) return;

    const xIdx = xLabels.indexOf(slot);
    const yIdx = yLabels.indexOf(s.location);
    const efficiency = s.efficiency;

    x.push(xIdx);
    y.push(yIdx);
    z.push(efficiency);
    colors.push(efficiency); // 颜色映射用
  });

  const trace = {
    x: x,
    y: y,
    z: z,
    type: 'scatter3d',
    mode: 'markers',
    marker: {
      size: 8,
      color: colors,
      colorscale: 'RdYlGn',
      cmin: 0,
      cmax: 5,
      opacity: 0.9,
      line: {
        width: 0.5,
        color: 'rgba(0,0,0,0.1)'
      }
    },
    text: z.map((v, i) => `${xLabels[x[i]]} @ ${yLabels[y[i]]}: ${v}`)
  };

  const layout = {
    margin: { t: 50, l: 0, r: 0, b: 0 },
    scene: {
      xaxis: {
        title: 'Time Slot',
        tickvals: xLabels.map((_, i) => i),
        ticktext: xLabels
      },
      yaxis: {
        title: 'Location',
        tickvals: yLabels.map((_, i) => i),
        ticktext: yLabels
      },
      zaxis: {
        title: 'Efficiency',
        range: [0, 5]
      }
    }
  };

  Plotly.newPlot("timeLocationHeatmap", [trace], layout);
}


// 添加到文件末尾

// 获取 AI 推荐
async function getAIRecommendations(sessions) {
  // 检查是否有会话数据
  if (!sessions || sessions.length === 0) {
    return {
      success: false,
      message: "No study data available. Please select a date range with study sessions first."
    };
  }
  
  // 收集科目分布数据
  const subjectDistribution = {};
  sessions.forEach((s) => {
    const match = s.duration.match(/(\d+)h\s*(\d+)m/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const totalMinutes = hours * 60 + minutes;

      if (subjectDistribution[s.subject]) {
        subjectDistribution[s.subject] += totalMinutes;
      } else {
        subjectDistribution[s.subject] = totalMinutes;
      }
    }
  });
  
  // 收集时间-地点-效率数据
  const timeSlots = {
    "Late Night": [0, 360],
    "Early Morning": [360, 600],
    "Morning": [600, 720],
    "Afternoon": [720, 960],
    "Evening": [960, 1140],
    "Night": [1140, 1380]
  };

  const xLabels = Object.keys(timeSlots);
  const yLabels = [...new Set(sessions.map(s => s.location))];
  const dataPoints = [];

  sessions.forEach(s => {
    const [hour, minute] = s.start_time.split(":").map(Number);
    const totalMinutes = hour * 60 + minute;

    let slot = xLabels.find(label => {
      const [min, max] = timeSlots[label];
      return totalMinutes >= min && totalMinutes < max;
    });

    if (!slot) return;

    dataPoints.push({
      timeSlot: slot,
      location: s.location,
      efficiency: s.efficiency
    });
  });
  
  try {
    // 发送数据到后端 API
    const response = await fetch("/api/ai-recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        subjectDistribution: subjectDistribution,
        timeLocationData: {
          timeSlots: xLabels,
          locations: yLabels,
          dataPoints: dataPoints
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      recommendations: data.recommendations
    };
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    return {
      success: false,
      message: "Failed to get recommendations. Please try again later."
    };
  }
}
// 添加到文件末尾

// 打字效果函数
function typeWriter(element, text, speed = 30, index = 0) {
  if (index < text.length) {
    element.innerHTML += text.charAt(index);
    index++;
    setTimeout(() => typeWriter(element, text, speed, index), speed);
  }
}

// 显示 AI 推荐结果，带打字效果
function displayAIRecommendations(recommendations) {
  const container = document.getElementById("aiRecommendationsContent");
  container.innerHTML = ''; // 清空内容
  
  // 创建标题元素
  const title = document.createElement('h6');
  title.className = 'border-bottom pb-2 mb-3';
  container.appendChild(title);
  
  // 创建列表容器
  const list = document.createElement('ul');
  list.className = 'list-group list-group-flush';
  container.appendChild(list);
  
  // 使用打字效果展示标题
  typeWriter(title, 'Based on your study data, here are some personalized recommendations:');
  
  // 依次添加每条建议，使用延迟和打字效果
  recommendations.forEach((rec, index) => {
    setTimeout(() => {
      const item = document.createElement('li');
      item.className = 'list-group-item bg-light bg-opacity-50 mb-2 rounded';
      
      const content = document.createElement('div');
      content.className = 'd-flex';
      
      const iconDiv = document.createElement('div');
      iconDiv.className = 'me-2';
      iconDiv.innerHTML = `<i class="fas ${rec.icon} text-primary"></i>`;
      
      const textDiv = document.createElement('div');
      textDiv.innerHTML = `<strong>${rec.title}</strong>`;
      
      const description = document.createElement('p');
      description.className = 'mb-0 text-muted small';
      textDiv.appendChild(description);
      
      content.appendChild(iconDiv);
      content.appendChild(textDiv);
      item.appendChild(content);
      list.appendChild(item);
      
      // 使用打字效果展示描述文本
      typeWriter(description, rec.description);
    }, 1000 * (index + 1)); // 每条建议延迟显示
  });
}