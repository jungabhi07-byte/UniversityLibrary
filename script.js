// Cloudflare Worker URL
const API_BASE_URL = 'https://kulibrary-auth.budhathokiabhishek06.workers.dev';

// Global variable for user type
let currentUserType = 'student';

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 KU Library System Loaded');
    console.log(`🔗 API: ${API_BASE_URL}`);
    
    // Check if on login page
    if (document.getElementById('loginForm')) {
        initializeLoginPage();
    }
    
    // Check if already logged in
    checkAuthStatus();
});

// Initialize Login Page
function initializeLoginPage() {
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
    
    // Set initial user type if not set by onclick
    if (!window.currentUserType) {
        window.currentUserType = 'student';
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = window.currentUserType || 'student';
    
    const formData = {
        email: email,
        password: password,
        userType: userType
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
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    
    notification.innerHTML = `
        <div class="notification-content ${type}">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
        </div>
    `;
    
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (notification) {
            notification.style.display = 'none';
        }
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
        showNotification('Failed to load books', 'error');
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
function loadBooks() {
    fetchBooks().then(books => {
        const booksContainer = document.getElementById('booksList');
        
        if (books.length > 0 && booksContainer) {
            booksContainer.innerHTML = books.map(book => `
                <div class="book-card">
                    <h4>${book.title}</h4>
                    <p><strong>Author:</strong> ${book.authors || 'Unknown'}</p>
                    <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
                    <p><strong>Year:</strong> ${book.year || 'N/A'}</p>
                    <p><strong>Available:</strong> ${book.available_copies || book.total_copies || 1} copies</p>
                    <button onclick="borrowBook('${book.book_id}')" class="borrow-btn">
                        <i class="fas fa-book"></i> Borrow
                    </button>
                </div>
            `).join('');
        } else if (booksContainer) {
            booksContainer.innerHTML = '<p>No books available</p>';
        }
    });
}

function loadUserLoans() {
    const user = JSON.parse(localStorage.getItem('ku_user') || '{}');
    const token = localStorage.getItem('ku_token');
    
    if (!token) return;
    
    fetch(`${API_BASE_URL}/api/dashboard`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.data && data.data.active_loans) {
            const loansContainer = document.getElementById('activeLoans');
            if (loansContainer) {
                if (data.data.active_loans.length > 0) {
                    loansContainer.innerHTML = data.data.active_loans.map(loan => `
                        <div class="loan-card">
                            <h4>${loan.title}</h4>
                            <p><strong>Borrowed:</strong> ${loan.loan_date}</p>
                            <p><strong>Due:</strong> ${loan.due_date}</p>
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
    })
    .catch(error => {
        console.error('Error loading loans:', error);
    });
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

// Make functions globally available
window.redirectToLogin = redirectToLogin;
window.logout = logout;
window.borrowBook = borrowBook;
window.loadBooks = loadBooks;
window.loadUserLoans = loadUserLoans;
