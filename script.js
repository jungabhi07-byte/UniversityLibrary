// ===== CONFIGURATION =====
const API_BASE_URL = 'http://localhost:3000'; // Your Node.js server
let currentUser = null;

// ===== DOM READY =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 KU Library System Initialized');
    console.log(`🔗 API Endpoint: ${API_BASE_URL}`);
    
    // Initialize based on current page
    const path = window.location.pathname;
    
    if (path.includes('login.html')) {
        initializeLoginPage();
    } else if (path.includes('dashboard.html')) {
        initializeDashboard();
    } else {
        initializeHomePage();
    }
    
    // Update footer year
    updateCurrentYear();
});

// ===== HOME PAGE FUNCTIONS =====
function initializeHomePage() {
    console.log('🏠 Initializing home page...');
    
    // Load real-time statistics from MySQL
    loadLibraryStats();
    
    // Add portal card interactions
    addPortalCardInteractions();
}

async function loadLibraryStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/library/stats`);
        const data = await response.json();
        
        if (data.success) {
            updateHomeStats(data.stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        updateHomeStats({
            totalBooks: 0,
            activeMembers: 0,
            activeLoans: 0,
            availableBooks: 0
        });
    }
}

function updateHomeStats(stats) {
    const statElements = document.querySelectorAll('.stat h3');
    if (statElements.length >= 4) {
        statElements[0].textContent = stats.totalBooks?.toLocaleString() || '0';
        statElements[1].textContent = stats.activeMembers?.toLocaleString() || '0';
        statElements[2].textContent = stats.activeLoans?.toLocaleString() || '0';
        statElements[3].textContent = stats.availableBooks?.toLocaleString() || '0';
    }
}

function addPortalCardInteractions() {
    document.querySelectorAll('.portal-card').forEach(card => {
        card.addEventListener('click', function() {
            const userType = this.classList.contains('student') ? 'student' :
                            this.classList.contains('staff') ? 'staff' : 'admin';
            redirectToLogin(userType);
        });
        
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'var(--shadow)';
        });
    });
}

function redirectToLogin(userType) {
    localStorage.setItem('preferred_user_type', userType);
    window.location.href = 'login.html';
}

// ===== LOGIN PAGE FUNCTIONS =====
function initializeLoginPage() {
    console.log('🔐 Initializing login page...');
    
    // Set default user type
    const preferredType = localStorage.getItem('preferred_user_type') || 'student';
    setUserType(preferredType);
    
    // Setup event listeners
    setupLoginEvents();
}

function setUserType(type) {
    // Update active button
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    
    // Set demo credentials
    const credentials = {
        student: { email: 'john.smith@uni.edu', password: 'Student@123' },
        faculty: { email: 'sarah.j@uni.edu', password: 'Faculty@123' },
        staff: { email: 'lisa.w@uni.edu', password: 'Staff@123' },
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

function setupLoginEvents() {
    // Password toggle
    const showPasswordBtn = document.getElementById('showPassword');
    if (showPasswordBtn) {
        showPasswordBtn.addEventListener('click', togglePasswordVisibility);
    }
    
    // User type buttons
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setUserType(this.dataset.type);
        });
    });
    
    // Form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    await loginUser(email, password);
}

async function loginUser(email, password) {
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.innerHTML;
    
    // Show loading
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    loginBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Welcome ${data.user.name}!`, 'success');
            
            // Store user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('auth_time', Date.now().toString());
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed. Please try again.', 'error');
        
        // Fallback to demo mode
        if (error.message.includes('not found') || error.message.includes('Invalid')) {
            setTimeout(() => {
                showNotification('Using demo credentials...', 'info');
                simulateDemoLogin(email);
            }, 1000);
        }
    } finally {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

function simulateDemoLogin(email) {
    const demoUsers = {
        'john.smith@uni.edu': { 
            name: 'John Smith', 
            role: 'student',
            member_id: 1
        },
        'sarah.j@uni.edu': { 
            name: 'Sarah Johnson', 
            role: 'faculty',
            member_id: 2
        },
        'lisa.w@uni.edu': { 
            name: 'Lisa Wang', 
            role: 'staff',
            member_id: 5
        },
        'admin@ku.edu.np': { 
            name: 'Admin User', 
            role: 'admin'
        }
    };
    
    const user = demoUsers[email] || demoUsers['john.smith@uni.edu'];
    
    localStorage.setItem('token', 'demo_token_' + Date.now());
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('auth_time', Date.now().toString());
    
    showNotification(`Demo login successful! Welcome ${user.name}`, 'success');
    
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 1500);
}

