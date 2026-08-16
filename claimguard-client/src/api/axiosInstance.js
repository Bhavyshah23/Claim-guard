import axios from 'axios';

export const AUTH_STORAGE_KEY = 'claimguard_user';

function readStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = readStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only treat a 401 as session expiry when the backend did NOT return a
    // business error body. AuthException responses carry a `message`
    // (e.g. "Username is already taken") and must surface in the UI, not
    // silently log the user out. A real expired/invalid JWT comes back as a
    // bare 401 from Spring Security (no JSON body).
    const data = error.response?.data;
    const hasBusinessBody =
      Boolean(data) &&
      (typeof data.message === 'string' ||
        (data.errors && typeof data.errors === 'object'));

    if (error.response?.status === 401 && !hasBusinessBody) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
