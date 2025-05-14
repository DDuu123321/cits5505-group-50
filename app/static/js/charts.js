/**
 * charts.js
 *
 * 包含所有图表渲染和相关计算逻辑。
 * 所有函数都将作为全局函数，在 main.js 中直接调用。
 * 确保此文件在 main.js 之前在 HTML 中加载。
 */

// 全局图表实例变量
let studyBarChartInstance = null;
// 为其他图表添加相应的变量
// let subjectPieChartInstance = null;
// ...
// =================================================================
// 辅助函数 (HELPER FUNCTIONS)
/**
 * 返回从 startDateStr 到 endDateStr（包含）之间的所有“YYYY-MM-DD”格式日期
 */
function getDatesInRange(startDateStr, endDateStr) {
  const dates = [];
  const current = new Date(startDateStr);
  const end = new Date(endDateStr);
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
// =================================================================

/**
 * 格式化日期为短格式，例如 "May 15"
 * @param {string} dateString - 日期字符串，格式为 YYYY-MM-DD
 * @returns {string} - 格式化后的日期字符串，如果输入无效则返回 "--"
 */


function formatDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return "--";
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "--";
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "--";
    }
  }
  
  /**
   * 计算每日学习时间分布
   * @param {Array} sessions - 会话数据数组，每个session应包含 'date' 和 'minutes' 属性
   * @returns {Object} - 日期为键，总分钟数为值的对象. 例如: {'2025-05-15': 120, '2025-05-16': 90}
   */
  function calculateDailyDistribution(sessions) {
    const dayDistribution = {};
    if (!sessions || !Array.isArray(sessions)) {
      return dayDistribution;
    }
  
    sessions.forEach(session => {
      if (session && typeof session.date === 'string' && typeof session.minutes === 'number' && !isNaN(session.minutes)) {
        const day = session.date;
        if (!dayDistribution[day]) {
          dayDistribution[day] = 0;
        }
        dayDistribution[day] += session.minutes;
      }
    });
    return dayDistribution;
  }
  
  // =================================================================
  // 统计卡片 (QUICK STATS)
  // =================================================================
  
  /**
   * 计算总学习时间
   * @param {Array} sessions - 会话数据数组
   * @returns {Object} - 包含 totalMinutes, hours, minutes, 和 display (例如 "5h 30m") 的对象
   */
  function calculateTotalStudyTime(sessions) {
    if (!sessions || sessions.length === 0) {
      return { totalMinutes: 0, hours: 0, minutes: 0, display: "--" };
    }
    const dailyData = calculateDailyDistribution(sessions);
    const totalMinutes = Object.values(dailyData).reduce((sum, minutes) => sum + minutes, 0);
  
    const hours = Math.floor(totalMinutes / 60);
    const minutesPart = totalMinutes % 60;
    return {
      totalMinutes: totalMinutes,
      hours: hours,
      minutes: minutesPart,
      display: `${hours}h ${minutesPart}m`
    };
  }
  
  /**
   * 计算学习稳定性（每日学习时间的方差）
   * @param {Array} sessions - 会话数据数组
   * @returns {string} - 格式化的方差值 (保留两位小数)，或 "--"
   */
  function calculateStudyVariance(sessions) {
    if (!sessions || sessions.length === 0) return "--";
  
    const dayDistribution = calculateDailyDistribution(sessions);
    const dailyMinutes = Object.values(dayDistribution);
  
    if (dailyMinutes.length < 1) return "--";
    if (dailyMinutes.length < 2) return "0.00";
  
    const mean = dailyMinutes.reduce((sum, val) => sum + val, 0) / dailyMinutes.length;
    const variance = dailyMinutes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dailyMinutes.length;
  
    return variance.toFixed(2);
  }
  
  /**
   * 计算平均效率
   * @param {Array} sessions - 会话数据数组，每个session应包含 'efficiency' (1-5)
   * @returns {string} - 格式化的平均效率值 (例如 "4.5/5")，或 "--"
   */
  function calculateAvgEfficiency(sessions) {
    if (!sessions || sessions.length === 0) return "--";
  
    const validSessions = sessions.filter(s => s && typeof s.efficiency === 'number' && s.efficiency >= 1 && s.efficiency <= 5);
    if (validSessions.length === 0) return "--";
  
    const totalEfficiency = validSessions.reduce((sum, session) => sum + session.efficiency, 0);
    const avgEfficiencyValue = (totalEfficiency / validSessions.length);
  
    return `${avgEfficiencyValue.toFixed(1)}/5`;
  }
  
  /**
 * 查找最活跃的一天（学习时间最长的那天）
 * @param {Array} sessions - 会话数据数组
 * @returns {string} - 格式化的日期字符串 (例如 "May 15, 2025")，或 "--"
 */
