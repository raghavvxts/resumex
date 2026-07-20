/**
 * Centralized Environment Configuration
 * 
 * Do not use `import.meta.env` directly in React components.
 * Import from this config file instead.
 */

export const environment = {
  apiUrl: (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, ""),
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
};
