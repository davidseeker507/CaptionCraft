function handleCredentialResponse(response) {
    // The response.credential contains a JWT token
    console.log("Encoded JWT ID token: " + response.credential);
    
    // Send this token to your backend for verification
    fetch('/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: response.credential
      })
    });
  }

// Function to handle user signup
async function signup(email, password) {
    try {
        const response = await fetch('http://localhost:3000/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Store the token
            localStorage.setItem('token', data.token);
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Function to handle user login
async function login(email, password) {
    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Store the token
            localStorage.setItem('token', data.token);
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Function to check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Function to log out
function logout() {
    localStorage.removeItem('token');
}

// Export the functions
export { signup, login, isLoggedIn, logout };