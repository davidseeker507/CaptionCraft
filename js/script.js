// Main application module
import FileHandler from './fileHandler.js';
import { auth } from './auth.js';

class App {
  constructor() {
    this.initializeComponents();
    this.setupTypingAnimation();
  }

  initializeComponents() {
    // Initialize file handling
    this.fileHandler = new FileHandler();
  }

  setupTypingAnimation() {
    const typingText = document.getElementById('typing-text');
    const phrases = [
      'Convert videos to text',
      'Generate accurate captions',
      'Export to any format',
      'Powered by AI'
    ];
    let currentPhrase = 0;
    let currentChar = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    const type = () => {
      const currentText = phrases[currentPhrase];
      
      if (isDeleting) {
        typingText.textContent = currentText.substring(0, currentChar - 1);
        currentChar--;
        typingSpeed = 50;
      } else {
        typingText.textContent = currentText.substring(0, currentChar + 1);
        currentChar++;
        typingSpeed = 100;
      }

      if (!isDeleting && currentChar === currentText.length) {
        isDeleting = true;
        typingSpeed = 2000; // Pause at end
      } else if (isDeleting && currentChar === 0) {
        isDeleting = false;
        currentPhrase = (currentPhrase + 1) % phrases.length;
        typingSpeed = 500; // Pause before typing
      }

      setTimeout(type, typingSpeed);
    };

    // Start the typing animation
    type();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});




