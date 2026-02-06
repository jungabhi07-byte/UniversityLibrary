// ===== CONFIGURATION =====
const API_BASE_URL = 'https://kulibrary-auth.budhathokiabhishek06.workers.dev';
let currentUserType = 'student';

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 KU Library System Initialized');
    console.log(`🔗 API Endpoint: ${API_BASE_URL}`);
    
    // Initialize based on current page
    if (document.getElementById('loginForm')) {
        initializeLoginPage();
    } else if (document.querySelector('.dashboard-container')) {
        initializeDashboard();
    } else {
        initializeHomePage();
    }
    
    // Check authentication status
    checkAuthStatus();
});

// ===== HOME PAGE FUNCTIONS =====
function initializeHomePage() {
    console.log('🏠 Initializing home page...');
    
    // Add animation to portal cards
    const portalCards = document.querySelectorAll('.portal-card');
    portalCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
    
    // Add hover effects to service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow)';
        });
    });
    
    // Set current year in footer
    const yearElement = document.querySelector('.current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Redirect to login with user type
function redirectToLogin(userType) {
    localStorage.setItem('preferred_user_type', userType);
    window.location.href = 'login.html';
}

// ===== AUTHENTICATION FUNCTIONS =====
function checkAuthStatus() {
    const token = localStorage.getItem('ku_token');
    const authTime = localStorage.getItem('ku_auth_time');
    
    // Check if token exists and is not expired (24 hours)
    if (token && authTime) {
        const elapsed = Date.now() - parseInt(authTime);
        const hoursElapsed = elapsed / (1000 * 60 * 60);
        
        if (hoursElapsed < 24) {
            // User is authenticated, redirect to dashboard if on login page
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // Token expired, clear and redirect to login
            clearAuthData();
            if (window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'login.html';
            }
        }
    } else if (window.location.pathname.includes('dashboard.html')) {
        // No token but on dashboard, redirect to login
        window.location.href = 'login.html';
    }
}

function getCurrentUser() {
    const userStr = localStorage.getItem('ku_user');
    return userStr ? JSON.parse(userStr) : null;
}

function clearAuthData() {
    localStorage.removeItem('ku_token');
    localStorage.removeItem('ku_user');
    localStorage.removeItem('ku_auth_time');
    localStorage.removeItem('preferred_user_type');
}

// ===== LOGIN PAGE FUNCTIONS =====
function initializeLoginPage() {
    console.log('🔐 Initializing login page...');
    
    // Check for preferred user type from home page
    const preferredType = localStorage.getItem('preferred_user_type');
    if (preferredType) {
        setUserType(preferredType);
    } else {
        setUserType('student');
    }
    
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
    
    // Back to home button
    const backBtn = document.getElementById('backToHome');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
}

function setUserType(type) {
    currentUserType = type;
    
    // Update active button
    const buttons = document.querySelectorAll('.user-type-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[data-type="${type}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Set credentials based on type
    const credentials = {
        student: { email: 'student@ku.edu.np', password: 'Student@123' },
        staff: { email: 'staff@ku.edu.np', password: 'Staff@123' },
        admin: { email: 'admin@ku.edu.np', password: 'Admin@123' }
    };
    
    const cred = credentials[type];
    if (cred) {
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        
        if (usernameField) usernameField.value = cred.email;
        if (passwordField) passwordField.value = cred.password;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const formData = {
        email: email,
        password: password,
        userType: currentUserType
    };
    
    console.log('🔐 Login attempt:', { email, userType: currentUserType });
    
    // Show loading state
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
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
        
        if (data.success) {
            showNotification(`✅ Welcome back, ${data.user.name}!`, 'success');
            
            // Store user data
            localStorage.setItem('ku_token', data.token);
            localStorage.setItem('ku_user', JSON.stringify(data.user));
            localStorage.setItem('ku_auth_time', Date.now().toString());
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } else {
            throw new Error(data.message || 'Login failed');
        }
        
    } catch (error) {
        console.error('❌ Login error:', error);
        showNotification(`❌ ${error.message}`, 'error');
        
        // Suggest test credentials
        if (error.message.includes('not found') || error.message.includes('Invalid')) {
            setTimeout(() => {
                showNotification('💡 Try: student@ku.edu.np / Student@123', 'info');
            }, 1000);
        }
        
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// ===== DASHBOARD FUNCTIONS =====
function initializeDashboard() {
    console.log('📊 Initializing dashboard...');
    
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info
    updateUserInfo(user);
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up sidebar navigation
    setupSidebarNavigation();
    
    // Set up logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function updateUserInfo(user) {
    // Update user name
    const userNameElements = document.querySelectorAll('.user-name, #userName');
    userNameElements.forEach(el => {
        el.textContent = user.name;
    });
    
    // Update user role
    const userRoleElements = document.querySelectorAll('.user-role, #userRole');
    userRoleElements.forEach(el => {
        el.textContent = user.userType.charAt(0).toUpperCase() + user.userType.slice(1);
    });
    
    // Update user email
    const userEmailElements = document.querySelectorAll('#userEmail');
    userEmailElements.forEach(el => {
        if (el) el.textContent = user.email;
    });
    
    // Update avatar based on user type
    const avatarIcons = {
        student: 'fa-user-graduate',
        staff: 'fa-chalkboard-teacher',
        admin: 'fa-user-cog'
    };
    
    const avatarIconsElements = document.querySelectorAll('.user-avatar i');
    avatarIconsElements.forEach(el => {
        el.className = `fas ${avatarIcons[user.userType] || 'fa-user'}`;
    });
}

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('ku_token');
        const user = getCurrentUser();
        
        // Show loading state
        showNotification('📚 Loading library data...', 'info');
        
        // Simulate API calls with mock data
        setTimeout(() => {
            // Mock data for demonstration
            const mockBooks = [
                { book_id: 'B001', title: 'Introduction to Algorithms', authors: 'Thomas H. Cormen', isbn: '978-0262033848', available_copies: 5, total_copies: 10 },
                { book_id: 'B002', title: 'Clean Code', authors: 'Robert C. Martin', isbn: '978-0132350884', available_copies: 3, total_copies: 8 },
                { book_id: 'B003', title: 'The Pragmatic Programmer', authors: 'David Thomas, Andrew Hunt', isbn: '978-0201616224', available_copies: 2, total_copies: 6 },
                { book_id: 'B004', title: 'Design Patterns', authors: 'Erich Gamma', isbn: '978-0201633610', available_copies: 4, total_copies: 7 },
                { book_id: 'B005', title: 'Computer Networks', authors: 'Andrew S. Tanenbaum', isbn: '978-0132126953', available_copies: 6, total_copies: 12 },
                { book_id: 'B006', title: 'Database System Concepts', authors: 'Abraham Silberschatz', isbn: '978-0078022159', available_copies: 3, total_copies: 8 }
            ];
            
            const mockStats = {
                total_books: 15000,
                active_loans: 3,
                overdue_loans: 1,
                available_books: 14500,
                total_members: 10500
            };
            
            const mockLoans = [
                { book_id: 'B001', title: 'Introduction to Algorithms', due_date: '2024-02-15', status: 'active' },
                { book_id: 'B002', title: 'Clean Code', due_date: '2024-02-10', status: 'overdue' },
                { book_id: 'B003', title: 'The Pragmatic Programmer', due_date: '2024-02-20', status: 'active' }
            ];
            
            displayBooks(mockBooks);
            updateDashboardStats(mockStats);
            displayActiveLoans(mockLoans);
            
            showNotification('✅ Dashboard data loaded successfully!', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Dashboard data error:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function displayBooks(books) {
    const booksContainer = document.getElementById('booksGrid');
    if (!booksContainer || !books) return;
    
    const booksToShow = books.slice(0, 6); // Show only 6 books
    
    booksContainer.innerHTML = booksToShow.map(book => `
        <div class="book-card">
            <h4>${book.title || 'Unknown Title'}</h4>
            <p><strong>Author:</strong> ${book.authors || 'Unknown'}</p>
            <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
            <p><strong>Available:</strong> ${book.available_copies || book.total_copies || 0} copies</p>
            <button class="borrow-btn" onclick="borrowBook('${book.book_id}', '${book.title}')">
                <i class="fas fa-book"></i> Borrow
            </button>
        </div>
    `).join('');
}

function updateDashboardStats(data) {
    // Update stats cards
    const stats = {
        totalBooks: data.total_books || 0,
        activeLoans: data.active_loans || 0,
        overdueLoans: data.overdue_loans || 0,
        availableBooks: data.available_books || 0,
        totalMembers: data.total_members || 0
    };
    
    // Update each stat card if it exists
    const statCards = {
        'totalBooks': { element: document.querySelector('#totalBooks'), value: stats.totalBooks },
        'activeLoans': { element: document.querySelector('#activeLoans'), value: stats.activeLoans },
        'overdueLoans': { element: document.querySelector('#overdueLoans'), value: stats.overdueLoans },
        'availableBooks': { element: document.querySelector('#availableBooks'), value: stats.availableBooks }
    };
    
    Object.keys(statCards).forEach(key => {
        if (statCards[key].element) {
            statCards[key].element.textContent = statCards[key].value.toLocaleString();
        }
    });
}

function displayActiveLoans(loans) {
    const loansContainer = document.getElementById('activeLoansList');
    if (!loansContainer) return;
    
    if (!loans || loans.length === 0) {
        loansContainer.innerHTML = `
            <div class="no-data">
                <i class="fas fa-book-open"></i>
                <p>No active loans found</p>
            </div>
        `;
        return;
    }
    
    loansContainer.innerHTML = loans.map(loan => `
        <div class="loan-item ${loan.status === 'overdue' ? 'overdue' : ''}">
            <div class="loan-info">
                <h4>${loan.title}</h4>
                <p><strong>Due Date:</strong> ${loan.due_date}</p>
                <p><strong>Status:</strong> <span class="status-badge ${loan.status}">${loan.status}</span></p>
            </div>
            ${loan.status === 'overdue' ? 
                '<button class="renew-btn" onclick="renewBook(\'' + loan.book_id + '\')"><i class="fas fa-redo"></i> Renew</button>' : 
                '<button class="return-btn" onclick="returnBook(\'' + loan.book_id + '\')"><i class="fas fa-undo"></i> Return</button>'
            }
        </div>
    `).join('');
}

// ===== BOOK MANAGEMENT FUNCTIONS =====
async function borrowBook(bookId, bookTitle) {
    const token = localStorage.getItem('ku_token');
    const user = getCurrentUser();
    
    if (!user) {
        showNotification('Please login first', 'error');
        return;
    }
    
    const confirmBorrow = confirm(`Borrow "${bookTitle}"?`);
    if (!confirmBorrow) return;
    
    try {
        // Show loading
        showNotification(`Processing borrowing request...`, 'info');
        
        // Simulate API call
        setTimeout(() => {
            showNotification(`✅ Successfully borrowed "${bookTitle}"`, 'success');
            
            // Update dashboard
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }, 1500);
        
    } catch (error) {
        console.error('❌ Borrow error:', error);
        showNotification('Failed to borrow book', 'error');
    }
}

async function returnBook(bookId) {
    try {
        showNotification('Processing return...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            showNotification('✅ Book returned successfully', 'success');
            
            // Update dashboard
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }, 1500);
        
    } catch (error) {
        console.error('❌ Return error:', error);
        showNotification('Failed to return book', 'error');
    }
}

async function renewBook(bookId) {
    try {
        showNotification('Processing renewal...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            showNotification('✅ Book renewed for 2 more weeks', 'success');
            
            // Update dashboard
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }, 1500);
        
    } catch (error) {
        console.error('❌ Renew error:', error);
        showNotification('Failed to renew book', 'error');
    }
}

// ===== NAVIGATION FUNCTIONS =====
function setupSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    const sections = document.querySelectorAll('.dashboard-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            
            // Update active menu item
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.style.display = 'none';
                if (section.id === targetId) {
                    section.style.display = 'block';
                }
            });
            
            // Update dashboard title
            const dashboardTitle = document.getElementById('dashboardTitle');
            if (dashboardTitle) {
                dashboardTitle.textContent = this.querySelector('.menu-text').textContent;
            }
            
            // Load section-specific data
            if (targetId === 'books') {
                loadBooksSection();
            } else if (targetId === 'profile') {
                loadProfileSection();
            }
        });
    });
}

