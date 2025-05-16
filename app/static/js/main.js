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

  // Remove original form handling code because we now use Flask form submission
  // const loginForm = document.getElementById("loginForm");
  // if (loginForm) {
  //   loginForm.addEventListener("submit", function (e) {
  //     e.preventDefault();
  //   });
  // }
  
  // Other home page initialization code...
}

/**
 * Initialize upload page components
 */
function initUploadPage() {
  console.log("Upload page initialized");

  // Define global timer variables (changed to local variables, not affecting external variables with the same name)
  let timerInterval = null;
  let seconds = 0;
  let efficiency = 5;  // Default efficiency is 5 (highest)
  let timerRunning = false;
  let timerPaused = false;

  // Get DOM elements
  const startBtn = document.getElementById('startTimer');
  const pauseBtn = document.getElementById('pauseTimer');
  const resetBtn = document.getElementById('resetTimer');
  const saveBtn = document.getElementById('saveSession');
  const timerDisplay = document.getElementById('timerDisplay');
  const efficiencyRating = document.getElementById('efficiencyRating');
  const efficiencyStars = document.querySelectorAll('.efficiency-star');

  if (startBtn && pauseBtn && resetBtn && saveBtn) {
    console.log("Timer controls found, adding event listeners");

    // Start timer button
    startBtn.addEventListener('click', function() {
      if (!timerRunning) {
        startTimer();
      }
    });

    // Pause button
    pauseBtn.addEventListener('click', function() {
      if (timerRunning) {
        pauseTimer();
      } else if (timerPaused) {
        resumeTimer();
      }
    });

    // Reset button
    resetBtn.addEventListener('click', function() {
      resetTimer();
    });

    // Save session button
    saveBtn.addEventListener('click', function() {
      saveStudySession();
    });
    
    // Add efficiency star rating event listeners
    if (efficiencyStars) {
      const ratingOptions = document.querySelectorAll('.rating-option');
      
      // Add event listeners for each rating option
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
        // If no rating option container found, use the star elements directly
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

  // Zero padding function
  function padNumber(num) {
    return String(num).padStart(2, '0');
  }
  
  // Start timer
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
    
    // Hide efficiency rating (only shown before pause or save)
    if (efficiencyRating) efficiencyRating.style.display = 'none';

    // Start the timer
    timerInterval = setInterval(updateTimer, 1000);
  }

  // Pause timer
  function pauseTimer() {
    console.log("Pausing timer");
    timerRunning = false;
    timerPaused = true;

    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-play me-2"></i>Resume';
    }
    
    // Show efficiency rating
    if (efficiencyRating) efficiencyRating.style.display = 'block';
    
    // Highlight current efficiency rating
    highlightStars(efficiency);

    clearInterval(timerInterval);
  }

  // Resume timer
  function resumeTimer() {
    console.log("Resuming timer");
    timerRunning = true;
    timerPaused = false;

    if (pauseBtn) {
      pauseBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
    }
    
    // Hide efficiency rating
    if (efficiencyRating) efficiencyRating.style.display = 'none';

    // Continue timer
    timerInterval = setInterval(updateTimer, 1000);
  }

  // Reset timer
  function resetTimer() {
    console.log("Resetting timer");
    timerRunning = false;
    timerPaused = false;
    seconds = 0;
    efficiency = 5;  // Reset efficiency to default value

    // Clear timer
    clearInterval(timerInterval);

    // Reset UI elements
    if (timerDisplay) timerDisplay.textContent = "00:00:00";
    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) {
      pauseBtn.disabled = true;
      pauseBtn.innerHTML = '<i class="fas fa-pause me-2"></i>Pause';
    }
    if (resetBtn) resetBtn.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    
    // Hide efficiency rating
    if (efficiencyRating) efficiencyRating.style.display = 'none';
    
    // Reset star display
    highlightStars(0);
  }

  // Update timer display
  function updateTimer() {
    seconds++;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (timerDisplay) {
      timerDisplay.textContent = `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(secs)}`;
    }
  }
  
  // Set efficiency rating
  function setEfficiencyRating(value) {
    console.log(`Setting efficiency rating to ${value}`);
    efficiency = value;
    highlightStars(value);
    
    // Show notification
    const ratingLabels = ["", "Poor", "Below Average", "Average", "Good", "Excellent"];
    if (value >= 1 && value <= 5) {
      showNotification('Efficiency Rating', `Set to: ${ratingLabels[value]}`, 'info');
    }
  }
  
  // Highlight stars
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
          
          // Add special styling for current selected rating
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

  // Save study session
  function saveStudySession() {
    // Prevent duplicate submissions
    if (saveBtn.disabled) {
      console.log("Already saving, ignoring duplicate submit");
      return;
    }
    
    const subjectSelect = document.getElementById('subjectSelect');
    const locationInput = document.getElementById('location');
    const timerDisplay = document.getElementById('timerDisplay');

    // Form validation
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

    // Check if timer data exists
    if (seconds <= 0) {
      showNotification('Error', 'You need to study for at least a few seconds', 'danger');
      return;
    }

    // Calculate study duration
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const duration = `${hours}h ${minutes}m`;

    console.log(`Saving session: ${subjectSelect.value} at ${locationInput.value} for ${duration} with efficiency ${efficiency}`);

    // Prepare data object
    const data = {
      subject_id: subjectSelect.value,
      location: locationInput.value,
      duration: duration,
      efficiency: efficiency,
      notes: document.querySelector('textarea')?.value || ""
    };

    // Get CSRF token
    const csrfToken = document.querySelector('input[name="csrf_token"]').value;

    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

    // Send AJAX request
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
      
      // Restore button state
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Session';
      
      // Show success notification
      showNotification('Success', 'Study session saved successfully!', 'success');
      
      // Reset timer
      resetTimer();
      
      // Add animation effect
      const timerContainer = document.querySelector('.timer-container');
      if (timerContainer) {
        timerContainer.classList.add('border', 'border-success');
        setTimeout(() => {
          timerContainer.classList.remove('border', 'border-success');
        }, 1500);
      }
      
      // Reload page to display new record
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    })
    .catch(error => {
      console.error('Error:', error);
      
      // Restore button state
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Save Session';
      
      // Show error notification
      showNotification('Error', `Failed to save study session: ${error.message}`, 'danger');
    });
  }
}

