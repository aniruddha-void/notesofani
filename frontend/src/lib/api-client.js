import axios from 'axios';

const DEFAULT_PROD_API = 'https://notesofani.onrender.com/api/v1';
const DEFAULT_PROD_BACKEND = 'https://notesofani.onrender.com';

function normalizeApiBaseUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) {
    return process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000/api/v1'
      : DEFAULT_PROD_API;
  }
  let url = rawUrl.trim().replace(/\/+$/, '');
  if (url.endsWith('/api/v1')) {
    return url;
  }
  if (url.endsWith('/api')) {
    return `${url}/v1`;
  }
  return `${url}/api/v1`;
}

function normalizeBackendUrl(rawBackendUrl, apiBaseUrl) {
  if (rawBackendUrl && rawBackendUrl.trim()) {
    return rawBackendUrl.trim().replace(/\/+$/, '');
  }
  return apiBaseUrl.replace(/\/api\/v1\/?$/, '');
}

const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
export const BACKEND_BASE_URL = normalizeBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL, API_BASE_URL);

export const getFileUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${BACKEND_BASE_URL}${cleanPath}`;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    const cleanPath = config.url.replace(/^\/+/, '');
    config.url = cleanPath;
  }
  return config;
});

export default apiClient;