function loadBooksSection() {
    // Fetch and display all books
    console.log('Loading books section...');
}

function loadProfileSection() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update profile form
    document.getElementById('profileName').value = user.name;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileType').value = user.userType;
    document.getElementById('profileId').value = user.id || 'N/A';
}

async function updateProfile() {
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    
    try {
        showNotification('Updating profile...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            // Update local storage
            const user = getCurrentUser();
            user.name = name;
            user.email = email;
            localStorage.setItem('ku_user', JSON.stringify(user));
            
            // Update UI
            updateUserInfo(user);
            showNotification('✅ Profile updated successfully', 'success');
        }, 1500);
        
    } catch (error) {
        console.error('❌ Profile update error:', error);
        showNotification('Failed to update profile', 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 9999;
                animation: slideIn 0.3s ease;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .notification.success { background: linear-gradient(135deg, #27ae60, #2ecc71); }
            .notification.error { background: linear-gradient(135deg, #e74c3c, #c0392b); }
            .notification.info { background: linear-gradient(135deg, #3498db, #2980b9); }
            .notification-warning { background: linear-gradient(135deg, #f39c12, #e67e22); }
            .notification-close {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                margin-left: auto;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    return icons[type] || 'fa-info-circle';
}

function logout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (confirmLogout) {
        clearAuthData();
        showNotification('👋 Logged out successfully', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// ===== INITIALIZATION =====
// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: fadeIn 0.5s ease forwards;
        opacity: 0;
    }
    
    @keyframes fadeIn {
        to { opacity: 1; }
    }
    
    .loan-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 10px;
        border-left: 4px solid #3498db;
    }
    
    .loan-item.overdue {
        border-left-color: #e74c3c;
        background: #fff5f5;
    }
    
    .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    
    .status-badge.active {
        background: #d4edda;
        color: #155724;
    }
    
    .status-badge.overdue {
        background: #f8d7da;
        color: #721c24;
    }
    
    .renew-btn, .return-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s ease;
    }
    
    .renew-btn {
        background: #f39c12;
        color: white;
    }
    
    .return-btn {
        background: #27ae60;
        color: white;
    }
    
    .renew-btn:hover, .return-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .no-data {
        text-align: center;
        padding: 40px;
        color: #7f8c8d;
    }
    
    .no-data i {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
`;
document.head.appendChild(style);

// Export functions for HTML onclick handlers
window.setUserType = setUserType;
window.redirectToLogin = redirectToLogin;
window.borrowBook = borrowBook;
window.returnBook = returnBook;
window.renewBook = renewBook;
window.updateProfile = updateProfile;
window.logout = logout;
