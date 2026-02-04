// Use this API URL
const API_BASE_URL = 'https://kulibrary-auth.budhathokiabhishek06.workers.dev';

// In your login function, use either endpoint:
async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    // Try /api/login endpoint
    const response = await fetch(API_BASE_URL + '/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Login successful!', data.user);
      // Store token and redirect
      localStorage.setItem('kulibrary_token', data.token);
      localStorage.setItem('kulibrary_user', JSON.stringify(data.user));
      window.location.href = 'dashboard.html';
    } else {
      console.error('❌ Login failed:', data.message);
      alert('Login failed: ' + data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error. Please try again.');
  }
}