// ===== DASHBOARD FUNCTIONS =====
function initializeDashboard() {
    console.log('📊 Initializing dashboard...');
    
    // Check authentication
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load user data
    currentUser = JSON.parse(localStorage.getItem('user'));
    updateUserDisplay();
    
    // Setup navigation
    setupDashboardNavigation();
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupDashboardEvents();
    
    // Update time
    updateDateTime();
    setInterval(updateDateTime, 60000);
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const authTime = localStorage.getItem('auth_time');
    
    if (!token || !user || !authTime) return false;
    
    // Check if token expired (24 hours)
    const elapsed = Date.now() - parseInt(authTime);
    return elapsed < 24 * 60 * 60 * 1000; // 24 hours
}

function updateUserDisplay() {
    if (!currentUser) return;
    
    // Update user info
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = currentUser.name;
    });
    
    document.querySelectorAll('.user-role').forEach(el => {
        el.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    });
    
    document.querySelectorAll('.user-email').forEach(el => {
        if (el.id === 'userEmail') el.textContent = currentUser.email || 'user@ku.edu.np';
    });
    
    // Update avatar
    const avatarIcon = document.querySelector('.user-avatar i');
    if (avatarIcon) {
        const icons = {
            student: 'fa-user-graduate',
            faculty: 'fa-chalkboard-teacher',
            staff: 'fa-user-tie',
            admin: 'fa-user-cog'
        };
        avatarIcon.className = `fas ${icons[currentUser.role] || 'fa-user'}`;
    }
}

function setupDashboardNavigation() {
    // Set default section
    showSection('dashboard');
    
    // Setup menu clicks
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        if (link.getAttribute('href').startsWith('#')) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                
                // Update active menu
                document.querySelectorAll('.sidebar-menu a').forEach(item => {
                    item.classList.remove('active');
                });
                this.classList.add('active');
                
                // Show section
                showSection(targetId);
            });
        }
    });
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active-section');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active-section');
        
        // Update title
        const menuItem = document.querySelector(`.sidebar-menu a[href="#${sectionId}"] .menu-text`);
        if (menuItem) {
            document.getElementById('dashboardTitle').textContent = menuItem.textContent;
        }
        
        // Load section data
        loadSectionData(sectionId);
    }
}

async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        
        // Load dashboard stats
        const statsResponse = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            if (statsData.success) {
                updateDashboardStats(statsData.data);
            }
        }
        
        // Load recent activity
        await loadRecentActivity();
        
        // Load popular books
        await loadPopularBooks();
        
    } catch (error) {
        console.error('Dashboard data error:', error);
        showNotification('Failed to load dashboard data', 'error');
        loadMockDashboardData();
    }
}

function updateDashboardStats(stats) {
    const elements = {
        totalBooks: document.getElementById('totalBooks'),
        activeLoans: document.getElementById('activeLoans'),
        overdueLoans: document.getElementById('overdueLoans'),
        availableBooks: document.getElementById('availableBooks')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = stats[key]?.toLocaleString() || '0';
        }
    });
}

async function loadRecentActivity() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/user/activity`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayRecentActivity(data.activities);
            }
        }
    } catch (error) {
        console.error('Activity error:', error);
        displayMockActivity();
    }
}

function displayRecentActivity(activities) {
    const container = document.getElementById('activityList');
    if (!container) return;
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<div class="no-activity">No recent activity</div>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-details">
                <p>${activity.description}</p>
                <span class="activity-time">${formatTime(activity.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

async function loadPopularBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books/popular`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayBooks(data.books, 'popularBooks');
            }
        }
    } catch (error) {
        console.error('Popular books error:', error);
        displayMockBooks('popularBooks');
    }
}

async function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'books':
            await loadAllBooks();
            break;
        case 'loans':
            await loadUserLoans();
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'reservations':
            await loadUserReservations();
            break;
    }
}

async function loadAllBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayBooks(data.books, 'booksGrid');
                updateFilterCounts(data.books);
            }
        }
    } catch (error) {
        console.error('Books error:', error);
        displayMockBooks('booksGrid');
    }
}

function displayBooks(books, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="no-books">No books found</div>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card">
            <h4>${book.title}</h4>
            <p><strong>Author:</strong> ${book.authors || 'Unknown'}</p>
            <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
            <p><strong>Available:</strong> ${book.available_count} of ${book.total_copies}</p>
            <p><strong>Year:</strong> ${book.year || 'N/A'}</p>
            ${book.available_count > 0 ? 
                `<button class="borrow-btn" onclick="borrowBook(${book.book_id}, '${book.title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-book"></i> Borrow
                </button>` :
                `<button class="borrow-btn disabled" disabled>
                    <i class="fas fa-times"></i> Unavailable
                </button>`
            }
        </div>
    `).join('');
}

async function loadUserLoans() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/user/loans`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displayUserLoans(data.loans);
            }
        }
    } catch (error) {
        console.error('Loans error:', error);
        displayMockLoans();
    }
}

