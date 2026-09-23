/**
 * Application Configuration
 * Reads VITE_API_URL from environment variables in production,
 * falling back to local backend during development.
 */
export const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
