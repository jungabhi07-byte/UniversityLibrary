// KU Library Management System - Frontend JavaScript
// Configuration
// Change this line in frontend/script.js
const API_BASE_URL = 'https://kulibrary-auth.budhathokiabhishek06.workers.dev';

// Authentication Service
const auth = {
    token: localStorage.getItem('kulibrary_token'),
    user: JSON.parse(localStorage.getItem('kulibrary_user') || 'null'),
    sessionId: localStorage.getItem('kulibrary_session'),

    // Initialize authentication
    init() {
        this.setupEventListeners();
        this.checkSession();
        
        // Auto-focus email field
        document.getElementById('email')?.focus();
    },

    // Setup event listeners
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Password toggle
        const toggleBtn = document.getElementById('togglePassword');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const icon = toggleBtn.querySelector('i');
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }

        // Password strength indicator
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', this.showPasswordStrength);
        }

        // Modal controls
        this.setupModalControls();
    },

    // Handle login
    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Validation
        if (!email || !password) {
            this.showError('Please enter both email and password');
            return;
        }

        if (!email.includes('@')) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Show loading state
        this.setLoading(true);

        try {
            // Send login request
            const response = await fetch(API_BASE_URL + '/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Store authentication data
                this.token = data.session.id;
                this.user = data.user;
                this.sessionId = data.session.id;

                localStorage.setItem('kulibrary_token', this.token);
                localStorage.setItem('kulibrary_user', JSON.stringify(this.user));
                localStorage.setItem('kulibrary_session', this.sessionId);

                if (rememberMe) {
                    localStorage.setItem('kulibrary_remember', 'true');
                }

                // Show success message
                this.showSuccess('Login successful! Redirecting to dashboard...');

                // Redirect to dashboard after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);

            } else {
                this.showError(data.message || 'Invalid credentials');
                // Clear password field
                document.getElementById('password').value = '';
                document.getElementById('password').focus();
            }

        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please check your connection and try again.');
        } finally {
            this.setLoading(false);
        }
    },

    // Check session validity
    async checkSession() {
        if (!this.token) return;

        try {
            const response = await fetch(API_BASE_URL + '/api/auth/verify', {
                headers: {
                    'X-Session-ID': this.token
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.user = data.user;
                    localStorage.setItem('kulibrary_user', JSON.stringify(data.user));
                    
                    // Redirect to dashboard if on login page
                    if (window.location.pathname.includes('index.html')) {
                        window.location.href = 'dashboard.html';
                    }
                }
            }
        } catch (error) {
            console.log('Session check failed:', error);
        }
    },

    // Logout
    async logout() {
        try {
            await fetch(API_BASE_URL + '/api/auth/logout', {
                method: 'POST',
                headers: {
                    'X-Session-ID': this.token
                }
            });
        } catch (error) {
            console.log('Logout error:', error);
        } finally {
            this.clearAuthData();
            window.location.href = 'index.html';
        }
    },

    // Clear authentication data
    clearAuthData() {
        this.token = null;
        this.user = null;
        this.sessionId = null;
        
        localStorage.removeItem('kulibrary_token');
        localStorage.removeItem('kulibrary_user');
        localStorage.removeItem('kulibrary_session');
        localStorage.removeItem('kulibrary_remember');
    },

    // Show loading state
    setLoading(isLoading) {
        const button = document.getElementById('loginButton');
        const loading = document.getElementById('loginLoading');
        
        if (button && loading) {
            button.disabled = isLoading;
            if (isLoading) {
                loading.style.display = 'block';
                button.querySelector('span').style.opacity = '0.5';
            } else {
                loading.style.display = 'none';
                button.querySelector('span').style.opacity = '1';
            }
        }
    },

    // Show error message
    showError(message, details = '') {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        const errorCode = document.getElementById('errorCode');
        
        if (errorMessage) errorMessage.textContent = message;
        if (errorCode) errorCode.textContent = details;
        
        // Show modal
        errorModal.style.display = 'flex';
        
        // Add animation
        setTimeout(() => {
            errorModal.classList.add('active');
        }, 10);
    },

    // Show success message
    showSuccess(message) {
        // Create success notification
        const notification = document.createElement('div');
        notification.className = 'success-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #00B894;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },

    // Password strength indicator
    showPasswordStrength() {
        const password = this.value;
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        const passwordStrength = document.getElementById('passwordStrength');
        
        if (!password) {
            passwordStrength.style.display = 'none';
            return;
        }
        
        passwordStrength.style.display = 'block';
        
        // Calculate strength
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        // Update UI
        const percent = (strength / 5) * 100;
        strengthBar.style.width = percent + '%';
        
        if (strength <= 1) {
            strengthBar.style.background = '#D63031';
            strengthText.textContent = 'Weak';
        } else if (strength <= 3) {
            strengthBar.style.background = '#FDCB6E';
            strengthText.textContent = 'Medium';
        } else {
            strengthBar.style.background = '#00B894';
            strengthText.textContent = 'Strong';
        }
    },

    // Setup modal controls
    setupModalControls() {
        // Error modal
        const errorModal = document.getElementById('errorModal');
        const closeError = document.getElementById('closeError');
        const retryLogin = document.getElementById('retryLogin');
        const showErrorDetails = document.getElementById('showErrorDetails');
        const errorDetails = document.getElementById('errorDetails');
        
        if (closeError) {
            closeError.addEventListener('click', () => {
                errorModal.classList.remove('active');
                setTimeout(() => {
                    errorModal.style.display = 'none';
                }, 300);
            });
        }
        
        if (retryLogin) {
            retryLogin.addEventListener('click', () => {
                errorModal.classList.remove('active');
                setTimeout(() => {
                    errorModal.style.display = 'none';
                    document.getElementById('password').focus();
                }, 300);
            });
        }
        
        if (showErrorDetails) {
            showErrorDetails.addEventListener('click', () => {
                const isVisible = errorDetails.style.display === 'block';
                errorDetails.style.display = isVisible ? 'none' : 'block';
                showErrorDetails.innerHTML = isVisible ? 
                    '<i class="fas fa-code"></i> Show Technical Details' :
                    '<i class="fas fa-eye-slash"></i> Hide Technical Details';
            });
        }

        // Forgot password modal
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        const forgotPasswordModal = document.getElementById('forgotPasswordModal');
        const cancelRecovery = document.getElementById('cancelRecovery');
        const sendRecovery = document.getElementById('sendRecovery');
        
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                forgotPasswordModal.style.display = 'flex';
                setTimeout(() => {
                    forgotPasswordModal.classList.add('active');
                }, 10);
            });
        }
        
        if (cancelRecovery) {
            cancelRecovery.addEventListener('click', () => {
                forgotPasswordModal.classList.remove('active');
                setTimeout(() => {
                    forgotPasswordModal.style.display = 'none';
                }, 300);
            });
        }
        
        if (sendRecovery) {
            sendRecovery.addEventListener('click', () => {
                const email = document.getElementById('recoveryEmail').value;
                if (email && email.includes('@')) {
                    alert('Password reset link sent to ' + email + '\n\n(This is a demo. In production, an email would be sent.)');
                    forgotPasswordModal.classList.remove('active');
                    setTimeout(() => {
                        forgotPasswordModal.style.display = 'none';
                    }, 300);
                } else {
                    alert('Please enter a valid email address');
                }
            });
        }

        // Demo modal (hidden by default)
        const demoModal = document.getElementById('demoModal');
        const hideDemo = document.getElementById('hideDemo');
        const useDemo = document.getElementById('useDemo');
        
        // Only show demo modal for testing (press Ctrl+Shift+D)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                demoModal.style.display = 'flex';
                setTimeout(() => {
                    demoModal.classList.add('active');
                }, 10);
            }
        });
        
        if (hideDemo) {
            hideDemo.addEventListener('click', () => {
                demoModal.classList.remove('active');
                setTimeout(() => {
                    demoModal.style.display = 'none';
                }, 300);
            });
        }
        
        if (useDemo) {
            useDemo.addEventListener('click', () => {
                document.getElementById('email').value = 'staff@kulibrary.edu.np';
                document.getElementById('password').value = 'Staff@2024';
                document.getElementById('rememberMe').checked = true;
                demoModal.classList.remove('active');
                setTimeout(() => {
                    demoModal.style.display = 'none';
                }, 300);
                document.getElementById('loginForm').dispatchEvent(new Event('submit'));
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
                setTimeout(() => {
                    e.target.style.display = 'none';
                }, 300);
            }
        });
    }
};

