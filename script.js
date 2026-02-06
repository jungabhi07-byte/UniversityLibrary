// Cloudflare Worker URL
const API_BASE_URL = 'https://kulibrary-auth.budhathokiabhishek06.workers.dev';
let currentUserType = 'student';

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 KU Library System Loaded');
    console.log(`🔗 API: ${API_BASE_URL}`);
    
    // Check if on login page
    if (document.getElementById('loginForm')) {
        initializeLoginPage();
    }
    
    // Auto-fill credentials on login page
    if (window.location.pathname.includes('login.html')) {
        setTimeout(fillTestCredentials, 500);
    }
    
    // Check if already logged in
    checkAuthStatus();
});

// Initialize Login Page
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

// Update login form based on user type
function updateLoginForm(userType) {
    const title = document.getElementById('loginTitle');
    const subtitle = document.getElementById('loginSubtitle');
    const loginBtn = document.getElementById('loginBtn');

    const messages = {
        'student': {
            title: 'Student Login',
            subtitle: 'Login with student@ku.edu.np / Student@123'
        },
        'staff': {
            title: 'Staff Login',
            subtitle: 'Login with staff@ku.edu.np / Staff@123'
        },
        'admin': {
            title: 'Admin Login',
            subtitle: 'Login with admin@ku.edu.np / Admin@123'
        }
    };

    if (title) title.textContent = messages[userType].title;
    if (subtitle) subtitle.textContent = messages[userType].subtitle;
    
    if (loginBtn) {
        loginBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`;
    }
}

// Auto-fill test credentials
function fillTestCredentials() {
    const emails = {
        'student': 'student@ku.edu.np',
        'staff': 'staff@ku.edu.np',
        'admin': 'admin@ku.edu.np'
    };
    
    const passwords = {
        'student': 'Student@123',
        'staff': 'Staff@123',
        'admin': 'Admin@123'
    };
    
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    if (usernameField && passwordField) {
        usernameField.value = emails[currentUserType];
        passwordField.value = passwords[currentUserType];
        showNotification('Test credentials filled! Click Login', 'success');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const formData = {
        email: email,
        password: password,
        userType: currentUserType
    };
    
    console.log('🔐 Login attempt:', formData);
    
    // Show loading
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        console.log('📥 Login response:', data);
        
        if (data.success) {
            showNotification(`✅ Login successful! Welcome ${data.user.name}`, 'success');
            
            // Store authentication data
            localStorage.setItem('ku_token', data.token);
            localStorage.setItem('ku_user', JSON.stringify(data.user));
            localStorage.setItem('ku_auth_time', Date.now().toString());
            
            // Store current loans if available
            if (data.current_loans) {
                localStorage.setItem('ku_loans', JSON.stringify(data.current_loans));
            }
            
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } else {
            throw new Error(data.message || 'Login failed');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showNotification(`❌ ${error.message}`, 'error');
        
        // Show help for common errors
        if (error.message.includes('not found') || error.message.includes('Invalid')) {
            showNotification('💡 Tip: Use test emails with correct passwords', 'info');
        }
        
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('ku_token');
    const authTime = localStorage.getItem('ku_auth_time');
    const userStr = localStorage.getItem('ku_user');
    
    if (!token || !authTime || !userStr) {
        return null;
    }
    
    // Check if token is expired (24 hours)
    const hoursSinceLogin = (Date.now() - parseInt(authTime)) / (1000 * 60 * 60);
    if (hoursSinceLogin > 24) {
        localStorage.removeItem('ku_token');
        localStorage.removeItem('ku_user');
        localStorage.removeItem('ku_auth_time');
        return null;
    }
    
    try {
        return JSON.parse(userStr);
    } catch (e) {
        return null;
    }
}

// Auto-redirect if already logged in
if (window.location.pathname.includes('login.html')) {
    const user = checkAuthStatus();
    if (user) {
        console.log('🔄 Auto-redirecting to dashboard...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.innerHTML = `
        <div class="notification-content ${type}">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
        </div>
    `;
    
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Redirect to login from index.html
function redirectToLogin(userType) {
    localStorage.setItem('preferred_user_type', userType);
    window.location.href = 'login.html';
}

// Fetch books from API
async function fetchBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books`);
        const data = await response.json();
        
        if (data.success) {
            return data.data;
        } else {
            throw new Error('Failed to fetch books');
        }
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
}

// Logout function
function logout() {
    localStorage.removeItem('ku_token');
    localStorage.removeItem('ku_user');
    localStorage.removeItem('ku_auth_time');
    localStorage.removeItem('ku_loans');
    
    showNotification('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Dashboard functions
function initializeDashboard() {
    const user = checkAuthStatus();
    
    if (!user) {
        showNotification('Please login first', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Display user info
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userType').textContent = user.userType;
    
    // Load books
    loadBooks();
    
    // Load user's loans
    loadUserLoans();
}

async function loadBooks() {
    try {
        const books = await fetchBooks();
        const booksContainer = document.getElementById('booksList');
        
        if (books.length > 0 && booksContainer) {
            booksContainer.innerHTML = books.map(book => `
                <div class="book-card">
                    <h4>${book.title}</h4>
                    <p><strong>Author:</strong> ${book.authors || 'Unknown'}</p>
                    <p><strong>ISBN:</strong> ${book.isbn}</p>
                    <p><strong>Available:</strong> ${book.available_copies || book.total_copies} copies</p>
                    <button onclick="borrowBook('${book.book_id}')" class="borrow-btn">
                        <i class="fas fa-book"></i> Borrow
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading books:', error);
    }
}

async function loadUserLoans() {
    try {
        const token = localStorage.getItem('ku_token');
        const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.active_loans) {
            const loansContainer = document.getElementById('activeLoans');
            if (loansContainer) {
                if (data.data.active_loans.length > 0) {
                    loansContainer.innerHTML = data.data.active_loans.map(loan => `
                        <div class="loan-card">
                            <h4>${loan.title}</h4>
                            <p>Due: ${loan.due_date}</p>
                            <p class="status ${loan.days_remaining < 0 ? 'overdue' : loan.days_remaining <= 3 ? 'due-soon' : 'on-time'}">
                                ${loan.days_remaining < 0 ? 'OVERDUE' : loan.days_remaining <= 3 ? 'DUE SOON' : 'ON TIME'}
                            </p>
                        </div>
                    `).join('');
                } else {
                    loansContainer.innerHTML = '<p>No active loans</p>';
                }
            }
        }
    } catch (error) {
        console.error('Error loading loans:', error);
    }
}

async function borrowBook(bookId) {
    const token = localStorage.getItem('ku_token');
    
    if (!token) {
        showNotification('Please login first', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/books/${bookId}/borrow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Book borrowed successfully!', 'success');
            loadBooks(); // Refresh books list
            loadUserLoans(); // Refresh loans list
        } else {
            showNotification(data.message || 'Failed to borrow book', 'error');
        }
    } catch (error) {
        console.error('Error borrowing book:', error);
        showNotification('Error borrowing book', 'error');
    }
}

// Export functions for dashboard
if (typeof window !== 'undefined') {
    window.logout = logout;
    window.borrowBook = borrowBook;
    window.redirectToLogin = redirectToLogin;
}
