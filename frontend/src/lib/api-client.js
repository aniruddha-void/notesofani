import axios from 'axios';

const DEFAULT_PROD_API = 'https://notesofani.onrender.com/api/v1';
const DEFAULT_PROD_BACKEND = 'https://notesofani.onrender.com';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000/api/v1'
    : DEFAULT_PROD_API);

export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/v1\/?$/, '')
    : (process.env.NODE_ENV === 'development'
        ? 'http://localhost:5000'
        : DEFAULT_PROD_BACKEND));

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
