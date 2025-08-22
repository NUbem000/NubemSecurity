/**
 * Demo credentials configuration
 * These should never be hardcoded in production
 */

export const getDemoCredentials = () => {
  if (process.env.NODE_ENV === 'production') {
    return {
      username: process.env.DEMO_USERNAME || null,
      password: process.env.DEMO_PASSWORD || null,
      apiKey: process.env.DEMO_API_KEY || null,
      enabled: process.env.ENABLE_DEMO === 'true'
    };
  }
  
  // Only for development
  return {
    username: 'demo',
    password: 'demo123',
    apiKey: 'demo_key',
    enabled: true
  };
};
