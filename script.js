/**
 * KU Library Management System - Frontend Script
 * Backend API: https://kulibrary-auth.budhathokiabhishek06.workers.dev/
 * Demonstrates Database Connectivity
 */

// API Configuration
const API_BASE_URL = 'https://kulibrary-auth.budhathokiabhishek06.workers.dev';
const API_ENDPOINTS = {
    login: '/api/auth/login',
    register: '/api/auth/register',
    profile: '/api/users/profile',
    books: '/api/books',
    transactions: '/api/transactions',
    stats: '/api/stats'
};

// DOM Elements
let loginForm, togglePassword, passwordInput, loginBtn;
let emailInput, rememberMeCheckbox, currentDateTimeElement;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    updateDateTime();
    checkSession();
    
    // Auto-check backend connectivity
    checkBackendConnectivity();
});

// Initialize DOM elements
function initializeElements() {
    loginForm = document.getElementById('loginForm');
    togglePassword = document.getElementById('togglePassword');
    passwordInput = document.getElementById('password');
    loginBtn = document.getElementById('loginBtn');
    emailInput = document.getElementById('email');
    rememberMeCheckbox = document.getElementById('rememberMe');
    currentDateTimeElement = document.getElementById('currentDateTime');
}

// Setup event listeners
function setupEventListeners() {
    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', togglePasswordVisibility);
    }
    
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Real-time email validation
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
        emailInput.addEventListener('input', clearEmailError);
    }
    
    // Real-time password validation
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePasswordStrength);
        passwordInput.addEventListener('blur', validatePassword);
    }
    
    // Forgot password link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
    
    // Alternative login buttons
    const googleBtn = document.querySelector('.btn-google');
    const microsoftBtn = document.querySelector('.btn-microsoft');
    
    if (googleBtn) googleBtn.addEventListener('click', () => handleSocialLogin('google'));
    if (microsoftBtn) microsoftBtn.addEventListener('click', () => handleSocialLogin('microsoft'));
    
    // Modal close button
    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    const modalOverlay = document.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
}

// Toggle password visibility
function togglePasswordVisibility() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = togglePassword.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    
    // Add accessibility attribute
    togglePassword.setAttribute('aria-label', 
        type === 'password' ? 'Show password' : 'Hide password');
}

