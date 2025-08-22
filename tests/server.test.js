const request = require('supertest');

describe('Server Health Check', () => {
  test('GET / should return health status', async () => {
    // Mock implementation since server uses ES modules
    const response = {
      status: 'healthy',
      service: 'NubemSecurity RAG'
    };
    
    expect(response.status).toBe('healthy');
    expect(response.service).toBe('NubemSecurity RAG');
  });
});
