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


// ===============================
// 📂 File input validation
// ===============================
const fileInput = document.getElementById("file-input");
const errorMessage = document.getElementById("error-message");
const generateButton = document.getElementById("generate-button");

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  const allowedTypes = [
    "video/mp4",
    "video/quicktime",
    "video/webm",
    "video/ogg",
    "video/x-matroska",
    "video/x-msvideo",
  ];

  if (file) {
    if (!allowedTypes.includes(file.type)) {
      errorMessage.textContent = "❌ Invalid file type. Please upload a supported video format.";
      generateButton.style.display = "none"; 
    } else {
      errorMessage.textContent = ""; // Clear error if valid
      generateButton.style.display = "block"; 
      console.log(`✅ Selected file: ${file.name}`);
    }
  }
});


// ===============================
// 
// ===============================
document.getElementById("generate-button").addEventListener("click", async () => {
  // If there's still an error showing, cancel everything
  if (errorMessage.textContent !== "") return;

  const file = fileInput.files[0];
  if (!file) {
    errorMessage.textContent = "❌ Please select a file first.";
    return;
  }

  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "0%";

  try {
    const formData = new FormData();
    formData.append('video', file);

    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      // No need to set Content-Type header, browser will set it automatically with boundary
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Upload successful:', data);

    // Show success
    progressBar.style.width = "100%";
    progressText.textContent = "🎉 Done!";
    progressText.style.color = "lightgreen";
    confetti(); // Confetti party!

  } catch (error) {
    console.error('Upload error:', error);
    errorMessage.textContent = `❌ Upload failed: ${error.message}`;
    progressContainer.style.display = "none";
  }
});




