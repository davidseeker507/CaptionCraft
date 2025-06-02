// ===============================
// ✍️ Typing animation
// ===============================
const phrases = [
  "Turn your video into text...",
  "Auto subtitles in seconds...",
  "AI-powered captioning...",
  "Effortless video transcription...",
  "Transform speech to text...",
  "Instant captions for your videos...",
  "Create subtitles with AI...",
  "Video captioning made easy...",
  "AI subtitles for your content...",
];

let currentPhraseIndex = 0;
let currentCharIndex = 0;
let isDeleting = false;
const typingElement = document.getElementById("typing-text");

function type() {
  const currentPhrase = phrases[currentPhraseIndex];
  typingElement.textContent = currentPhrase.substring(0, currentCharIndex);
  currentCharIndex += isDeleting ? -1 : 1;

  if (!isDeleting && currentCharIndex === currentPhrase.length) {
    setTimeout(() => (isDeleting = true), 1000);
  } else if (isDeleting && currentCharIndex === 0) {
    isDeleting = false;
    currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
  }

  setTimeout(type, isDeleting ? 50 : 100);
}

type();


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
document.getElementById("generate-button").addEventListener("click", () => {
  //  If there's still an error showing, cancel everything
  if (errorMessage.textContent !== "") return;

  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");

  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "";

  let progress = 0;

  const interval = setInterval(() => {
    if (progress >= 100) {
      clearInterval(interval);
      confetti(); //  Confetti party!
      progressText.textContent = "🎉 Done!";
      progressText.style.color = "lightgreen";
    } else {
      progress++;
      progressBar.style.width = progress + "%";
      progressText.textContent = progress + "%";
    }
  }, 100);
});