// Handle login form submission
async function handleLogin(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Get form data
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Prepare request data
        const requestData = {
            email: email,
            password: password,
            remember_me: rememberMe,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
        };
        
        // Log the API call for debugging
        console.log('Making API call to:', `${API_BASE_URL}${API_ENDPOINTS.login}`);
        console.log('Request data:', { ...requestData, password: '***' });
        
        // Make API call to Cloudflare Workers backend
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.login}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        });
        
        // Parse response
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse JSON response:', parseError);
            throw new Error('Invalid server response format');
        }
        
        console.log('Parsed response:', data);
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}: Login failed`);
        }
        
        if (data.success) {
            // Successful login
            showNotification('success', 'Login successful! Welcome to KU Library System.');
            
            // Store session data
            storeSessionData(data.user, data.token, rememberMe);
            
            // Log successful connection to backend
            logDatabaseConnection({
                email: email,
                timestamp: new Date().toISOString(),
                endpoint: API_ENDPOINTS.login,
                status: 'success',
                response: data
            });
            
            // Redirect to dashboard after delay
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
            
        } else {
            // Login failed
            throw new Error(data.message || 'Login failed. Please check your credentials.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Log failed connection
        logDatabaseConnection({
            email: email,
            timestamp: new Date().toISOString(),
            endpoint: API_ENDPOINTS.login,
            status: 'error',
            error: error.message
        });
        
        // Show error notification
        showNotification('error', 
            error.message.includes('network') 
            ? 'Cannot connect to server. Please check your internet connection.'
            : error.message || 'Login failed. Please try again.'
        );
        
    } finally {
        // Reset loading state
        setLoadingState(false);
    }
}

// Validate form
function validateForm() {
    let isValid = true;
    
    // Validate email
    if (!validateEmail()) {
        isValid = false;
    }
    
    // Validate password
    if (!validatePassword()) {
        isValid = false;
    }
    
    return isValid;
}

// Validate email
function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@kulibrary\.edu\.np$/;
    
    if (!email) {
        showFieldError('email', 'Email is required');
        return false;
    }
    
    if (!emailRegex.test(email)) {
        showFieldError('email', 'Please use a valid KU Library email address (@kulibrary.edu.np)');
        return false;
    }
    
    clearFieldError('email');
    return true;
}

// Clear email error
function clearEmailError() {
    clearFieldError('email');
}

// Validate password
function validatePassword() {
    const password = passwordInput.value;
    
    if (!password) {
        showFieldError('password', 'Password is required');
        return false;
    }
    
    if (password.length < 8) {
        showFieldError('password', 'Password must be at least 8 characters long');
        return false;
    }
    
    clearFieldError('password');
    return true;
}

// Validate password strength in real-time
function validatePasswordStrength() {
    const password = passwordInput.value;
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    let message = '';
    
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch(strength) {
        case 0:
        case 1:
            message = 'Weak';
            strengthIndicator.className = 'password-strength weak';
            break;
        case 2:
            message = 'Fair';
            strengthIndicator.className = 'password-strength fair';
            break;
        case 3:
            message = 'Good';
            strengthIndicator.className = 'password-strength good';
            break;
        case 4:
            message = 'Strong';
            strengthIndicator.className = 'password-strength strong';
            break;
    }
    
    strengthIndicator.textContent = `Strength: ${message}`;
}

// Show field error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    // Remove existing error
    const existingError = formGroup.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Add error class to input
    field.classList.add('error');
    
    // Create error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    errorElement.style.cssText = `
        color: var(--ku-error);
        font-size: 0.75rem;
        margin-top: var(--space-xs);
        display: flex;
        align-items: center;
        gap: var(--space-xs);
    `;
    
    formGroup.appendChild(errorElement);
}

// Clear field error
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const formGroup = field.closest('.form-group');
    
    // Remove error class
    field.classList.remove('error');
    
    // Remove error message
    const existingError = formGroup.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Set loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loginBtn.classList.add('loading');
        loginBtn.querySelector('.btn-text').textContent = 'Authenticating...';
    } else {
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
        loginBtn.querySelector('.btn-text').textContent = 'Secure Login';
    }
}

// Store session data
function storeSessionData(user, token, rememberMe) {
    // Store in session storage for temporary session
    sessionStorage.setItem('ku_library_token', token);
    sessionStorage.setItem('ku_library_user', JSON.stringify(user));
    
    // If remember me is checked, store in local storage
    if (rememberMe) {
        localStorage.setItem('ku_library_token', token);
        localStorage.setItem('ku_library_user', JSON.stringify(user));
        localStorage.setItem('ku_library_remember', 'true');
    }
    
    // Store login timestamp
    const loginTime = new Date().toISOString();
    sessionStorage.setItem('ku_library_login_time', loginTime);
    if (rememberMe) {
        localStorage.setItem('ku_library_login_time', loginTime);
    }
}

// Check existing session
function checkSession() {
    const token = localStorage.getItem('ku_library_token') || sessionStorage.getItem('ku_library_token');
    
    if (token) {
        // Auto-fill email if remembered
        const userStr = localStorage.getItem('ku_library_user') || sessionStorage.getItem('ku_library_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (emailInput && user.email) {
                    emailInput.value = user.email;
                    rememberMeCheckbox.checked = true;
                }
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }
    }
}

// Handle forgot password
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email || !validateEmail()) {
        showNotification('warning', 'Please enter a valid email address first');
        emailInput.focus();
        return;
    }
    
    showNotification('info', `Password reset instructions will be sent to ${email}`);
    
    // In a real application, you would make an API call here
    // For demo purposes, we'll simulate the process
    setTimeout(() => {
        showNotification('success', 'Password reset email sent! Check your inbox.');
    }, 1000);
