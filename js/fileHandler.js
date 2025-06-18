// File handling module
const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/ogg",
  "video/x-matroska",
  "video/x-msvideo",
];

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

    this.showProgress();
    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      this.showSuccess();

    } catch (error) {
      console.error('Upload error:', error);
      this.showError(`❌ Upload failed: ${error.message}`);
      this.hideProgress();
    }
  }

  showError(message) {
    this.errorMessage.textContent = message;
  }

  clearError() {
    this.errorMessage.textContent = "";
  }

  showProgress() {
    this.progressContainer.style.display = "block";
    this.progressBar.style.width = "0%";
    this.progressText.textContent = "0%";
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