// Show notification message
function showNotification(title, message, type = 'info') {
  // Check if notification container already exists, if not create it
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Create notification element
  const toastId = `toast-${Date.now()}`;
  const toastEl = document.createElement('div');
  toastEl.className = `toast show border-0`;
  toastEl.id = toastId;
  
  // Set background color
  let bgColor = 'bg-info';
  if (type === 'success') bgColor = 'bg-success';
  if (type === 'danger') bgColor = 'bg-danger';
  if (type === 'warning') bgColor = 'bg-warning';
  
  // Set icon
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'danger') icon = 'exclamation-circle';
  if (type === 'warning') icon = 'exclamation-triangle';
  
  // Create notification content
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
  
  // Add to notification container
  toastContainer.appendChild(toastEl);
  
  // Register close event
  const closeBtn = toastEl.querySelector('.btn-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toastEl.remove();
    });
  }
  
  // Auto-close (after 3 seconds)
  setTimeout(() => {
    if (toastEl.parentNode) {
      toastEl.remove();
    }
  }, 3000);
}

// Add notification styles
function addNotificationStyles() {
  // Add notification styles
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

// Add notification styles when page loads
document.addEventListener('DOMContentLoaded', function() {
  addNotificationStyles();
  // Other initialization code...
});




/**
 * Initialize visualization page components
 */
function initVisualizePage() {
  
  // Set default date range (last 30 days)
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(today.getDate() - 30);
  
  const dateFromInput = document.getElementById("dateFrom");
  const dateToInput = document.getElementById("dateTo");
  const filterApplyBtn = document.getElementById("filterApply");
  
  if (dateFromInput && dateToInput) {
    // Set default dates
    dateFromInput.value = oneMonthAgo.toISOString().split("T")[0];
    dateToInput.value = today.toISOString().split("T")[0];
    
    // Automatically fetch initial data when page loads
    fetchAndUpdateAnalytics(dateFromInput.value, dateToInput.value);
  }
  
  // Apply filter button event listener
  if (filterApplyBtn) {
    filterApplyBtn.addEventListener("click", function() {
      const dateFrom = dateFromInput.value;
      const dateTo = dateToInput.value;
      
      // Add loading state
      /*
      document.querySelectorAll(".chart-placeholder").forEach(el => {
        el.innerHTML = '<div class="d-flex justify-content-center align-items-center h-100"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
      }); */
      
      // Fetch and update data
      fetchAndUpdateAnalytics(dateFrom, dateTo);
    });
  }
  
  // AI recommendation button event listener
  const aiRecommendBtn = document.getElementById("getAiRecommendations");
  if (aiRecommendBtn) {
    // First remove all existing click event handlers to prevent duplicate bindings
    aiRecommendBtn.replaceWith(aiRecommendBtn.cloneNode(true));
    
    // Get the button again (because cloneNode removes all event listeners)
    const newAiRecommendBtn = document.getElementById("getAiRecommendations");
    
    // Add new event handler
    newAiRecommendBtn.addEventListener("click", async function() {
      // Get current filter conditions
      const dateFrom = dateFromInput.value;
      const dateTo = dateToInput.value;
      
      if (!dateFrom || !dateTo) {
        showNotification('Error', 'Please select a date range and apply filters first to load your study data.', 'danger');
        return;
      }
      
      try {
        // Show loading indicator
        document.getElementById("aiRecommendationsContent").classList.add("d-none");
        document.getElementById("aiLoadingIndicator").classList.remove("d-none");
        
        // Get data and generate AI recommendations
        const sessions = window.filteredSessionsForAI || [];
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
        
        // Get AI recommendation results
        const result = await getAIRecommendations(sessions);
        
        // Hide loading indicator
        document.getElementById("aiLoadingIndicator").classList.add("d-none");
        document.getElementById("aiRecommendationsContent").classList.remove("d-none");
        
        // Show recommendation results
        if (result.success === false) {
          document.getElementById("aiRecommendationsContent").innerHTML = `
            <div class="alert alert-warning">
              <i class="fas fa-exclamation-circle me-2"></i>
              ${result.message || "Couldn't generate recommendations at this time."}
            </div>
          `;
        } else {
          // Use typewriter effect to display recommendations
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
  
  // Data export functionality
  const exportDataBtn = document.querySelector('.btn-outline-primary');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', function() {
      exportStudyData();
    });
  }
}

// Get CSRF token
function getCSRFToken() {
  const tokenElement = document.querySelector('input[name="csrf_token"]');
  return tokenElement ? tokenElement.value : '';
}

// Fetch data and update all charts
function fetchAndUpdateAnalytics(dateFrom, dateTo) {
  // 1. Show generic loading state (applied to all .chart-placeholder)
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
  
  // (Code for getting totalStudyTimeEl and other elements can be retained if main.js needs to operate on them directly in the future)
  // const totalStudyTimeEl = document.getElementById("totalStudyTime");
  // ...

  fetch('/api/analytics-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken() // Make sure getCSRFToken is defined
    },
    body: JSON.stringify({ dateFrom, dateTo })
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
    console.log('API response data:', data);
    
    if (data.sessions && data.sessions.length > 0) {
      // Valid data, directly call update functions
      updateStatsCards(data.sessions);
      updateStudyBarChart(data.sessions); // Direct call
      updateSubjectPieChart(data.sessions); // If implemented, also direct call
      updateEfficiencyTimeChart(data.sessions);
      updateLocationEfficiencyChart(data.sessions);
      updateTimeLocation3DChart(data.sessions);
      window.filteredSessionsForAI = data.sessions; // Store data in global variable for later AI recommendation use
      // ... Other chart functions
      
      if (typeof updateDataTable === 'function') {
        updateDataTable(data.sessions);
      }
    } else {
      // No data case
      updateStatsCards([]); // Update stat cards to no-data state ("--")
      updateStudyBarChart([]); // Update bar chart to no-data state (charts.js should handle this case)
      updateSubjectPieChart([]);
      updateEfficiencyTimeChart([]);
      updateLocationEfficiencyChart([]);
      updateTimeLocation3DChart([]);
      // ...

      // For .chart-placeholder elements not handled by specific chart update functions, we can set generic no-data message
      
      /*document.querySelectorAll(".chart-placeholder").forEach(el => {
        // No longer checking specific ID
        el.innerHTML = `...`;
      }); */
      if (typeof updateDataTable === 'function') {
        updateDataTable([]);
      }
    }
  })
  .catch(error => {
    console.error('Error fetching analytics data:', error);
    
    updateStatsCards([]); // Update stat cards to error state ("--")
    updateStudyBarChart([]); // Update bar chart to error state
    // updateSubjectPieChart([]);
    // ...

  
    if (typeof updateDataTable === 'function') {
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
// Chart-related Functions
// =================================================================

// Process date formatting
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

// Update AI recommendations
function updateAIRecommendations(recommendations) {
  const container = document.getElementById('aiRecommendationsContent');
  
  // Completely reset container content and state
  container.scrollTop = 0;
  container.innerHTML = '';
  
  // If no recommendations, display info message
  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-3x text-secondary mb-3"></i>
        <p class="text-muted">Not enough data to generate recommendations.</p>
        <small class="text-muted">Come back after studying for a while!</small>
      </div>
    `;
    return;
  }
  
  // Create a container for all content
  const mainContent = document.createElement('div');
  
  // Add fixed title to explain the content
  const titleElem = document.createElement('div');
  titleElem.className = 'mb-3';
  titleElem.innerHTML = `<p>Based on your study data, here are some personalized recommendations:</p>`;
  mainContent.appendChild(titleElem);
  
  // Build recommendation cards
  recommendations.forEach((rec, index) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'mb-3';
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
  
  // Add content to container
  container.appendChild(mainContent);
  
  // Make sure container scrolls to top
  setTimeout(() => {
    container.scrollTop = 0;
  }, 10);
}

// Update data table
function updateDataTable(sessions) {
  const dataTableContainer = document.querySelector('.data-table-container');
  if (!dataTableContainer) return;
  
  // Sort sessions by date in reverse order
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Generate table HTML
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
    // Star rating HTML
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

// Export study data
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
    
    // Prepare CSV data
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Subject,Start Time,End Time,Duration,Location,Efficiency,Notes\n";
    
    data.sessions.forEach(session => {
      csvContent += `${session.date},${session.subject},${session.start_time},${session.end_time},${session.duration},"${session.location}",${session.efficiency},"${session.notes || ''}"\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `study_data_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up DOM
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