function findMostActiveDay(sessions) {
  if (!sessions || sessions.length === 0) return "--";

  const dayDistribution = calculateDailyDistribution(sessions);
  if (Object.keys(dayDistribution).length === 0) return "--";

  let mostActiveDayDate = '';
  let maxMinutes = -1;

  for (const [day, minutes] of Object.entries(dayDistribution)) {
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
      mostActiveDayDate = day;
    }
  }

  // 返回包含年份的格式化日期
  return mostActiveDayDate
    ? new Date(mostActiveDayDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : "--";
}
  
  /**
   * 更新统计卡片 (Quick Stats) 的显示
   * 此函数应在 main.js 中被调用。
   * @param {Array} sessions - 从API获取的原始会话数据数组
   */
  function updateStatsCards(sessions) {
    const totalStudyTimeEl = document.getElementById("totalStudyTime");
    const studyVarianceEl = document.getElementById("studyVariance");
    const avgEfficiencyEl = document.getElementById("avgEfficiency");
    const mostActiveDayEl = document.getElementById("mostActiveDay");
  
    if (totalStudyTimeEl) {
      totalStudyTimeEl.textContent = calculateTotalStudyTime(sessions).display;
    }
    if (studyVarianceEl) {
      studyVarianceEl.textContent = calculateStudyVariance(sessions);
    }
    if (avgEfficiencyEl) {
      avgEfficiencyEl.textContent = calculateAvgEfficiency(sessions);
    }
    if (mostActiveDayEl) {
      mostActiveDayEl.textContent = findMostActiveDay(sessions);
    }
  }
  
  // =================================================================
  // 其他图表函数 (暂时禁用或移除)
  // =================================================================
  function updateStudyBarChart(sessions) {
    const canvasElement = document.getElementById('studyBarChart');
    if (!canvasElement) {
      console.error("Canvas element with ID 'studyBarChart' not found.");
      return;
    }
  
    if (studyBarChartInstance) {
      studyBarChartInstance.destroy();
      studyBarChartInstance = null;
    }
  
    if (!sessions || sessions.length === 0) {
      const parent = canvasElement.parentElement;
      if (parent) {
        parent.innerHTML = `
          <div class="d-flex justify-content-center align-items-center h-100">
            <div class="text-center">
              <i class="fas fa-chart-bar fa-2x text-muted mb-2"></i>
              <p class="text-muted">No study time data for this period.</p>
            </div>
          </div>`;
      }
      return;
    }
  
    const parent = canvasElement.parentElement;
    if (parent && !parent.contains(canvasElement)) {
      parent.innerHTML = '';
      parent.appendChild(canvasElement);
    }
  
    const dailyData = calculateDailyDistribution(sessions);
  
    // 获取筛选的时间范围
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;
  
    const dateList = getDatesInRange(dateFrom, dateTo);
  
    // ✅ 只保留那些真的有数据的日期（即 dailyData 中存在）
    const filteredDateList = dateList.filter(dateStr => dailyData[dateStr] !== undefined);
    const labels = filteredDateList.map(dateStr => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    });
    const dataPoints = filteredDateList.map(dateStr => dailyData[dateStr]);
  
    // 全为空数据也提示用户
    if (dataPoints.length === 0) {
      const parent = canvasElement.parentElement;
      if (parent) {
        parent.innerHTML = `
          <div class="d-flex justify-content-center align-items-center h-100">
            <div class="text-center">
              <i class="fas fa-chart-bar fa-2x text-muted mb-2"></i>
              <p class="text-muted">No study time data for this period.</p>
            </div>
          </div>`;
      }
      return;
    }
  
    const dataConfig = {
      labels: labels,
      datasets: [{
        label: 'Study Minutes',
        data: dataPoints,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(54, 162, 235, 0.8)',
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }]
    };
  
    const optionsConfig = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Minutes Studied'
          },
          ticks: {
            stepSize: 30
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
          display: true,
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              const totalMinutes = context.parsed.y;
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              label += hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
              return label;
            }
          }
        }
      }
    };
  
    studyBarChartInstance = new Chart(canvasElement, {
      type: 'bar',
      data: dataConfig,
      options: optionsConfig
    });
  }
  
  
  function updateSubjectPieChart(sessions) {
    const canvasElement = document.getElementById('subjectPieChart');
  
    if (!canvasElement) {
      console.error("Canvas element with ID 'subjectPieChart' not found.");
      return;
    }
  
    if (window.subjectPieChartInstance) {
      window.subjectPieChartInstance.destroy();
      window.subjectPieChartInstance = null;
    }
  
    if (!sessions || sessions.length === 0) {
      const parent = canvasElement.parentElement;
      if (parent) {
        parent.innerHTML = `
          <div class="d-flex justify-content-center align-items-center h-100">
            <div class="text-center">
              <i class="fas fa-chart-pie fa-2x text-muted mb-2"></i>
              <p class="text-muted">No subject data available for this period.</p>
            </div>
          </div>`;
      }
      return;
    }
  
    // === 新增：解析时间字符串为分钟 ===
    function parseDurationToMinutes(durationStr) {
      if (typeof durationStr === 'number') return durationStr;
      const hourMatch = durationStr.match(/(\d+)h/);
      const minuteMatch = durationStr.match(/(\d+)m/);
      const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      return hours * 60 + minutes;
    }
  
    // 统计每个科目的总学习时间（以分钟为单位）
    const subjectDistribution = {};
    sessions.forEach(session => {
      const subject = session.subject || 'Unknown';
      const rawDuration = session.duration || 0;
      const minutes = parseDurationToMinutes(rawDuration);
      if (!subjectDistribution[subject]) {
        subjectDistribution[subject] = 0;
      }
      subjectDistribution[subject] += minutes;
    });
  
    const labels = Object.keys(subjectDistribution);
    const dataPoints = Object.values(subjectDistribution);
  
    // 如果所有值都是 0，则不显示图表
    if (dataPoints.length === 0 || dataPoints.every(v => v === 0)) {
      const parent = canvasElement.parentElement;
      if (parent) {
        parent.innerHTML = `
          <div class="d-flex justify-content-center align-items-center h-100">
            <div class="text-center">
              <i class="fas fa-chart-pie fa-2x text-muted mb-2"></i>
              <p class="text-muted">No subject data available for this period.</p>
            </div>
          </div>`;
      }
      return;
    }
  
    // 配色
    const colors = labels.map(() => getRandomColor()); // 随机颜色，所以可能会重复
  
    const dataConfig = {
      labels: labels,
      datasets: [{
        data: dataPoints,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace(/0\.7\)/, '1)')),
        borderWidth: 1
      }]
    };
  
    const optionsConfig = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} minutes (${percentage}%)`;
            }
          }
        }
      }
    };
  
    window.subjectPieChartInstance = new Chart(canvasElement, {
      type: 'pie',
      data: dataConfig,
      options: optionsConfig
    });
  }
  
  
 /**
 * 更新时间段效率图表
 * @param {Array} sessions - 会话数据数组
 */
 function updateEfficiencyTimeChart(sessions) {
  const canvasElement = document.getElementById('efficiencyTimeChart');
  
  if (!canvasElement) {
    console.error("Canvas element with ID 'efficiencyTimeChart' not found.");
    return;
  }

  if (window.efficiencyTimeChartInstance) {
    window.efficiencyTimeChartInstance.destroy();
    window.efficiencyTimeChartInstance = null;
  }

  if (!sessions || sessions.length === 0) {
    const parent = canvasElement.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center h-100">
          <div class="text-center">
            <i class="fas fa-chart-bar fa-2x text-muted mb-2"></i>
            <p class="text-muted">No efficiency data available for this period.</p>
          </div>
        </div>`;
    }
    return;
  }

  const parent = canvasElement.parentElement;
  if (parent && !parent.contains(canvasElement)) {
    parent.innerHTML = '';
    parent.appendChild(canvasElement);
  }

  const timeSlots = [
    { name: "Early Morning", start: 5, end: 9, color: 'rgba(255, 190, 11, 0.7)' },
    { name: "Morning", start: 9, end: 12, color: 'rgba(251, 86, 7, 0.7)' },
    { name: "Noon", start: 12, end: 14, color: 'rgba(255, 0, 110, 0.7)' },
    { name: "Afternoon", start: 14, end: 17, color: 'rgba(131, 56, 236, 0.7)' },
    { name: "Evening", start: 17, end: 20, color: 'rgba(58, 134, 255, 0.7)' },
    { name: "Night", start: 20, end: 24, color: 'rgba(43, 211, 188, 0.7)' },
    { name: "Late Night", start: 0, end: 5, color: 'rgba(45, 149, 150, 0.7)' }
  ];

  const timeSlotEfficiency = {};
  const timeSlotCounts = {};
  const timeSlotRawEfficiencies = {};

  timeSlots.forEach(slot => {
    timeSlotEfficiency[slot.name] = 0;
    timeSlotCounts[slot.name] = 0;
    timeSlotRawEfficiencies[slot.name] = [];
  });

  sessions.forEach(session => {
    if (session.hour_of_day !== undefined && session.efficiency !== undefined) {
      const hour = parseInt(session.hour_of_day);
      const efficiency = parseInt(session.efficiency);

      const matchingSlot = timeSlots.find(slot => {
        return slot.start < slot.end
          ? hour >= slot.start && hour < slot.end
          : hour >= slot.start || hour < slot.end;
      });

      if (matchingSlot) {
        const slotName = matchingSlot.name;
        timeSlotEfficiency[slotName] += efficiency;
        timeSlotCounts[slotName]++;
        timeSlotRawEfficiencies[slotName].push(efficiency);
      }
    }
  });

  const labels = [];
  const dataPoints = [];
  const backgroundColors = [];
  const borderColors = [];

  timeSlots.forEach(slot => {
    const count = timeSlotCounts[slot.name];
    const rawList = timeSlotRawEfficiencies[slot.name];

    if (count > 0) {
      const avgEfficiency = (timeSlotEfficiency[slot.name] / count).toFixed(1);
      labels.push(slot.name);
      dataPoints.push(avgEfficiency);
      backgroundColors.push(slot.color);
      borderColors.push(slot.color.replace(/0\.7\)/, '1)'));

      // ✅ 控制台输出原始效率 + 平均值
      console.log(`${slot.name}: avg = ${avgEfficiency}, from [${rawList.join(", ")}]`);
    }
  });

  if (dataPoints.length === 0) {
    if (parent) {
      parent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center h-100">
          <div class="text-center">
            <i class="fas fa-chart-bar fa-2x text-muted mb-2"></i>
            <p class="text-muted">No efficiency data available for the selected time slots.</p>
          </div>
        </div>`;
    }
    return;
  }

  const dataConfig = {
    labels: labels,
    datasets: [{
      label: 'Average Efficiency (1-5)',
      data: dataPoints,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 1,
      barPercentage: 0.6,
      categoryPercentage: 0.8
    }]
  };

  const optionsConfig = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Efficiency'
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time of Day'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw || 0;
            const count = timeSlotCounts[context.label] || 0;
            return [
              `Average Efficiency: ${value}/5`,
              `Based on ${count} session${count !== 1 ? 's' : ''}`
            ];
          }
        }
      }
    }
  };

  window.efficiencyTimeChartInstance = new Chart(
    canvasElement,
    {
      type: 'bar',
      data: dataConfig,
      options: optionsConfig
    }
  );
}

  
 /**
 * 更新位置效率图表
 * @param {Array} sessions - 会话数据数组
 */
function updateLocationEfficiencyChart(sessions) {
  const canvasElement = document.getElementById('locationEfficiencyChart');
  
  if (!canvasElement) {
    console.error("Canvas element with ID 'locationEfficiencyChart' not found.");
    return;
  }

  if (window.locationEfficiencyChartInstance) {
    window.locationEfficiencyChartInstance.destroy();
    window.locationEfficiencyChartInstance = null;
  }

  if (!sessions || sessions.length === 0) {
    const parent = canvasElement.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center h-100">
          <div class="text-center">
            <i class="fas fa-map-marker-alt fa-2x text-muted mb-2"></i>
            <p class="text-muted">No location data available for this period.</p>
          </div>
        </div>`;
    }
    return;
  }

  const parent = canvasElement.parentElement;
  if (parent && !parent.contains(canvasElement)) {
    parent.innerHTML = '';
    parent.appendChild(canvasElement);
  }

  // 统计各位置的效率
  const locationEfficiency = {}; // 效率总和
  const locationCounts = {};     // 会话数量
  
  sessions.forEach(session => {
    if (session.location && session.efficiency !== undefined) {
      const location = session.location.trim();
      const efficiency = parseFloat(session.efficiency);
      
      if (!locationEfficiency[location]) {
        locationEfficiency[location] = 0;
        locationCounts[location] = 0;
      }
      
      locationEfficiency[location] += efficiency;
      locationCounts[location]++;
    }
  });

  // 计算平均效率
  const locations = [];
  const avgEfficiencies = [];
  
  for (const [location, totalEfficiency] of Object.entries(locationEfficiency)) {
    const count = locationCounts[location];
    if (count > 0) {
      locations.push(location);
      avgEfficiencies.push((totalEfficiency / count).toFixed(1));
    }
  }

  // 如果没有数据，显示无数据提示
  if (locations.length === 0) {
    if (parent) {
      parent.innerHTML = `
        <div class="d-flex justify-content-center align-items-center h-100">
          <div class="text-center">
            <i class="fas fa-map-marker-alt fa-2x text-muted mb-2"></i>
            <p class="text-muted">No location efficiency data available.</p>
          </div>
        </div>`;
    }
    return;
  }

  // 根据效率排序（从高到低）
  const combined = locations.map((location, index) => ({
    location,
    efficiency: avgEfficiencies[index]
  }));
  
  combined.sort((a, b) => b.efficiency - a.efficiency);
  
  const sortedLocations = combined.map(item => item.location);
  const sortedEfficiencies = combined.map(item => item.efficiency);

  // 统一颜色
  const barColor = 'rgba(75, 192, 192, 0.7)';
  const borderColor = 'rgba(75, 192, 192, 1)';

  // 配置图表数据
  const dataConfig = {
    labels: sortedLocations,
    datasets: [{
      label: 'Average Efficiency (1-5)',
      data: sortedEfficiencies,
      backgroundColor: barColor,
      borderColor: borderColor,
      borderWidth: 1,
      barPercentage: 0.6,
      categoryPercentage: 0.8
    }]
  };

  // 配置图表选项
  const optionsConfig = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',  // 水平条形图
    scales: {
      x: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Average Efficiency (1-5)'
        },
        ticks: {
          stepSize: 1
        }
      },
      y: {
        title: {
          display: true,
          text: 'Study Location'
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
            const value = context.raw || 0;
            const count = locationCounts[context.label] || 0;
            return [
              `Average Efficiency: ${value}/5`,
              `Based on ${count} session${count !== 1 ? 's' : ''}`
            ];
          }
        }
      }
    }
  };

  // 创建图表
  window.locationEfficiencyChartInstance = new Chart(
    canvasElement,
    {
      type: 'bar',
      data: dataConfig,
      options: optionsConfig
    }
  );
}
 
