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

  // Check which page we're on and initialize appropriate functionality
  if (currentPath.includes("index.html") || currentPath.endsWith("/")) {
    initHomePage();
  } else if (currentPath.includes("upload.html")) {
    initUploadPage();
  } else if (currentPath.includes("visualize.html")) {
    initVisualizePage();
  } else if (currentPath.includes("share.html")) {
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

  // For the first presentation, charts will be placeholders
  // In the future, this would initialize Chart.js or similar library
  // for data visualization
}

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
