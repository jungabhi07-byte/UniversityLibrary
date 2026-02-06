// Configuration
const API_BASE_URL = 'https://kulibrary-auth.budhathokiabhishek06.workers.dev';
let currentUserType = 'student';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on login page
    if (document.getElementById('loginForm')) {
        initializeLoginPage();
    }
});

function initializeLoginPage() {
    // User type switching
    const userTypeBtns = document.querySelectorAll('.user-type-btn');
    userTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            userTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentUserType = this.dataset.type;
            updateLoginForm(currentUserType);
        });
    });

    // Show password toggle
    const showPasswordBtn = document.getElementById('showPassword');
    if (showPasswordBtn) {
        showPasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

function updateLoginForm(userType) {
    const title = document.getElementById('loginTitle');
    const subtitle = document.getElementById('loginSubtitle');
    const studentIdField = document.getElementById('studentIdField');
    const staffIdField = document.getElementById('staffIdField');
    const loginBtn = document.getElementById('loginBtn');

    // Reset fields
    studentIdField.style.display = 'none';
    staffIdField.style.display = 'none';

    switch(userType) {
        case 'student':
            title.textContent = 'Student Login';
            subtitle.textContent = 'Enter your KU credentials to access student portal';
            studentIdField.style.display = 'block';
            break;
        case 'staff':
            title.textContent = 'Staff Login';
            subtitle.textContent = 'Enter your staff credentials to access library management';
            staffIdField.style.display = 'block';
            break;
        case 'admin':
            title.textContent = 'Admin Login';
            subtitle.textContent = 'Enter admin credentials for system administration';
            break;
    }

    // Update login button text
    loginBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`;
}

async function handleLogin(event) {
    event.preventDefault();

    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        userType: currentUserType
    };

    // Add additional fields based on user type
    if (currentUserType === 'student') {
        formData.studentId = document.getElementById('studentId')?.value;
    } else if (currentUserType === 'staff') {
        formData.staffId = document.getElementById('staffId')?.value;
    }

    // Show loading state
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    loginBtn.disabled = true;

    try {
        // Call Cloudflare Worker API
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Login successful! Redirecting...', 'success');
            
            // Store authentication data
            localStorage.setItem('ku_library_auth', JSON.stringify({
                token: data.token,
                userType: currentUserType,
                username: formData.username,
                timestamp: Date.now()
            }));

            // Redirect to dashboard or main page
            setTimeout(() => {
                window.location.href = 'dashboard.html'; // Create this page separately
            }, 1500);
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please try again.', 'error');
    } finally {
        // Reset button state
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    
    if (notification && messageEl) {
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(hideNotification, 5000);
    } else {
        alert(message); // Fallback
    }
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.style.display = 'none';
    }
}

function redirectToLogin(userType) {
    localStorage.setItem('preferred_user_type', userType);
    window.location.href = 'login.html';
}

// For index.html navigation
function checkAuthStatus() {
    const auth = localStorage.getItem('ku_library_auth');
    if (auth) {
        try {
            const authData = JSON.parse(auth);
            // Check if token is still valid (24 hours)
            if (Date.now() - authData.timestamp < 24 * 60 * 60 * 1000) {
                // User is logged in
                console.log('User is authenticated as:', authData.userType);
            } else {
                // Token expired
                localStorage.removeItem('ku_library_auth');
            }
        } catch (e) {
            localStorage.removeItem('ku_library_auth');
        }
    }
}

// Check auth status on page load
window.addEventListener('load', checkAuthStatus);
