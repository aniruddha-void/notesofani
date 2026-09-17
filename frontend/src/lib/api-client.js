import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

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
