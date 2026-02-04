// Configuration
// IMPORTANT: Change this to your actual Cloudflare Worker URL
const API_BASE_URL = 'https://library-api.budhathokiabhishek.workers.dev';
// For testing, you can use a mock server first:
// const API_BASE_URL = 'https://library-api.your-username.workers.dev';

let currentBooks = [];
let currentMembers = [];
let currentPage = 1;
const BOOKS_PER_PAGE = 9;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Library System Initializing...');
    
    // Load initial data
    loadDashboardStats();
    loadBooks();
    loadMembers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check API status every 30 seconds
    setInterval(checkAPIStatus, 30000);
});

// Setup all event listeners
function setupEventListeners() {
    // Search functionality
    document.getElementById('searchBtn').addEventListener('click', searchBooks);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchBooks();
    });
    
    // Load more books
    document.getElementById('loadMoreBtn').addEventListener('click', loadMoreBooks);
    
    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Update connection status
function updateConnectionStatus(message, type = 'info') {
    const alert = document.getElementById('connectionAlert');
    const text = document.getElementById('connectionText');
    
    // Remove all existing classes
    alert.className = 'alert';
    
    // Add appropriate class
    switch(type) {
        case 'success':
            alert.classList.add('alert-success');
            break;
        case 'warning':
            alert.classList.add('alert-warning');
            break;
        case 'danger':
            alert.classList.add('alert-danger');
            break;
        default:
            alert.classList.add('alert-info');
    }
    
    text.textContent = message;
    
    // Update API and DB status badges
    if (message.includes('connected') || message.includes('success')) {
        document.getElementById('apiStatus').innerHTML = '<i class="fas fa-circle"></i> API: Connected';
        document.getElementById('apiStatus').className = 'badge bg-success';
        document.getElementById('dbStatus').innerHTML = '<i class="fas fa-circle"></i> Database: Online';
        document.getElementById('dbStatus').className = 'badge bg-success';
    } else if (message.includes('error') || message.includes('failed')) {
        document.getElementById('apiStatus').innerHTML = '<i class="fas fa-circle"></i> API: Error';
        document.getElementById('apiStatus').className = 'badge bg-danger';
        document.getElementById('dbStatus').innerHTML = '<i class="fas fa-circle"></i> Database: Offline';
        document.getElementById('dbStatus').className = 'badge bg-danger';
    }
}

// Show/hide loading indicator
function setLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// Check API status
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            updateConnectionStatus('API and database connection healthy', 'success');
        } else {
            updateConnectionStatus('API connection issue detected', 'warning');
        }
    } catch (error) {
        updateConnectionStatus('Cannot connect to API server', 'danger');
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const stats = await response.json();
        
        // Update UI with animation
        animateCounter('totalBooks', stats.total_books || 0);
        animateCounter('totalMembers', stats.total_members || 0);
        animateCounter('activeLoans', stats.active_loans || 0);
        animateCounter('overdueBooks', stats.overdue_books || 0);
        
        updateConnectionStatus('Successfully connected to database', 'success');
        
    } catch (error) {
        console.error('Error loading stats:', error);
        
        // Fallback to mock data for demonstration
        animateCounter('totalBooks', 42);
        animateCounter('totalMembers', 15);
        animateCounter('activeLoans', 8);
        animateCounter('overdueBooks', 2);
        
        updateConnectionStatus('Using demo data - API connection failed', 'warning');
    }
}

// Animate counter from 0 to target value
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const current = parseInt(element.textContent) || 0;
    const increment = targetValue > current ? 1 : -1;
    let currentValue = current;
    
    const timer = setInterval(() => {
        currentValue += increment;
        element.textContent = currentValue;
        
        if (currentValue === targetValue) {
            clearInterval(timer);
        }
    }, 30);
}

// Load books from API
async function loadBooks() {
    setLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/books`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch books: ${response.status}`);
        }
        
        currentBooks = await response.json();
        displayBooks(currentBooks.slice(0, BOOKS_PER_PAGE));
        updateLoadMoreButton();
        
    } catch (error) {
        console.error('Error loading books:', error);
        
        // Mock data for demonstration
        currentBooks = getMockBooks();
        displayBooks(currentBooks.slice(0, BOOKS_PER_PAGE));
        updateLoadMoreButton();
        
        updateConnectionStatus('Displaying demo data - API connection failed', 'warning');
    }
    setLoading(false);
}