// Dashboard Functions
const dashboard = {
    // Initialize dashboard
    init() {
        if (!auth.token || !auth.user) {
            window.location.href = 'index.html';
            return;
        }

        this.updateUserInfo();
        this.loadDashboardData();
        this.setupDashboardEvents();
    },

    // Update user information in dashboard
    updateUserInfo() {
        const user = auth.user;
        if (!user) return;

        // Update welcome message
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement) {
            welcomeElement.innerHTML = `
                Welcome back, <strong>${user.fullName}</strong>!
                <span class="user-role ${user.role}">${user.role.toUpperCase()}</span>
            `;
        }

        // Update profile card
        const profileCard = document.getElementById('profileCard');
        if (profileCard) {
            profileCard.innerHTML = `
                <div class="profile-header">
                    <img src="${user.avatar}" alt="${user.fullName}" class="profile-avatar">
                    <div class="profile-info">
                        <h3>${user.fullName}</h3>
                        <p class="user-email">${user.email}</p>
                        <span class="user-badge ${user.role}">${user.role}</span>
                    </div>
                </div>
                <div class="profile-details">
                    ${user.studentId ? `<p><i class="fas fa-id-card"></i> ${user.studentId}</p>` : ''}
                    ${user.department ? `<p><i class="fas fa-building"></i> ${user.department}</p>` : ''}
                    ${user.phone ? `<p><i class="fas fa-phone"></i> ${user.phone}</p>` : ''}
                    <p><i class="fas fa-calendar-alt"></i> Member since ${user.joinDate}</p>
                </div>
            `;
        }

        // Update user role specific elements
        this.updateRoleSpecificUI(user.role);
    },

    // Update UI based on user role
    updateRoleSpecificUI(role) {
        // Show/hide admin controls
        const adminControls = document.querySelectorAll('.admin-only');
        const staffControls = document.querySelectorAll('.staff-only');
        const studentControls = document.querySelectorAll('.student-only');

        adminControls.forEach(el => {
            el.style.display = role === 'admin' ? 'block' : 'none';
        });

        staffControls.forEach(el => {
            el.style.display = role === 'staff' || role === 'admin' ? 'block' : 'none';
        });

        studentControls.forEach(el => {
            el.style.display = role === 'student' ? 'block' : 'none';
        });
    },

    // Load dashboard data
    async loadDashboardData() {
        try {
            // Load statistics
            const statsResponse = await fetch(API_BASE_URL + '/api/stats/dashboard', {
                headers: {
                    'X-Session-ID': auth.token
                }
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                this.updateStatistics(statsData.dashboard);
            }

            // Load user profile
            const profileResponse = await fetch(API_BASE_URL + '/api/auth/profile', {
                headers: {
                    'X-Session-ID': auth.token
                }
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                this.updateUserStatistics(profileData.profile);
            }

            // Load books
            this.loadBooks();

            // Load recent activity
            this.loadRecentActivity();

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    },

    // Update statistics on dashboard
    updateStatistics(stats) {
        // Update cards
        const updateCard = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                // Animate number
                this.animateValue(element, 0, value, 1000);
            }
        };

        if (stats.today) {
            updateCard('todayLoans', stats.today.loans);
            updateCard('todayBooks', stats.today.newBooks);
            updateCard('todayUsers', stats.today.newUsers);
        }

        if (stats.weekly) {
            updateCard('weeklyLoans', stats.weekly.loans);
        }

        if (stats.alerts) {
            updateCard('overdueAlerts', stats.alerts.overdue);
            updateCard('lowStockAlerts', stats.alerts.lowStock);
        }
    },

    // Animate number values
    animateValue(element, start, end, duration) {
        const range = end - start;
        const startTime = performance.now();
        const step = (timestamp) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = start + (range * progress);
            element.textContent = Math.floor(value);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        requestAnimationFrame(step);
    },

    // Update user statistics
    updateUserStatistics(profile) {
        const stats = profile.statistics;
        const updateStat = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                this.animateValue(element, 0, value, 1000);
            }
        };

        updateStat('userTotalLoans', stats.totalLoans);
        updateStat('userActiveLoans', stats.activeLoans);
        updateStat('userOverdueLoans', stats.overdueLoans);
        updateStat('userTotalFines', stats.totalFines);
    },

    // Load books
    async loadBooks() {
        try {
            const response = await fetch(API_BASE_URL + '/api/books', {
                headers: {
                    'X-Session-ID': auth.token
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayBooks(data.books);
            }
        } catch (error) {
            console.error('Failed to load books:', error);
        }
    },

    // Display books in grid
    displayBooks(books) {
        const booksGrid = document.getElementById('booksGrid');
        if (!booksGrid) return;

        booksGrid.innerHTML = books.map(book => `
            <div class="book-card" data-id="${book.id}">
                <div class="book-cover">
                    <img src="${book.coverImage || 'https://via.placeholder.com/150x200?text=No+Cover'}" 
                         alt="${book.title}">
                    <div class="book-status ${book.availableCopies > 0 ? 'available' : 'unavailable'}">
                        ${book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Out of Stock'}
                    </div>
                </div>
                <div class="book-info">
                    <h4 class="book-title">${book.title}</h4>
                    <p class="book-authors">${book.authors.join(', ')}</p>
                    <div class="book-meta">
                        <span class="book-year">${book.year}</span>
                        <span class="book-isbn">${book.isbn}</span>
                    </div>
                    <div class="book-actions">
                        <button class="btn-view" onclick="dashboard.viewBook('${book.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${book.canBorrow ? `
                            <button class="btn-borrow" onclick="dashboard.borrowBook('${book.id}')">
                                <i class="fas fa-book-reader"></i> Borrow
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Load recent activity
    async loadRecentActivity() {
        try {
            const response = await fetch(API_BASE_URL + '/api/loans?status=active&limit=5', {
                headers: {
                    'X-Session-ID': auth.token
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayRecentActivity(data.loans);
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
        }
    },

    // Display recent activity
    displayRecentActivity(loans) {
        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        activityList.innerHTML = loans.map(loan => `
            <div class="activity-item ${loan.isOverdue ? 'overdue' : ''}">
                <div class="activity-icon">
                    <i class="fas fa-${loan.status === 'active' ? 'book-reader' : 'book-return'}"></i>
                </div>
                <div class="activity-details">
                    <h5>${loan.book?.title || 'Unknown Book'}</h5>
                    <p>${loan.user?.name || 'Unknown User'} • Due: ${loan.dueDate}</p>
                    ${loan.isOverdue ? `
                        <span class="overdue-badge">
                            <i class="fas fa-exclamation-triangle"></i>
                            ${loan.daysOverdue} days overdue
                        </span>
                    ` : ''}
                </div>
                <div class="activity-time">
                    ${this.formatTimeAgo(loan.issueDate)}
                </div>
            </div>
        `).join('');
    },

    // Format time ago
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    },

    // Setup dashboard event listeners
    setupDashboardEvents() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => auth.logout());
        }

        // Search functionality
        const searchInput = document.getElementById('searchBooks');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.searchBooks(searchInput.value);
            }, 300));
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadDashboardData());
        }
    },

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Search books
    async searchBooks(query) {
        if (!query.trim()) {
            this.loadBooks();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/books/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'X-Session-ID': auth.token
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayBooks(data.results);
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    },

    // View book details
    async viewBook(bookId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/books/${bookId}`, {
                headers: {
                    'X-Session-ID': auth.token
                }
            });

            if (response.ok) {
                const book = await response.json();
                this.showBookModal(book);
            }
        } catch (error) {
            console.error('Failed to load book:', error);
        }
    },

    // Show book modal
    showBookModal(book) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-book"></i> ${book.title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="book-details">
                        <img src="${book.coverImage}" alt="${book.title}" class="book-detail-cover">
                        <div class="book-detail-info">
                            <p><strong>Authors:</strong> ${book.authors.join(', ')}</p>
                            <p><strong>ISBN:</strong> ${book.isbn}</p>
                            <p><strong>Year:</strong> ${book.year}</p>
                            <p><strong>Publisher:</strong> ${book.publisher}</p>
                            <p><strong>Category:</strong> ${book.category}</p>
                            <p><strong>Location:</strong> ${book.location}</p>
                            <p><strong>Available Copies:</strong> ${book.availableCopies}/${book.totalCopies}</p>
                            <p><strong>Description:</strong> ${book.description}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    ${book.availableCopies > 0 ? `
                        <button class="btn-primary" onclick="dashboard.borrowBook('${book.id}')">
                            <i class="fas fa-book-reader"></i> Borrow This Book
                        </button>
                    ` : ''}
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    // Borrow book
    async borrowBook(bookId) {
        if (!confirm('Are you sure you want to borrow this book?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/loans/issue`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': auth.token
                },
                body: JSON.stringify({ bookId })
            });

            const data = await response.json();

            if (data.success) {
                alert('Book borrowed successfully! Due date: ' + data.dueDate);
                this.loadDashboardData(); // Refresh data
            } else {
                alert('Failed to borrow book: ' + data.message);
            }
        } catch (error) {
            console.error('Borrow failed:', error);
            alert('Network error. Please try again.');
        }
    }
};

// Initialize based on current page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('index.html') || 
        window.location.pathname === '/') {
        auth.init();
    } else if (window.location.pathname.includes('dashboard.html')) {
        dashboard.init();
    }
});

// Export for global access
window.auth = auth;
window.dashboard = dashboard;
