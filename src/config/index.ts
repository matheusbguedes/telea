export const API_URL = import.meta.env.VITE_API_URL || 'https://telea-server-production.up.railway.app';

export const config = {
  apiUrl: API_URL,
} as const;
