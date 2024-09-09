import { useAuth } from './authContext';

const API_URL = 'https://your-api-url.com';

const useAuthFetch = () => {
  const { authState } = useAuth();

  const authFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authState.token) {
      headers['Authorization'] = `Bearer ${authState.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  };

  return authFetch;
};

export default useAuthFetch;