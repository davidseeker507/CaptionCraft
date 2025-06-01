    // Typing animation
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
          setTimeout(() => isDeleting = true, 1000);
        } else if (isDeleting && currentCharIndex === 0) {
          isDeleting = false;
          currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        }
    
        setTimeout(type, isDeleting ? 50 : 100);
      }
    
      type();
    
      // File input validation
      document.getElementById("file-input").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const allowedTypes = ["video/mp4", "video/quicktime"];
          if (!allowedTypes.includes(file.type)) {
            alert("Invalid file type. Please upload a video file.");
          } else {
            alert(`Selected file: ${file.name}`);
          }
        }
      });
    
      // Button click: show progress + confetti
      document.getElementById("generate-button").addEventListener("click", () => {
        const progressContainer = document.getElementById("progress-container");
        const progressBar = document.getElementById("progress-bar");
        const progressText = document.getElementById("progress-text");
    
        // ✅ Show bar, reset values
        progressContainer.style.display = "block";
        progressBar.style.width = "0%";
        progressText.textContent = "";
    
        let progress = 0;
    
        const interval = setInterval(() => {
          if (progress >= 100) {
            clearInterval(interval);
            confetti(); // 🎉 celebrate at 100%
          } else {
            progress++;
            progressBar.style.width = progress + "%"; //  progress is the number and it makes it so that it corresponds to the number that is displaying//
            progressText.textContent = progress + "%";
          }
        }, 100);
      });