// Load more books
function loadMoreBooks() {
    currentPage++;
    const startIndex = 0;
    const endIndex = currentPage * BOOKS_PER_PAGE;
    const moreBooks = currentBooks.slice(startIndex, endIndex);
    displayBooks(moreBooks);
    updateLoadMoreButton();
}

// Update load more button visibility
function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const displayedCount = document.querySelectorAll('#booksContainer .book-card').length;
    loadMoreBtn.style.display = displayedCount < currentBooks.length ? 'block' : 'none';
}

// Display books in grid
function displayBooks(books) {
    const container = document.getElementById('booksContainer');
    
    // Clear container if it's first page
    if (currentPage === 1) {
        container.innerHTML = '';
    }
    
    if (books.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-book fa-4x text-muted mb-4"></i>
                <h4 class="text-muted">No books found</h4>
                <p class="text-muted">Try a different search or check back later</p>
            </div>
        `;
        return;
    }
    
    books.forEach((book, index) => {
        const bookCard = createBookCard(book, index);
        container.appendChild(bookCard);
    });
    
    // Add animation to new cards
    const newCards = container.querySelectorAll('.book-card:not(.fade-in)');
    newCards.forEach(card => {
        card.classList.add('fade-in');
    });
}

// Create book card HTML
function createBookCard(book, index) {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6';
    
    // Generate random color for book cover
    const colors = [
        'linear-gradient(135deg, #74b9ff, #0984e3)',
        'linear-gradient(135deg, #fd79a8, #e84393)',
        'linear-gradient(135deg, #55efc4, #00b894)',
        'linear-gradient(135deg, #ffeaa7, #fdcb6e)',
        'linear-gradient(135deg, #a29bfe, #6c5ce7)'
    ];
    const color = colors[index % colors.length];
    
    col.innerHTML = `
        <div class="book-card">
            <div class="book-cover" style="background: ${color};">
                <i class="fas fa-book"></i>
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title || 'Unknown Title'}</h3>
                <p class="book-author">
                    <i class="fas fa-user"></i> ${book.author || 'Unknown Author'}
                </p>
                <div class="book-details">
                    <span><i class="fas fa-hashtag"></i> ${book.isbn || 'N/A'}</span>
                    <span><i class="fas fa-calendar"></i> ${book.year || 'N/A'}</span>
                </div>
                <div class="book-details">
                    <span><i class="fas fa-copy"></i> ${book.copies || 1} copies</span>
                    <span class="badge ${book.available ? 'bg-success' : 'bg-danger'}">
                        ${book.available ? 'Available' : 'Checked Out'}
                    </span>
                </div>
                <div class="book-actions">
                    <button class="btn-borrow" onclick="borrowBook(${book.id || index})">
                        <i class="fas fa-cart-plus"></i> Borrow
                    </button>
                    <button class="btn-details" onclick="showBookDetails(${book.id || index})">
                        <i class="fas fa-info-circle"></i> Details
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Load members from API
async function loadMembers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/members`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch members: ${response.status}`);
        }
        
        currentMembers = await response.json();
        displayMembers(currentMembers);
        
    } catch (error) {
        console.error('Error loading members:', error);
        
        // Mock data for demonstration
        currentMembers = getMockMembers();
        displayMembers(currentMembers);
    }
}

