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
async function fetchFilteredData(dateFrom, dateTo) {
  try {
    const response = await fetch('/api/analytics-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken()
      },
      body: JSON.stringify({ dateFrom, dateTo })
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data.sessions || [];
  } catch (error) {
    console.error('Error fetching filtered data:', error);
    throw error;
  }
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

  // Collect time-location-efficiency data
  const timeSlots = {
    "Late Night": [0, 360],     // 00:00 - 06:00
    "Early Morning": [360, 600], // 06:00 - 10:00
    "Morning": [600, 720],       // 10:00 - 12:00
    "Afternoon": [720, 960],     // 12:00 - 16:00
    "Evening": [960, 1140],      // 16:00 - 19:00
    "Night": [1140, 1380]        // 19:00 - 23:00
  };

  // Build data points
  const xLabels = Object.keys(timeSlots);
  const yLabels = [...new Set(sessions.map(s => s.location))];
  const dataPoints = [];

  // Collect data points
  sessions.forEach(session => {
    try {
      // Time processing
      const timeComponents = session.start_time.split(":").map(Number);
      if (timeComponents.length < 2) return;
      
      const [hour, minute] = timeComponents;
      const totalMinutes = hour * 60 + minute;
      
      // Determine time slot
      let timeSlot = xLabels.find(label => {
        const [min, max] = timeSlots[label];
        return totalMinutes >= min && totalMinutes < max;
      });
      
      if (!timeSlot) return;
      
      // Add data point
      dataPoints.push({
        timeSlot: timeSlot,
        location: session.location,
        efficiency: session.efficiency,
        date: session.date,
        duration: session.minutes || parseInt(session.duration)
      });
    } catch (e) {
      console.warn('Error processing session for AI recommendation:', e);
    }
  });

  try {
    // Send data to backend API
    const response = await fetch("/api/ai-recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken()
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
  
  // Create title element
  const title = document.createElement('h6');
  title.className = 'border-bottom pb-2 mb-3';
  container.appendChild(title);
  
  // Create list container
  const list = document.createElement('ul');
  list.className = 'list-group list-group-flush';
  container.appendChild(list);
  
  // Use typewriter effect for title
  typeWriter(title, 'Based on your study data, here are some personalized recommendations:', 30);
  
  // Add each recommendation with delay and typewriter effect
  recommendations.forEach((rec, index) => {
    setTimeout(() => {
      // Create list item
      const item = document.createElement('li');
      item.className = 'list-group-item border-0 bg-transparent px-0 py-3';
      list.appendChild(item);
      
      // Create card container
      const card = document.createElement('div');
      card.className = 'card border-0 shadow-sm h-100';
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.5s, transform 0.5s';
      item.appendChild(card);
      
      // Create card content
      const cardBody = document.createElement('div');
      cardBody.className = 'card-body';
      card.appendChild(cardBody);
      
      // Create content layout
      const flex = document.createElement('div');
      flex.className = 'd-flex';
      cardBody.appendChild(flex);
      
      // Create icon container
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'flex-shrink-0';
      flex.appendChild(iconWrapper);
      
      // Add icon
      const icon = document.createElement('i');
      icon.className = `fas ${rec.icon} fa-2x text-primary`;
      iconWrapper.appendChild(icon);
      
      // Create text container
      const textWrapper = document.createElement('div');
      textWrapper.className = 'flex-grow-1 ms-3';
      flex.appendChild(textWrapper);
      
      // Add title
      const heading = document.createElement('h6');
      heading.className = 'fw-bold mb-1';
      heading.textContent = rec.title;
      textWrapper.appendChild(heading);
      
      // Add description
      const description = document.createElement('p');
      description.className = 'mb-0';
      textWrapper.appendChild(description);
      
      // Show card and start typewriter effect
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
        
        // Use typewriter effect for description text
        typeWriter(description, rec.description, 15);
      }, 100);
    }, 800 * (index + 1)); // Delay each recommendation
  });
}