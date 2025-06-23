// File handling module
const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/ogg",
  "video/x-matroska",
  "video/x-msvideo",
];

// Set API_BASE depending on environment
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://your-backend.onrender.com'; // <-- replace with your actual deployed backend URL

class FileHandler {
  constructor() {
    this.fileInput = document.getElementById("file-input");
    this.errorMessage = document.getElementById("error-message");
    this.generateButton = document.getElementById("generate-button");
    this.progressContainer = document.getElementById("progress-container");
    this.progressBar = document.getElementById("progress-bar");
    this.progressText = document.getElementById("progress-text");

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.fileInput.addEventListener("change", this.handleFileSelect.bind(this));
    this.generateButton.addEventListener("click", this.handleFileUpload.bind(this));
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.showError("❌ Invalid file type. Please upload a supported video format.");
      this.generateButton.style.display = "none";
    } else {
      this.clearError();
      this.generateButton.style.display = "block";
      console.log(`✅ Selected file: ${file.name}`);
    }
  }

  async handleFileUpload() {
    if (this.errorMessage.textContent !== "") return;

    const file = this.fileInput.files[0];
    if (!file) {
      this.showError("❌ Please select a file first.");
      return;
    }

    this.showProgress("Uploading video...");
    try {
      // 1. Upload video
      const formData = new FormData();
      formData.append('video', file);

      const uploadResponse = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Upload successful:', uploadData);
      this.updateProgress(25, "Extracting audio...");

      // 2. Extract audio
      const extractResponse = await fetch(`${API_BASE}/extract-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: uploadData.path })
      });
      if (!extractResponse.ok) {
        throw new Error(`Audio extraction failed: ${extractResponse.statusText}`);
      }
      const extractData = await extractResponse.json();
      console.log('Audio extracted:', extractData);
      this.updateProgress(50, "Transcribing audio...");

      // 3. Transcribe audio
      const transcribeResponse = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioFilePath: extractData.audioFilePath })
      });
      if (!transcribeResponse.ok) {
        throw new Error(`Transcription failed: ${transcribeResponse.statusText}`);
      }
      const transcribeData = await transcribeResponse.json();
      console.log('Transcription:', transcribeData);
      this.updateProgress(75, "Generating SRT file...");

      // 4. Download SRT
      await this.downloadSrt(transcribeData.segments, extractData.audioFilePath);
      this.updateProgress(100, "🎉 Done! SRT downloaded.");
      this.progressText.style.color = "lightgreen";
      if (typeof confetti === 'function') {
        confetti();
      }

    } catch (error) {
      console.error('Error:', error);
      this.showError(`❌ ${error.message}`);
      this.hideProgress();
    }
  }

  async downloadSrt(segments, audioFilePath) {
    const response = await fetch(`${API_BASE}/srt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ segments, audioFilePath })
    });

    if (!response.ok) {
      throw new Error('Failed to generate SRT');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.srt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  showError(message) {
    this.errorMessage.textContent = message;
  }

  clearError() {
    this.errorMessage.textContent = "";
  }

  showProgress(text = "") {
    this.progressContainer.style.display = "block";
    this.progressBar.style.width = "0%";
    this.progressText.textContent = text;
    this.progressText.style.color = "";
  }

  updateProgress(percent, text = "") {
    this.progressBar.style.width = percent + "%";
    this.progressText.textContent = text;
  }

  hideProgress() {
    this.progressContainer.style.display = "none";
  }

  showSuccess() {
    this.progressBar.style.width = "100%";
    this.progressText.textContent = "🎉 Done!";
    this.progressText.style.color = "lightgreen";
    if (typeof confetti === 'function') {
      confetti();
    }
  }
}

export default FileHandler; 