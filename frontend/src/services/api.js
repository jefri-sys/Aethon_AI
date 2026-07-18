import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'https://aethon-ai-4dcd.onrender.com'}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aethon_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const vaultUnlocked = localStorage.getItem('vaultUnlocked');
  if (vaultUnlocked) {
    config.headers['X-Vault-Unlocked'] = 'true';
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get a 401 Unauthorized, clear the token and reload to force login
      // (Unless it's the login route itself failing)
      const isAuthRoute = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
      if (!isAuthRoute) {
        localStorage.removeItem('aethon_token');
        localStorage.removeItem('aethon_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