/**
 * 更新时间段与地点效率的3D图表
 * @param {Array} sessions - 会话数据数组
 */
function updateTimeLocation3DChart(sessions) {
  const container = document.getElementById('timeLocationHeatmap');
  if (!container) {
    console.error("Container element with ID 'timeLocationHeatmap' not found.");
    return;
  }
  container.innerHTML = '';

  if (!sessions || sessions.length === 0) {
    container.innerHTML = `
      <div class="d-flex justify-content-center align-items-center h-100">
        <div class="text-center">
          <i class="fas fa-cubes fa-2x text-muted mb-2"></i>
          <p class="text-muted">No data available for 3D visualization.</p>
        </div>
      </div>`;
    return;
  }

  // ✅ 定义时间段
  const timeSlots = [
    { name: "Early Morning", start: 5, end: 9 },
    { name: "Morning", start: 9, end: 12 },
    { name: "Noon", start: 12, end: 14 },
    { name: "Afternoon", start: 14, end: 17 },
    { name: "Evening", start: 17, end: 20 },
    { name: "Night", start: 20, end: 24 },
    { name: "Late Night", start: 0, end: 5 }
  ];
  const timeSlotNames = timeSlots.map(s => s.name);

  // ✅ 收集所有地点
  const allLocationsSet = new Set();
  sessions.forEach(s => {
    if (s.location) {
      allLocationsSet.add(String(s.location).trim());
    }
  });
  const locations = Array.from(allLocationsSet);

  // ✅ 映射时间段和地点到数字 index（用于坐标轴）
  const slotIndexMap = Object.fromEntries(timeSlotNames.map((n, i) => [n, i]));
  const locationIndexMap = Object.fromEntries(locations.map((n, i) => [n, i]));

  // ✅ 构建聚合数据结构
  const dataMap = {};
  timeSlotNames.forEach(slot => {
    dataMap[slot] = {};
    locations.forEach(loc => {
      dataMap[slot][loc] = { values: [], sum: 0, count: 0 };

    });
  });

  // ✅ 聚合每条记录
  sessions.forEach(s => {
    const loc = String(s.location).trim();
    const [h, m] = s.start_time.split(":").map(Number);
    const hour = h + m / 60;
    const eff = parseFloat(s.efficiency);
    if (isNaN(hour) || isNaN(eff)) return;

    const slot = timeSlots.find(ts =>
      ts.start < ts.end
        ? hour >= ts.start && hour < ts.end
        : hour >= ts.start || hour < ts.end
    );
    if (!slot) return;

    const slotName = slot.name;
    const entry = dataMap[slotName][loc];
    entry.sum += eff;
    entry.count += 1;
    entry.values.push(eff);

  });

  // ✅ 打印调试信息
  console.log("🧠 Time × Location Efficiency Map:");
  console.table(dataMap);

  // ✅ 生成绘图数据
  const x = [], y = [], z = [], text = [];

  timeSlotNames.forEach(slot => {
    locations.forEach(loc => {
      const stats = dataMap[slot][loc];
      const hasData = stats.count > 0;
      x.push(slotIndexMap[slot]);
      y.push(locationIndexMap[loc]);
      z.push(hasData ? stats.sum / stats.count : null);
      text.push(`${slot} @ ${loc}<br>` +
        (hasData
          ? `Avg: ${(stats.sum / stats.count).toFixed(2)} / 5<br>Sessions: ${stats.count}`
          : `No data`));
    });
  });

  const trace = {
    type: 'scatter3d',
    mode: 'markers',
    x, y, z, text,
    hoverinfo: 'text',
    marker: {
      size: 8,
      color: z,
      colorscale: 'RdYlGn',
      cmin: 1,
      cmax: 5,
      opacity: 0.85
    }
  };

  const layout = {
    title: 'Study Efficiency by Time Slot and Location',
    showlegend: false,
    margin: { t: 40, l: 0, r: 0, b: 0 },
    scene: {
      xaxis: {
        title: 'Time Slot',
        tickvals: timeSlotNames.map((_, i) => i),
        ticktext: timeSlotNames,
      },
      yaxis: {
        title: 'Location',
        tickvals: locations.map((_, i) => i),
        ticktext: locations,
      },
      zaxis: {
        title: 'Avg Efficiency',
        range: [0.5, 5.5]
      }
    },
    hoverlabel: {
      bgcolor: '#fff',
      font: { size: 12, color: '#000' }
    }
  };

  Plotly.newPlot(container, [trace], layout, {
    responsive: true,
    scrollZoom: true,
    displayModeBar: false
  });
}
