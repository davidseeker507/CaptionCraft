// Navigation module
import { auth } from './auth.js';

class Navigation {
  constructor() {
    this.sidebarActive = document.getElementById('sidebar-active');
    this.signupButton = document.getElementById('Signup');
    this.initializeNavigation();
  }

  initializeNavigation() {
    this.updateSignupButton();
    this.setupEventListeners();
  }

  updateSignupButton() {
    if (auth.isLoggedIn()) {
      if (this.signupButton) {
        this.signupButton.textContent = 'Logout';
        this.signupButton.onclick = () => this.handleLogout();
      }
    } else {
      if (this.signupButton) {
        this.signupButton.textContent = 'Sign Up - It\'s Free';
        this.signupButton.onclick = null;
      }
    }
  }

  setupEventListeners() {
    // Close sidebar when clicking outside
    document.addEventListener('click', (event) => {
      if (this.sidebarActive && this.sidebarActive.checked) {
        const sidebar = document.querySelector('.links-container');
        const openButton = document.querySelector('.open-sidebar-button');
        
        if (!sidebar.contains(event.target) && !openButton.contains(event.target)) {
          this.sidebarActive.checked = false;
        }
      }
    });
  }

  handleLogout() {
    auth.logout();
    this.updateSignupButton();
    window.location.href = 'index.html';
  }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Navigation();
}); 