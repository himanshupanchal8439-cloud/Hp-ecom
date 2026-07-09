// API Client for HIM-STORE Frontend

const API_BASE_URL = '/api';

// Store token in localStorage
function setToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  }
}

function getToken() {
  return localStorage.getItem('authToken');
}

function clearToken() {
  localStorage.removeItem('authToken');
}

// Make API requests with auth header
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  const token = getToken();
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth APIs
async function register(email, password, fullName) {
  const data = await apiCall('/auth/register', 'POST', {
    email,
    password,
    fullName
  });
  setToken(data.token);
  return data;
}

async function login(email, password) {
  const data = await apiCall('/auth/login', 'POST', {
    email,
    password
  });
  setToken(data.token);
  return data;
}

function logout() {
  clearToken();
}

// Products APIs
async function getProducts(page = 1, limit = 12) {
  return apiCall(`/products?page=${page}&limit=${limit}`, 'GET');
}

async function getProductById(id) {
  return apiCall(`/products/${id}`, 'GET');
}

async function createProduct(product) {
  return apiCall('/products', 'POST', product);
}

async function updateProduct(id, product) {
  return apiCall(`/products/${id}`, 'PUT', product);
}

async function deleteProduct(id) {
  return apiCall(`/products/${id}`, 'DELETE');
}

// Cart APIs
async function addToCart(productId, quantity) {
  return apiCall('/cart', 'POST', { productId, quantity });
}

async function getCart() {
  return apiCall('/cart', 'GET');
}

async function updateCartItem(itemId, quantity) {
  return apiCall(`/cart/${itemId}`, 'PUT', { quantity });
}

async function removeFromCart(itemId) {
  return apiCall(`/cart/${itemId}`, 'DELETE');
}

async function clearCart() {
  return apiCall('/cart', 'DELETE');
}

// Orders APIs
async function createOrder(shippingAddress, paymentMethod) {
  return apiCall('/orders', 'POST', { shippingAddress, paymentMethod });
}

async function getUserOrders() {
  return apiCall('/orders', 'GET');
}

async function getOrderDetails(orderId) {
  return apiCall(`/orders/${orderId}`, 'GET');
}

async function updateOrderStatus(orderId, status) {
  return apiCall(`/orders/${orderId}`, 'PUT', { status });
}

// Payments APIs
async function createPaymentIntent(orderId) {
  return apiCall('/payments/create-intent', 'POST', { orderId });
}

async function confirmPayment(paymentIntentId, orderId) {
  return apiCall('/payments/confirm', 'POST', { paymentIntentId, orderId });
}

async function getPaymentStatus(orderId) {
  return apiCall(`/payments/${orderId}`, 'GET');
}

// Admin APIs
async function getDashboardStats() {
  return apiCall('/admin/stats', 'GET');
}

async function getAllOrders(status = null, page = 1, limit = 20) {
  let endpoint = `/admin/orders?page=${page}&limit=${limit}`;
  if (status) endpoint += `&status=${status}`;
  return apiCall(endpoint, 'GET');
}

async function getAllUsers(page = 1, limit = 20) {
  return apiCall(`/admin/users?page=${page}&limit=${limit}`, 'GET');
}

async function getInventoryStatus() {
  return apiCall('/admin/inventory', 'GET');
}

async function getSalesAnalytics() {
  return apiCall('/admin/analytics', 'GET');
}

// Export all functions
window.API = {
  // Auth
  register,
  login,
  logout,
  getToken,
  setToken,
  
  // Products
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  
  // Cart
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  
  // Orders
  createOrder,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus,
  
  // Payments
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  
  // Admin
  getDashboardStats,
  getAllOrders,
  getAllUsers,
  getInventoryStatus,
  getSalesAnalytics
};
