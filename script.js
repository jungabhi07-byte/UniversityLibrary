// ===== CONFIGURATION =====
const API_BASE_URL = 'https://kulibrary-auth.budhathokiabhishek06.workers.dev';
let currentUser = null;
let authToken = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📚 KU Library System Initialized');
    console.log('🔗 API:', API_BASE_URL);
    
    // Check API health
    checkAPIHealth();
    
    // Check auth status
    checkAuthStatus();
    
    // Initialize based on page
    initPage();
});

// ===== API HEALTH CHECK =====
async function checkAPIHealth() {
    const statusElement = document.getElementById('apiStatus') || 
                         document.getElementById('apiStatusMini') ||
                         document.getElementById('connectionStatus');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        const data = await response.json();
        
        if (statusElement) {
            statusElement.innerHTML = '<i class="fas fa-check-circle"></i> API Connected';
            statusElement.className = statusElement.className.replace(/\bapi-status\S*/g, '') + ' api-status connected';
        }
        
        console.log('✅ API Health:', data);
        return true;
    } catch (error) {
        console.error('❌ API Connection Failed:', error);
        
        if (statusElement) {
            statusElement.innerHTML = '<i class="fas fa-times-circle"></i> API Connection Failed';
            statusElement.className = statusElement.className.replace(/\bapi-status\S*/g, '') + ' api-status error';
        }
        
        return false;
    }
}

// ===== AUTHENTICATION =====
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        
        // Update UI if on dashboard
        updateUserInfo();
        
        return true;
    }
    return false;
}

function updateUserInfo() {
    if (!currentUser) return;
    
    const userNameElement = document.getElementById('userName');
    const userRoleElement = document.getElementById('userRole');
    
    if (userNameElement) userNameElement.textContent = currentUser.name || 'User';
    if (userRoleElement) userRoleElement.textContent = currentUser.role || 'Member';
}

// ===== PAGE INITIALIZATION =====
function initPage() {
    const path = window.location.pathname;
    
    if (path.includes('login.html')) {
        initLoginPage();
    } else if (path.includes('dashboard.html')) {
        initDashboardPage();
    } else {
        initHomePage();
    }
}

function initHomePage() {
    // Home page specific initialization
    console.log('🏠 Home page initialized');
}

function initLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Auto-fill demo credentials
    document.getElementById('email').value = 'student@ku.edu.np';
    document.getElementById('password').value = 'Student@123';
}

function initDashboardPage() {
    if (!checkAuthStatus()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Load dashboard data
    loadDashboardData();
    
    // Setup navigation
    setupDashboardNavigation();
}

// ===== LOGIN HANDLER =====
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.innerHTML;
    
    // Show loading
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    loginBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password,
                userType: 'student'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store auth data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showNotification('Login successful! Redirecting...', 'success');
            
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
        
        // Reset button
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }
}

// ===== DASHBOARD FUNCTIONS =====
async function loadDashboardData() {
    try {
        // Load books
        await loadBooks();
        
        // Update stats
        updateDashboardStats();
        
    } catch (error) {
        console.error('Dashboard data error:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

async function loadBooks() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/books`);
        const data = await response.json();
        
        if (data.success) {
            displayBooks(data.books || data.data);
        }
    } catch (error) {
        console.error('Books error:', error);
        displayMockBooks();
    }
}

function displayBooks(books) {
    const booksGrid = document.getElementById('booksGrid');
    const allBooks = document.getElementById('allBooks');
    
    if (!books || books.length === 0) {
        const noBooksMsg = '<div class="no-books">No books available</div>';
        if (booksGrid) booksGrid.innerHTML = noBooksMsg;
        if (allBooks) allBooks.innerHTML = noBooksMsg;
        return;
    }
    
    const booksHtml = books.map(book => `
        <div class="book-card">
            <h4>${book.title || 'Unknown Title'}</h4>
            <p><strong>Author:</strong> ${book.author || book.authors || 'Unknown'}</p>
            <p><strong>ISBN:</strong> ${book.isbn || 'N/A'}</p>
            <p><strong>Available:</strong> ${book.available_copies || book.copies || 0} copies</p>
            <button class="borrow-btn" onclick="borrowBook('${book.book_id || book.id}')">
                <i class="fas fa-book"></i> Borrow
            </button>
        </div>
    `).join('');
    
    if (booksGrid) booksGrid.innerHTML = booksHtml;
    if (allBooks) allBooks.innerHTML = booksHtml;
}

function displayMockBooks() {
    const mockBooks = [
        { book_id: 1, title: 'Database System Concepts', author: 'Abraham Silberschatz', isbn: '978-0078022159', copies: 5 },
        { book_id: 2, title: 'NoSQL Distilled', author: 'Martin Fowler', isbn: '978-0321826626', copies: 3 },
        { book_id: 3, title: 'Graph Databases', author: 'Ian Robinson', isbn: '978-1491930892', copies: 2 }
    ];
    
    displayBooks(mockBooks);
}

function updateDashboardStats() {
    // Update stats cards
    const totalBooksElement = document.getElementById('totalBooks');
    if (totalBooksElement) {
        // You can fetch actual stats from your API when available
        totalBooksElement.textContent = '5'; // From your sample data
    }
}

function setupDashboardNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                // Hide all sections
                document.querySelectorAll('.dashboard-section').forEach(section => {
                    section.style.display = 'none';
                });
                
                // Show selected section
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.style.display = 'block';
                    
                    // Update page title
                    const pageTitle = document.getElementById('pageTitle');
                    if (pageTitle) {
                        pageTitle.textContent = this.textContent.replace(/[^a-zA-Z\s]/g, '');
                    }
                }
                
                // Update active nav
                navLinks.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// ===== BOOK ACTIONS =====
async function borrowBook(bookId) {
    if (!authToken) {
        showNotification('Please login first', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/books/borrow`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ book_id: bookId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Book borrowed successfully!', 'success');
            // Refresh books
            await loadBooks();
