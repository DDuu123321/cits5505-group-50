/**
 * StudyTime Tracker - Charts JavaScript
 * This file contains the chart-related functionality for the StudyTime Tracker application.
 */

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
  new Chart(ctx, {
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
  const ctx = document.getElementById('subjectPieChart').getContext('2d');
  
  // 处理数据
  const subjects = Object.keys(subjectDistribution);
  const minutesData = Object.values(subjectDistribution);
  const hoursData = minutesData.map(minutes => Math.round(minutes / 60 * 10) / 10);
  
  // 生成随机颜色
  const colors = subjects.map(() => getRandomColor());
  
  // 创建图表
  new Chart(ctx, {
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
}

// 更新效率时间图
function updateEfficiencyTimeChart(sessions) {
  const ctx = document.getElementById('efficiencyTimeChart').getContext('2d');
  
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
  sessions.forEach(session => {
    const hour = parseInt(session.start_time.split(':')[0]);
    hourData[hour].totalEfficiency += session.efficiency;
    hourData[hour].count += 1;
  });
  
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
  
  // 创建图表
  new Chart(ctx, {
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
  const ctx = document.getElementById('locationEfficiencyChart').getContext('2d');
  
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
  
  // 创建图表
  new Chart(ctx, {
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

// 更新时间×地点热图
function updateTimeLocationHeatmap(sessions) {
  // 如果没有数据或sessions少于5个，不显示热图
  if (!sessions || sessions.length < 5) {
    document.getElementById('timeLocationHeatmap').innerHTML = `
      <div class="d-flex flex-column justify-content-center align-items-center h-100 py-5">
        <i class="fas fa-chart-area fa-3x text-muted mb-3"></i>
        <p class="text-muted">Not enough data to generate heatmap</p>
        <small class="text-muted">At least 5 study sessions needed</small>
      </div>
    `;
    return;
  }
  
  // 处理数据
  const timeLocationData = {};
  const locations = new Set();
  
  // 分组数据
  sessions.forEach(session => {
    const hour = parseInt(session.start_time.split(':')[0]);
    const timeGroup = Math.floor(hour / 4);
    const timeLabel = ['Early Morning (0-4)', 'Morning (4-8)', 'Mid-Day (8-12)', 
                       'Afternoon (12-16)', 'Evening (16-20)', 'Night (20-24)'][timeGroup];
    
    locations.add(session.location);
    
    if (!timeLocationData[timeLabel]) {
      timeLocationData[timeLabel] = {};
    }
    
    if (!timeLocationData[timeLabel][session.location]) {
      timeLocationData[timeLabel][session.location] = {
        totalEfficiency: 0,
        count: 0,
        average: 0
      };
    }
    
    timeLocationData[timeLabel][session.location].totalEfficiency += session.efficiency;
    timeLocationData[timeLabel][session.location].count += 1;
  });
  
  // 计算平均值
  for (let time in timeLocationData) {
    for (let location in timeLocationData[time]) {
      const data = timeLocationData[time][location];
      data.average = data.totalEfficiency / data.count;
    }
  }
  
  // 准备图表数据
  const timeLabels = ['Early Morning (0-4)', 'Morning (4-8)', 'Mid-Day (8-12)', 
                     'Afternoon (12-16)', 'Evening (16-20)', 'Night (20-24)'];
  
  const locationLabels = [...locations].slice(0, 6);  // 限制最多6个地点
  
  // 处理Plotly所需的z值，按效率排序
  const zValues = [];
  for (let time of timeLabels) {
    const row = [];
    for (let location of locationLabels) {
      if (timeLocationData[time] && timeLocationData[time][location]) {
        row.push(Math.round(timeLocationData[time][location].average * 10) / 10);
      } else {
        row.push(null);
      }
    }
    zValues.push(row);
  }
  
  // 创建热图
  const heatmapData = [{
    z: zValues,
    x: locationLabels,
    y: timeLabels,
    type: 'heatmap',
    colorscale: 'RdYlGn',
    zmin: 1,
    zmax: 5,
    showscale: true,
    colorbar: {
      title: 'Efficiency',
      tickvals: [1, 2, 3, 4, 5],
      ticktext: ['1 - Poor', '2', '3', '4', '5 - Excellent']
    }
  }];
  
  const layout = {
    title: 'Study Efficiency by Time and Location',
    xaxis: {
      title: 'Location'
    },
    yaxis: {
      title: 'Time of Day'
    },
    margin: {
      l: 130,
      r: 20,
      b: 100,
      t: 50,
      pad: 4
    }
  };
  
  Plotly.newPlot('timeLocationHeatmap', heatmapData, layout);
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
