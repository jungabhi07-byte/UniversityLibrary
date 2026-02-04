// KU Library Authentication Helper
// Save as script.js

class AuthService {
    constructor() {
        this.apiBaseUrl = 'https://your-worker-name.your-username.workers.dev';
        this.token = localStorage.getItem('kulibrary_token');
        this.user = JSON.parse(localStorage.getItem('kulibrary_user') || 'null');
    }
    
    // Check if user is logged in
    isLoggedIn() {
        return !!this.token && !!this.user;
    }
    
    // Get current user
    getCurrentUser() {
        return this.user;
    }
    
    // Get user role
    getUserRole() {
        return this.user?.role || 'guest';
    }
    
    // Check if user has specific role
    hasRole(role) {
        return this.user?.role === role;
    }
    
    // Check if user has permission
    hasPermission(permission) {
        return this.user?.permissions?.includes(permission) || false;
    }
    
    // Login
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                
                // Save to localStorage
                localStorage.setItem('kulibrary_token', data.token);
                localStorage.setItem('kulibrary_user', JSON.stringify(data.user));
                
                return { success: true, data };
            } else {
                return { success: false, error: data.message };
            }
            
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }
    
    // Logout
    async logout() {
        if (this.token) {
            try {
                await fetch(`${this.apiBaseUrl}/api/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            } catch (error) {
                // Ignore errors on logout
            }
        }
        
        // Clear local storage
        this.clearStorage();
        return { success: true };
    }
    
    // Verify token
    async verifyToken() {
        if (!this.token) {
            return { valid: false };
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.user = data.user;
                localStorage.setItem('kulibrary_user', JSON.stringify(data.user));
                return { valid: true, user: data.user };
            } else {
                this.clearStorage();
                return { valid: false };
            }
            
        } catch (error) {
            return { valid: false, error: 'Network error' };
        }
    }
    
    // Get profile
    async getProfile() {
        if (!this.token) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.user = data.profile;
                localStorage.setItem('kulibrary_user', JSON.stringify(data.profile));
                return { success: true, profile: data.profile };
            } else {
                return { success: false, error: data.message };
            }
            
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }
    
    // Change password
    async changePassword(currentPassword, newPassword) {
        if (!this.token) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, message: data.message };
            } else {
                return { success: false, error: data.message };
            }
            
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }
    
    // Clear storage
    clearStorage() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('kulibrary_token');
        localStorage.removeItem('kulibrary_user');
        localStorage.removeItem('kulibrary_remember');
    }
    
    // Redirect to login if not authenticated
    requireAuth(role = null) {
        if (!this.isLoggedIn()) {
            window.location.href = 'index.html';
            return false;
        }
        
        if (role && !this.hasRole(role)) {
            window.location.href = 'unauthorized.html';
            return false;
        }
        
        return true;
    }
}

// Create global auth instance
const auth = new AuthService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthService, auth };
}
