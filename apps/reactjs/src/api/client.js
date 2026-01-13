class ApiClient {
  constructor(baseURL = process.env.REACT_APP_API_URL || '/api') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { data, status: response.status };
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      throw error;
    }
  }

  // Authentication endpoints
  async login(password) {
    return this.request('/login', {
      method: 'POST',
      body: { password },
    });
  }

  async logout() {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async createOrLoginUser(email, workspaceName) {
    return this.request('/users', {
      method: 'POST',
      body: { email, workspaceName },
    });
  }

  async getCurrentUser() {
    return this.request('/users/me', {
      method: 'GET',
    });
  }

  // Airbyte endpoints
  async getAirbyteToken(allowedOrigin = null) {
    return this.request('/airbyte/token', {
      method: 'POST',
      body: allowedOrigin ? { allowedOrigin } : {},
    });
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;