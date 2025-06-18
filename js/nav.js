import { isLoggedIn } from './auth.js';

function updateNavigation() {
    const signupButton = document.getElementById('Signup');
    if (signupButton) {
        if (isLoggedIn()) {
            signupButton.parentElement.style.display = 'none';
        } else {
            signupButton.parentElement.style.display = 'block';
        }
    }
}

// Update navigation when page loads
document.addEventListener('DOMContentLoaded', updateNavigation);

// Export the function so it can be used in other files
export { updateNavigation }; 