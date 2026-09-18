import axios from 'axios';

const DEFAULT_PROD_API = 'https://notesofani.onrender.com/api/v1';
const DEFAULT_PROD_BACKEND = 'https://notesofani.onrender.com';

function getApiBaseUrl() {
  let url = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!url || !url.trim()) {
    return process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000/api/v1'
      : DEFAULT_PROD_API;
  }
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    if (url.endsWith('/api')) {
      url = `${url}/v1`;
    } else {
      url = `${url}/api/v1`;
    }
  }
  return url;
}

function getBackendBaseUrl() {
  let url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (url && url.trim()) {
    return url.trim().replace(/\/+$/, '');
  }
  const apiBase = getApiBaseUrl();
  return apiBase.replace(/\/api\/v1\/?$/, '');
}

const API_BASE_URL = getApiBaseUrl();
export const BACKEND_BASE_URL = getBackendBaseUrl();

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

export default apiClient;
