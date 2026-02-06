// Configuration
const API_CONFIG = {
    development: {
        baseURL: 'http://localhost:3001',
        endpoints: {
            login: '/api/login',
            books: '/api/books',
            dashboard: '/api/dashboard',
            health: '/api/health',
            borrow: '/api/books/{id}/borrow',
            return: '/api/loans/{id}/return',
            members: '/api/members'
        }
    },
    production: {
        baseURL: 'https://kulibrary-auth.budhathokiabhishek06.workers.dev',
        endpoints: {
            login: '/api/login',
            books: '/api/books',
            dashboard: '/api/dashboard'
        }
    }
};

// Select environment - USE DEVELOPMENT FOR LOCAL MYSQL
const ENVIRONMENT = 'development'; // Change this to 'production' for Cloudflare Worker
const API_BASE_URL = API_CONFIG[ENVIRONMENT].baseURL;
let currentUserType = 'student';

// Global state
let currentUser = null;
let authToken = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 KU Library Frontend Loaded');
    console.log(`🔗 API Base URL: ${API_BASE_URL}`);
    console.log(`🌐 Environment: ${ENVIRONMENT}`);
    
    // Test connection on load
    testConnection();
    
    if (document.getElementById('loginForm')) {
        initializeLoginPage();
    }
    
    checkAuthStatus();
});

// Test API connection
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend Connection:', data);
            
            // Update status indicator if exists
            const statusIndicator = document.querySelector('.system-status');
            if (statusIndicator) {
                statusIndicator.innerHTML = `
                    <span class="status-dot online"></span>
                    <span>MySQL Connected (${data.tables_count} tables)</span>
                `;
            }
            
            return true;
        }
    } catch (error) {
        console.error('❌ Backend Connection Failed:', error);
        
        // Update status indicator if exists
        const statusIndicator = document.querySelector('.system-status');
        if (statusIndicator) {
            statusIndicator.innerHTML = `
                <span class="status-dot offline"></span>
                <span>Backend Offline - Start backend server</span>
            `;
        }
        
        showNotification('Backend server not running. Start: cd backend && npm run dev', 'error');
        return false;
    }
}

// Initialize Login Page
function initializeLoginPage() {
    console.log('🔐 Initializing login page...');
    
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
    
    // Auto-fill test credentials button
    const testCredBtn = document.createElement('button');
    testCredBtn.type = 'button';
    testCredBtn.className = 'test-cred-btn';
    testCredBtn.innerHTML = '<i class="fas fa-vial"></i> Fill Test Credentials';
    testCredBtn.onclick = fillTestCredentials;
    
    const formHeader = document.querySelector('.form-header');
    if (formHeader) {
        formHeader.appendChild(testCredBtn);
    }
}

// Fill test credentials
function fillTestCredentials() {
    const emailMap = {
        'student': 'student@ku.edu.np',
        'staff': 'staff@ku.edu.np',
        'admin': 'admin@ku.edu.np'
    };
    
    const passwordMap = {
        'student': 'Student@123',
        'staff': 'Staff@123',
        'admin': 'Admin@123'
    };
    
    document.getElementById('username').value = emailMap[currentUserType] || '';
    document.getElementById('password').value = passwordMap[currentUserType] || '';
    
    showNotification(`Filled ${currentUserType} test credentials`, 'success');
}