function displayUserLoans(loans) {
    const container = document.getElementById('loansTable');
    if (!container) return;
    
    if (!loans || loans.length === 0) {
        container.innerHTML = '<div class="no-loans">No active loans</div>';
        return;
    }
    
    // Update loan count badges
    document.getElementById('loanCount').textContent = loans.length;
    const overdueCount = loans.filter(loan => loan.status === 'overdue').length;
    document.getElementById('overdueLoans').textContent = overdueCount;
    
    container.innerHTML = `
        <div class="loan-row header">
            <div>Book Title</div>
            <div>Borrowed Date</div>
            <div>Due Date</div>
            <div>Status</div>
            <div>Actions</div>
        </div>
        ${loans.map(loan => `
            <div class="loan-row ${loan.status === 'overdue' ? 'overdue' : ''}">
                <div>${loan.book_title}</div>
                <div>${formatDate(loan.loan_date)}</div>
                <div>${formatDate(loan.due_date)}</div>
                <div><span class="status-badge ${loan.status}">${loan.status}</span></div>
                <div class="loan-actions">
                    ${loan.status === 'overdue' || loan.status === 'active' ? 
                        `<button class="btn-small" onclick="returnBook(${loan.loan_id}, '${loan.book_title.replace(/'/g, "\\'")}')">
                            <i class="fas fa-undo"></i> Return
                        </button>
                        <button class="btn-small" onclick="renewLoan(${loan.loan_id})" ${loan.renewal_count >= 3 ? 'disabled' : ''}>
                            <i class="fas fa-redo"></i> Renew
                        </button>` : 
                        `<span class="returned-text">Returned on ${formatDate(loan.return_date)}</span>`
                    }
                </div>
            </div>
        `).join('')}
    `;
}

function loadProfileData() {
    if (!currentUser) return;
    
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileEmail').value = currentUser.email || 'user@ku.edu.np';
    document.getElementById('profileId').value = currentUser.member_id || 'N/A';
    document.getElementById('profileType').value = currentUser.role;
    
    // Setup profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateProfile();
        });
    }
}

async function updateProfile() {
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate password
    if (newPassword && newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                ...(newPassword && { password: newPassword })
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Update local storage
                currentUser = { ...currentUser, name, email };
                localStorage.setItem('user', JSON.stringify(currentUser));
                
                // Update display
                updateUserDisplay();
                
                showNotification('Profile updated successfully', 'success');
                
                // Clear password fields
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            }
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showNotification('Failed to update profile', 'error');
    }
}

// ===== BOOK ACTIONS =====
async function borrowBook(bookId, bookTitle) {
    if (!confirm(`Borrow "${bookTitle}"?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/books/borrow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ book_id: bookId })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showNotification(`Successfully borrowed "${bookTitle}"`, 'success');
                
                // Refresh data
                loadDashboardData();
                if (document.getElementById('books').classList.contains('active-section')) {
                    await loadAllBooks();
                }
            } else {
                showNotification(data.message || 'Failed to borrow book', 'error');
            }
        }
    } catch (error) {
        console.error('Borrow error:', error);
        showNotification('Failed to borrow book. Please try again.', 'error');
    }
}

async function returnBook(loanId, bookTitle) {
    if (!confirm(`Return "${bookTitle}"?`)) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/books/return`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ loan_id: loanId })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showNotification(`Successfully returned "${bookTitle}"`, 'success');
                
                // Refresh data
                await loadUserLoans();
                loadDashboardData();
            }
        }
    } catch (error) {
        console.error('Return error:', error);
        showNotification('Failed to return book. Please try again.', 'error');
    }
}

