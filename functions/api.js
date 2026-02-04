// Cloudflare Worker API for Library Database
// Save this as api.js in Cloudflare Workers

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://budhathokiabhishek.com.np',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route requests
      switch (path) {
        case '/api/books':
          return await handleBooks(request, env, corsHeaders);
        case '/api/members':
          return await handleMembers(request, env, corsHeaders);
        case '/api/search':
          return await handleSearch(request, env, corsHeaders, url);
        case '/api/stats':
          return await handleStats(request, env, corsHeaders);
        case '/api/borrow':
          return await handleBorrow(request, env, corsHeaders);
        case '/health':
          return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        default:
          return new Response(JSON.stringify({ message: 'Library API v1.0' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
      }
    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// Database connection helper
async function getDatabaseConnection(env) {
  // For MySQL connection - set these in Cloudflare Environment Variables
  const config = {
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT || 3306,
  };

  // If you're using Cloudflare D1 (SQLite) instead:
  // return env.DB;

  // For this example, we'll use mock data
  // In production, you would use: const mysql = await import('mysql2/promise');
  return null;
}

// Mock data for demonstration
const mockBooks = [
  {
    id: 1,
    title: 'Database System Concepts',
    author: 'Abraham Silberschatz, Henry F. Korth',
    isbn: '978-0078022159',
    year: 2019,
    copies: 5,
    available: true,
  },
  // Add more mock books...
];

const mockStats = {
  total_books: 42,
  total_members: 15,
  active_loans: 8,
  overdue_books: 2,
};

// API handlers
async function handleBooks(request, env, corsHeaders) {
  try {
    // In production: query real database
    // const db = await getDatabaseConnection(env);
    // const [rows] = await db.query('SELECT * FROM books WHERE available = 1');
    
    return new Response(JSON.stringify(mockBooks), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

async function handleMembers(request, env, corsHeaders) {
  // Mock members data
  const mockMembers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@uni.edu',
      type: 'Student',
      join_date: '2023-01-15',
      active_loans: 2,
    },
    // Add more mock members...
  ];

  return new Response(JSON.stringify(mockMembers), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleSearch(request, env, corsHeaders, url) {
  const query = url.searchParams.get('q') || '';
  
  // Mock search
  const results = mockBooks.filter(book =>
    book.title.toLowerCase().includes(query.toLowerCase()) ||
    book.author.toLowerCase().includes(query.toLowerCase()) ||
    book.isbn.includes(query)
  );

  return new Response(JSON.stringify(results), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleStats(request, env, corsHeaders) {
  return new Response(JSON.stringify(mockStats), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleBorrow(request, env, corsHeaders) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json();
    const bookId = body.bookId;
    
    // In production: update database
    // const db = await getDatabaseConnection(env);
    // await db.query('UPDATE books SET copies = copies - 1 WHERE id = ?', [bookId]);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Book borrowed successfully',
      bookId: bookId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to borrow book' }), {
      status: 400,
      headers: corsHeaders,
    });
  }
}