// Update login form based on user type
function updateLoginForm(userType) {
    const title = document.getElementById('loginTitle');
    const subtitle = document.getElementById('loginSubtitle');
    const loginBtn = document.getElementById('loginBtn');

    switch(userType) {
        case 'student':
            if (title) title.textContent = 'Student Login';
            if (subtitle) subtitle.textContent = 'Login with your KU email to access library services';
            break;
        case 'staff':
            if (title) title.textContent = 'Staff Login';
            if (subtitle) subtitle.textContent = 'Access library management system';
            break;
        case 'admin':
            if (title) title.textContent = 'Admin Login';
            if (subtitle) subtitle.textContent = 'System administration and management';
            break;
    }

    // Update login button
    if (loginBtn) {
        loginBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`;
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Auto-correct email for test users
    const emailCorrections = {
        'student': 'student@ku.edu.np',
        'staff': 'staff@ku.edu.np', 
        'admin': 'admin@ku.edu.np'
    };
    
    const finalEmail = emailCorrections[currentUserType] || email;

    const formData = {
        email: finalEmail,
        password: password,
        userType: currentUserType
    };

    console.log('🔐 Login attempt:', formData);

    // Show loading
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting to MySQL Database...';
    loginBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log('📥 Login response:', data);

        if (response.ok && data.success) {
            showNotification(`✅ Login successful! Welcome ${data.user.name}`, 'success');
            
            // Store authentication data
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('ku_library_token', data.token);
            localStorage.setItem('ku_library_user', JSON.stringify(data.user));
            localStorage.setItem('ku_library_auth_time', Date.now().toString());
            
            // Store current loans if available
            if (data.current_loans) {
                localStorage.setItem('ku_current_loans', JSON.stringify(data.current_loans));
            }

            // Show database connection success
            showNotification(`📊 Connected to MySQL: LibraryDB with ${data.current_loans?.length || 0} active loans`, 'info');

            // Redirect to dashboard after delay
            setTimeout(() => {
                redirectToDashboard(data.user.userType);
            }, 2000);

        } else {
            throw new Error(data.message || 'Login failed. Check credentials.');
        }

    } catch (error) {
        console.error('❌ Login error:', error);
        
        // Try fallback to Cloudflare Worker
        if (ENVIRONMENT === 'development' && error.message.includes('Failed to fetch')) {
            showNotification('Local backend not responding. Trying Cloudflare Worker...', 'warning');
            
            try {
                const fallbackResponse = await fetch('https://kulibrary-auth.budhathokiabhishek06.workers.dev/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const fallbackData = await fallbackResponse.json();
                
                if (fallbackResponse.ok && fallbackData.success) {
                    showNotification('⚠️ Using Cloudflare Worker (Demo Mode)', 'warning');
                    localStorage.setItem('ku_library_demo', 'true');
                    localStorage.setItem('ku_library_user', JSON.stringify(fallbackData.user));
                    setTimeout(() => {
                        redirectToDashboard(fallbackData.user.userType);
                    }, 1500);
                    return;
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        }
        
        showNotification(`❌ ${error.message}`, 'error');
        
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// Redirect to dashboard
function redirectToDashboard(userType) {
    console.log(`🔄 Redirecting to dashboard as ${userType}`);
    
    // You can create different dashboards for different user types
    const dashboards = {
        'student': 'dashboard.html',
        'staff': 'dashboard.html', 
        'admin': 'dashboard.html'
    };
    
    const dashboardPage = dashboards[userType] || 'dashboard.html';
    window.location.href = dashboardPage;
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('ku_library_token');
    const authTime = localStorage.getItem('ku_library_auth_time');
    const userStr = localStorage.getItem('ku_library_user');
    
    if (!token || !authTime || !userStr) {
        console.log('🔓 No active session found');
        return null;
    }
    
    // Check if token is expired (24 hours)
    const hoursSinceLogin = (Date.now() - parseInt(authTime)) / (1000 * 60 * 60);
    if (hoursSinceLogin > 24) {
        console.log('⌛ Session expired');
        localStorage.removeItem('ku_library_token');
        localStorage.removeItem('ku_library_user');
        localStorage.removeItem('ku_library_auth_time');
        return null;
    }
    
    try {
        const user = JSON.parse(userStr);
        console.log(`👤 Active session: ${user.name} (${user.userType})`);
        
        // Auto-redirect if on login page
        if (window.location.pathname.includes('login.html')) {
            console.log('🔄 Auto-redirecting to dashboard...');
            setTimeout(() => redirectToDashboard(user.userType), 1000);
        }
        
        return user;
    } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
    }
}

// Get auth headers for API calls
function getAuthHeaders() {
    const token = localStorage.getItem('ku_library_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Logout function
function logout() {
    localStorage.removeItem('ku_library_token');
    localStorage.removeItem('ku_library_user');
    localStorage.removeItem('ku_library_auth_time');
    localStorage.removeItem('ku_current_loans');
    localStorage.removeItem('ku_library_demo');
    
    currentUser = null;
    authToken = null;
    
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Utility Functions
function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notificationMessage');
    const icon = document.getElementById('notificationIcon');
    
    if (notification && messageEl && icon) {
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        
        // Set icon based on type
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        };
        
        icon.className = `fas ${icons[type] || 'fa-info-circle'}`;
        notification.style.display = 'flex';
        
        // Auto-hide
        setTimeout(hideNotification, 5000);
    } else {
        alert(message);
    }
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.style.display = 'none';
    }
}

// For index.html - redirect to login
function redirectToLogin(userType) {
    localStorage.setItem('preferred_user_type', userType);
    window.location.href = 'login.html';
}

// Fetch books from API
async function fetchBooks(search = '') {
    try {
        const url = `${API_BASE_URL}/api/books${search ? `?search=${encodeURIComponent(search)}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        showNotification('Failed to load books', 'error');
        return [];
    }
}

// Export functions for dashboard page
if (typeof window !== 'undefined') {
    window.KULibrary = {
        API_BASE_URL,
        getAuthHeaders,
        logout,
        fetchBooks,
        showNotification,
        hideNotification,
        getCurrentUser: () => currentUser || checkAuthStatus(),
        isAuthenticated: () => !!localStorage.getItem('ku_library_token')
    };
}
