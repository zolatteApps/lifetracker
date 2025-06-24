// Utility function to get the correct API URL based on environment
export const getApiUrl = () => {
  // Check if we have a custom API URL set (for development)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development (localhost:3000), use Express server on localhost:5000
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  
  // For Vercel deployments, use relative URLs (same domain)
  // Vercel serves API routes from /api directory as serverless functions
  return '';
};