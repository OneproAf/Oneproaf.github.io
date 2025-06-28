// Configuration for API endpoints
const config = {
  // API Base URL - automatically switches between development and production
  get apiBaseUrl() {
    // Check if we're in development (localhost) or production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'https://oneproaf-github-io.onrender.com';
    } else {
      // Production URL - your live Render backend
      return 'https://oneproaf-github-io.onrender.com';
    }
  },

  // Helper function to build full API URLs
  apiUrl(endpoint) {
    return `${this.apiBaseUrl}${endpoint}`;
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
} 