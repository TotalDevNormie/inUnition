import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './authContext';

const API_URL = 'https://your-api-url.com';

export const useLogin = () => {
  const { login } = useAuth();

  return useMutation(
    async (credentials) => {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      return data.token;
    },
    {
      onSuccess: (token) => {
        login(token);
      },
    }
  );
};

export const useLogout = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const authFetch = useAuthFetch();

  return useMutation(
    () => authFetch('/logout', { method: 'POST' }),
    {
      onSuccess: () => {
        logout();
        queryClient.clear(); // Clear all queries from the cache
      },
    }
  );
};