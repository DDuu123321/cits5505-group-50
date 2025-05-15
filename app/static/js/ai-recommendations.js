/**
 * AI Recommendations - Extended functionality module
 * Used to analyze study data and generate personalized learning recommendations
 */

/**
 * Get study data for the specified date range
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of study session data
 */
function buildTimeLocationEfficiencyMap(sessions) {
  const timeSlots = [
    { name: "Early Morning", start: 5, end: 9 },
    { name: "Morning", start: 9, end: 12 },
    { name: "Noon", start: 12, end: 14 },
    { name: "Afternoon", start: 14, end: 17 },
    { name: "Evening", start: 17, end: 20 },
    { name: "Night", start: 20, end: 24 },
    { name: "Late Night", start: 0, end: 5 }
  ];

  const map = {};

  timeSlots.forEach(slot => {
    map[slot.name] = {};
  });

  sessions.forEach(session => {
    const hour = session.hour_of_day;
    const efficiency = parseFloat(session.efficiency);
    const location = session.location?.trim();

    if (isNaN(hour) || isNaN(efficiency) || !location) return;

    const slot = timeSlots.find(s => {
      return s.start < s.end
        ? hour >= s.start && hour < s.end
        : hour >= s.start || hour < s.end;
    });

    if (!slot) return;

    const key = slot.name;

    if (!map[key][location]) {
      map[key][location] = {
        sum: 0,
        count: 0,
        values: []
      };
    }

    map[key][location].sum += efficiency;
    map[key][location].count += 1;
    map[key][location].values.push(efficiency);
  });

  return map;
}



/**
 * Get AI recommendations
 * @param {Array} sessions - Array of study session data
 * @returns {Promise<Object>} Recommendation results
 */
async function getAIRecommendations(sessions) {
  // Validate data
  if (!sessions || sessions.length === 0) {
    return {
      success: false,
      message: "No study data available. Please select a date range with study sessions first."
    };
  }

  // Collect subject distribution data
  const subjectDistribution = {};
  sessions.forEach((session) => {
    const subject = session.subject;
    const minutes = session.minutes || parseInt(session.duration);
    
    if (subjectDistribution[subject]) {
      subjectDistribution[subject] += minutes;
    } else {
      subjectDistribution[subject] = minutes;
    }
  });

  // ✅ 使用你定义的逻辑构造时间-地点-效率聚合图
  const timeLocationMap = buildTimeLocationEfficiencyMap(sessions);
  console.log("📊 Time × Location Efficiency Map (for AI):", timeLocationMap);

  try {
    const response = await fetch("/api/ai-recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken()
      },
      body: JSON.stringify({
        subjectDistribution,
        timeLocationMap  // ✅ 用新的 map 替代原 dataPoints 等字段
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    return {
      success: false,
      message: error.message || "Failed to get AI recommendations"
    };
  }
}


/**
 * Display AI recommendations with typewriter effect
 * @param {Array} recommendations - Array of recommendation data
 */
function displayAIRecommendations(recommendations) {
  const container = document.getElementById("aiRecommendationsContent");
  container.innerHTML = ''; // Clear content
  
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
    // 创建全部推荐内容的HTML字符串，一次性插入
  let allRecommendationsHTML = `
    <div class="pb-4">
      <h6 class="border-bottom pb-2 mb-3">Based on your study data, here are some personalized recommendations:</h6>
      <div id="recommendationsList">
  `;
  
  // 添加所有推荐（不使用延迟）
  recommendations.forEach((rec, index) => {
    allRecommendationsHTML += `
      <div class="recommendation-item mb-3 p-3 bg-white rounded shadow-sm" id="rec-item-${index}">
        <div class="d-flex align-items-start">
          <div class="recommendation-icon flex-shrink-0">
            <i class="fas ${rec.icon || 'fa-lightbulb'}"></i>
          </div>
          <div class="flex-grow-1 ms-3">
            <h6 class="fw-bold mb-1">${rec.title}</h6>
            <p class="mb-0" id="rec-desc-${index}"></p>
          </div>
        </div>
      </div>
    `;
  });
  
  allRecommendationsHTML += `
      </div>
    </div>
  `;
    // 一次性插入所有内容
  container.innerHTML = allRecommendationsHTML;
  
  // 滚动到顶部
  container.scrollTop = 0;
  
  // 逐个为每条推荐添加打字效果
  recommendations.forEach((rec, index) => {
    const descElement = document.getElementById(`rec-desc-${index}`);
    const recItem = document.getElementById(`rec-item-${index}`);
    
    // 为了效果，给元素添加初始透明效果
    if (recItem) {
      recItem.style.opacity = "0";
      recItem.style.transform = "translateY(20px)";
      recItem.style.transition = "all 0.5s ease";
    }
    
    // 延迟显示每条推荐
    setTimeout(() => {
      if (recItem) {
        recItem.style.opacity = "1";
        recItem.style.transform = "translateY(0)";
      }
      
      if (descElement) {
        typeWriter(descElement, rec.description, 15);
      }
    }, 400 * (index + 1));
  });
}
