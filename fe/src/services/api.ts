import axios from 'axios';
import { getAuth } from "firebase/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log('API_BASE_URL:', API_BASE_URL);


interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
}
// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('firebaseToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const getAuthHeader = () => {
  const token = localStorage.getItem('firebaseToken');
  return { Authorization: `Bearer ${token}` };
};

export const cartService = {
  // Sửa thành không nhận tham số
getCart: async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Người dùng chưa đăng nhập Firebase");
    }

    // Lấy token trực tiếp từ Firebase (không cần localStorage)
    const token = await user.getIdToken();

    return axios.get(`${API_BASE_URL}/cart`, {
      headers: { 
        Authorization: `Bearer ${token}` 
      }
    });
  },
  addToCart: (item: CartItem) => api.post('/cart/add', item),
  updateCartItem: (data: { productId: string; size: string; quantity: number }) => {
    return axios.put(`${API_BASE_URL}/cart/update`, data, {
      headers: getAuthHeader()
    });
  },

  // Xóa sản phẩm
  removeFromCart: (data: { productId: string; size: string }) => {
    // Với DELETE request, data thường nằm trong mục data của config
    return axios.delete(`${API_BASE_URL}/cart/remove`, {
      headers: getAuthHeader(),
      data: data 
    });
  }
};

// Bạn cũng có thể xuất luôn orderService ở đây để dùng cho bước sau
export const orderService = {
  createOrder: (orderData: any) => api.post('/orders', orderData),
  getMyOrders: () => {
  // 1. Lấy token từ Local Storage
  const token = localStorage.getItem('firebaseToken'); 

  return api.get('/orders/my-orders', {
    headers: {
      // 2. Gắn vào Header theo đúng định dạng mà Middleware Backend yêu cầu
      Authorization: `Bearer ${token}` 
    }
  });
},
  getOrderDetail: (id: string) => api.get(`/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => {
    return api.put(`/orders/${id}/status`, { status });
  },
  getAllOrders: () => api.get('/orders/all'),
};

export default api;

