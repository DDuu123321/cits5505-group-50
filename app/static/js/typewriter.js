/**
 * Typewriter Effect JavaScript Implementation
 * Used to create character-by-character typing animation in the user interface
 */

/**
 * Create character-by-character typing effect in a specified element
 * @param {HTMLElement} element - Element to add the typing effect to
 * @param {string} text - Text content to display
 * @param {number} speed - Delay for each character (milliseconds)
 * @param {Function} callback - Callback function to execute after typing is complete
 */
function typeWriter(element, text, speed = 25, callback) {
  let i = 0;
  element.innerHTML = ''; // Clear element content
  
  // If text is empty, execute callback directly
  if (!text || text.length === 0) {
    if (callback && typeof callback === 'function') {
      callback();
    }
    return;
  }
  
  // Add cursor style
  element.classList.add('typewriter');
  
  // Typing effect function
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      // Remove cursor style after completion
      element.classList.remove('typewriter');
      // Execute callback function (if provided)
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  }
  
  // Start typing effect
  type();
}

// Add typewriter cursor CSS style
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    
    .typewriter::after {
      content: '|';
      display: inline-block;
      margin-left: 2px;
      animation: blink 0.7s infinite;
      color: #0d6efd;
    }
  `;
  document.head.appendChild(style);
});