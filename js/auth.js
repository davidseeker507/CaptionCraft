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