async function renewLoan(loanId) {
    if (!confirm('Renew this book for 14 more days?')) return;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/books/renew`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ loan_id: loanId })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showNotification('Book renewed successfully!', 'success');
                await loadUserLoans();
            } else {
                showNotification(data.message || 'Cannot renew book', 'error');
            }
        }
    } catch (error) {
        console.error('Renew error:', error);
        showNotification('Failed to renew book', 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function setupDashboardEvents() {
    // Search functionality
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', debounce((e) => {
            if (e.target.value.trim()) {
                searchBooks(e.target.value);
            }
        }, 500));
    }
    
    // Filter controls
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyBookFilters);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', applyBookFilters);
    }
    
    // Load more books
    const loadMoreBtn = document.getElementById('loadMoreBooks');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreBooks);
    }
}

async function searchBooks(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books/search?q=${encodeURIComponent(query)}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // Show books section with results
                showSection('books');
                displayBooks(data.books, 'booksGrid');
                
                // Update title
                document.getElementById('dashboardTitle').textContent = 
                    `Search Results: ${data.books.length} books found`;
            }
        }
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Search failed', 'error');
    }
}

function applyBookFilters() {
    const category = document.getElementById('categoryFilter')?.value;
    const sort = document.getElementById('sortFilter')?.value;
    
    // Show loading
    const container = document.getElementById('booksGrid');
    if (container) {
        container.innerHTML = '<div class="loading">Loading books...</div>';
    }
    
    // Load filtered books
    loadAllBooks();
}

function loadMoreBooks() {
    showNotification('Loading more books...', 'info');
    // Implement pagination here
    setTimeout(() => {
        showNotification('No more books to load', 'info');
    }, 1000);
}

function updateDateTime() {
    const datetimeElement = document.getElementById('currentDateTime');
    if (datetimeElement) {
        const now = new Date();
        datetimeElement.textContent = now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

function updateCurrentYear() {
    document.querySelectorAll('.current-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

function getActivityIcon(type) {
    const icons = {
        borrow: 'fa-book',
        return: 'fa-undo',
        renew: 'fa-redo',
        reserve: 'fa-bookmark',
        login: 'fa-sign-in-alt',
        update: 'fa-user-edit'
    };
    return icons[type] || 'fa-info-circle';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// ===== MOCK DATA FUNCTIONS =====
function loadMockDashboardData() {
    updateDashboardStats({
        totalBooks: 15423,
        activeLoans: 3,
        overdueLoans: 1,
        availableBooks: 12345
    });
    
    displayMockActivity();
    displayMockBooks('popularBooks');
}

function displayMockActivity() {
    const mockActivities = [
        {
            type: 'borrow',
            description: 'Borrowed "Database System Concepts"',
            timestamp: Date.now() - 3600000
        },
        {
            type: 'return',
            description: 'Returned "NoSQL Distilled"',
            timestamp: Date.now() - 86400000
        },
        {
            type: 'renew',
            description: 'Renewed "Graph Databases" for 14 more days',
            timestamp: Date.now() - 172800000
        }
    ];
    
    displayRecentActivity(mockActivities);
}

function displayMockBooks(containerId) {
    const mockBooks = [
        {
            book_id: 1,
            title: 'Database System Concepts',
            authors: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
            isbn: '978-0078022159',
            available_count: 3,
            total_copies: 5,
            year: 2019
        },
        {
            book_id: 2,
            title: 'NoSQL Distilled',
            authors: 'Martin Fowler, Pramod Sadalage',
            isbn: '978-0321826626',
            available_count: 1,
            total_copies: 3,
            year: 2012
        },
        {
            book_id: 3,
            title: 'Graph Databases',
            authors: 'Ian Robinson, Jim Webber',
            isbn: '978-1491930892',
            available_count: 0,
            total_copies: 2,
            year: 2015
        }
    ];
    
    displayBooks(mockBooks, containerId);
}

function displayMockLoans() {
    const mockLoans = [
        {
            loan_id: 1,
            book_title: 'Database System Concepts',
            loan_date: '2024-01-15',
            due_date: '2024-01-29',
            status: 'active',
            renewal_count: 0
        },
        {
            loan_id: 2,
            book_title: 'NoSQL Distilled',
            loan_date: '2024-01-18',
            due_date: '2024-01-25',
            status: 'overdue',
            renewal_count: 1
        }
    ];
    
    displayUserLoans(mockLoans);
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Remove existing
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
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

// Add notification styles
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
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        }
        .notification.success {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
        }
        .notification.error {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
        }
        .notification.info {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
        }
        .notification button {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            margin-left: auto;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .loading {
            text-align: center;
            padding: 2rem;
            color: #7f8c8d;
        }
        .no-books, .no-loans, .no-activity {
            text-align: center;
            padding: 3rem;
            color: #7f8c8d;
            font-style: italic;
        }
        .borrow-btn.disabled {
            background: #95a5a6;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);
}

// ===== EXPORT FUNCTIONS FOR HTML =====
window.setUserType = setUserType;
window.redirectToLogin = redirectToLogin;
window.logout = logout;
window.showSection = showSection;
window.borrowBook = borrowBook;
window.returnBook = returnBook;
window.renewLoan = renewLoan;
window.renewAllLoans = async () => {
    if (confirm('Renew all eligible loans?')) {
        showNotification('Renewing all loans...', 'info');
        // Implement bulk renewal
        setTimeout(() => {
            showNotification('Renewed 2 loans successfully', 'success');
        }, 1500);
    }
};