// Display members in table
function displayMembers(members) {
    const tbody = document.getElementById('membersBody');
    tbody.innerHTML = '';
    
    if (members.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-users fa-2x text-muted mb-3"></i>
                    <p class="text-muted">No members found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    members.forEach(member => {
        const row = document.createElement('tr');
        const typeClass = `member-${member.type ? member.type.toLowerCase() : 'student'}`;
        
        row.innerHTML = `
            <td>${member.id || 'N/A'}</td>
            <td><strong>${member.name || 'Unknown'}</strong></td>
            <td>${member.email || 'N/A'}</td>
            <td><span class="member-type ${typeClass}">${member.type || 'Student'}</span></td>
            <td>${member.join_date || 'N/A'}</td>
            <td><span class="badge bg-primary">${member.active_loans || 0}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Search books
async function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        currentPage = 1;
        loadBooks();
        return;
    }
    
    setLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`Search failed: ${response.status}`);
        }
        
        const results = await response.json();
        currentPage = 1;
        displayBooks(results);
        document.getElementById('loadMoreBtn').style.display = 'none';
        
        updateConnectionStatus(`Found ${results.length} results for "${query}"`, 'success');
        
    } catch (error) {
        console.error('Search error:', error);
        
        // Fallback to client-side search
        const filteredBooks = currentBooks.filter(book => 
            (book.title && book.title.toLowerCase().includes(query.toLowerCase())) ||
            (book.author && book.author.toLowerCase().includes(query.toLowerCase())) ||
            (book.isbn && book.isbn.toLowerCase().includes(query.toLowerCase()))
        );
        
        currentPage = 1;
        displayBooks(filteredBooks);
        document.getElementById('loadMoreBtn').style.display = 'none';
        
        updateConnectionStatus(`Found ${filteredBooks.length} local results for "${query}"`, 'info');
    }
    setLoading(false);
}

// Borrow a book (mock function)
function borrowBook(bookId) {
    if (confirm('Are you sure you want to borrow this book?')) {
        // In real implementation, this would call your API
        // fetch(`${API_BASE_URL}/api/borrow`, {
        //     method: 'POST',
        //     headers: {'Content-Type': 'application/json'},
        //     body: JSON.stringify({bookId: bookId})
        // });
        
        alert('Book borrowing functionality would connect to your database via API\n\nBook ID: ' + bookId);
        updateConnectionStatus('Book borrowing request sent (demo mode)', 'info');
    }
}

// Show book details (mock function)
function showBookDetails(bookId) {
    alert(`Book details for ID: ${bookId}\n\nIn a real implementation, this would show detailed information from your database.`);
}

// ==================== MOCK DATA ====================

function getMockBooks() {
    return [
        {
            id: 1,
            title: 'Database System Concepts',
            author: 'Abraham Silberschatz, Henry F. Korth',
            isbn: '978-0078022159',
            year: 2019,
            copies: 5,
            available: true
        },
        {
            id: 2,
            title: 'NoSQL Distilled',
            author: 'Martin Fowler, Pramod Sadalage',
            isbn: '978-0321826626',
            year: 2012,
            copies: 3,
            available: true
        },
        {
            id: 3,
            title: 'Graph Databases',
            author: 'Ian Robinson, Jim Webber',
            isbn: '978-1491930892',
            year: 2015,
            copies: 2,
            available: true
        },
        {
            id: 4,
            title: 'Refactoring',
            author: 'Martin Fowler',
            isbn: '978-0134757599',
            year: 2018,
            copies: 4,
            available: true
        },
        {
            id: 5,
            title: 'Designing Data-Intensive Applications',
            author: 'Martin Kleppmann',
            isbn: '978-1449373320',
            year: 2017,
            copies: 3,
            available: true
        },
        {
            id: 6,
            title: 'The Pragmatic Programmer',
            author: 'David Thomas, Andrew Hunt',
            isbn: '978-0201616224',
            year: 2019,
            copies: 2,
            available: false
        }
    ];
}

function getMockMembers() {
    return [
        {
            id: 1,
            name: 'John Smith',
            email: 'john.smith@uni.edu',
            type: 'Student',
            join_date: '2023-01-15',
            active_loans: 2
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah.j@uni.edu',
            type: 'Faculty',
            join_date: '2022-08-22',
            active_loans: 1
        },
        {
            id: 3,
            name: 'Mike Chen',
            email: 'mike.chen@uni.edu',
            type: 'Student',
            join_date: '2023-03-10',
            active_loans: 0
        },
        {
            id: 4,
            name: 'Dr. Robert Brown',
            email: 'rbrown@uni.edu',
            type: 'Faculty',
            join_date: '2021-11-05',
            active_loans: 3
        },
        {
            id: 5,
            name: 'Lisa Wang',
            email: 'lisa.w@uni.edu',
            type: 'Staff',
            join_date: '2023-02-28',
            active_loans: 1
        }
    ];
}
