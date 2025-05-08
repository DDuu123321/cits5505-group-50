/**
 * StudyTime Tracker - Main JavaScript
 * This file contains the core JavaScript functionality for the StudyTime Tracker application.
 */

// ============================================================================
// 1. Global Initialization & Page Routing
// ============================================================================

// Global variables for the main study timer (for upload.html)
let timerIntervalMain; // Timer interval ID
let secondsMain = 0; // Seconds elapsed on the timer
let isRunningMain = false; // Whether the timer is currently running
let interruptionsMain = 0; // Number of interruptions in the current timing session
let actualSessionStartTime; // Date object, records the actual start time of the session

document.addEventListener("DOMContentLoaded", function () {
  // Initialize functionality for the current page
  initCurrentPage();

  // Perform common initialization if corresponding elements exist on the page
  // (These functions will internally check if elements exist)
  setupAuthTabs(); // For login/registration tabs on index.html
  initTimerControls(); // For the study timer on upload.html
});

/**
 * Determine the active page and initialize corresponding components.
 */
function initCurrentPage() {
  const currentPath = window.location.pathname; // Get current URL path

  // Determine current page based on path and call corresponding initialization function
  if (
    currentPath.includes("index") ||
    currentPath === "/" ||
    currentPath.endsWith("/app/")
  ) {
    // Assuming /app/ is also a form of home page
    initHomePage();
  } else if (currentPath.includes("upload")) {
    initUploadPage();
  } else if (currentPath.includes("visualize")) {
    initVisualizePage();
  } else if (currentPath.includes("share")) {
    initSharePage();
  }
  // Add conditions for other pages if specific JS is needed
}

// ============================================================================
// 2. Home Page Specific JS
//    - Login/Registration tab interaction
// ============================================================================

function initHomePage() {
  console.log("Home page JS initialized");
  // Login/registration form submission is primarily handled by Flask-WTF on the backend.
  // setupAuthTabs() will handle the visual effects of the tabs.
}

/**
 * Set up login/registration tab interaction on index.html.
 */
function setupAuthTabs() {
  const loginTab = document.getElementById("login-tab"); // Get login tab element
  const registerTab = document.getElementById("register-tab"); // Get registration tab element

  if (loginTab && registerTab) {
    // Ensure elements exist
    // Bootstrap Tab event listeners
    loginTab.addEventListener("shown.bs.tab", function () {
      // Adjust text color when tab is activated (assuming active is not white, inactive is white)
      loginTab.classList.remove("text-white");
      registerTab.classList.add("text-white");
    });

    registerTab.addEventListener("shown.bs.tab", function () {
      registerTab.classList.remove("text-white");
      loginTab.classList.add("text-white");
    });

    // Client-side handling of registration form password confirmation (as auxiliary validation)
    const registerForm = document.getElementById("registerForm"); // Ensure this ID matches in index.html
    if (registerForm) {
      registerForm.addEventListener("submit", function (e) {
        const passwordInput = registerForm.querySelector("#registerPassword"); // Ensure ID matches
        const confirmPasswordInput = registerForm.querySelector(
          "#registerConfirmPassword"
        ); // Ensure ID matches

        if (passwordInput && confirmPasswordInput) {
          if (passwordInput.value !== confirmPasswordInput.value) {
            e.preventDefault(); // Prevent form submission
            alert("The passwords entered do not match!");
            confirmPasswordInput.focus(); // Let user re-enter confirmation password
          }
        }
      });
    }
  }
}
