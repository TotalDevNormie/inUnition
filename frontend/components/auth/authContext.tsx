import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

const API_URL = 'http://127.0.0.1:8000/api/auth';

const AuthContext = createContext(null);

export type User = {
  id: number;
  name: string;
  email: string;
  password: string;
};

export type RequestError = {
  message?: string;
  messages?: { [key: string]: string[] };
}

type AuthContextType = {
  user: User | null;
  isLoadingUser: boolean;
  isOnline: boolean;
  loginMutation: UseMutationResult;
  registerMutation: UseMutationResult;
  logoutMutation: UseMutationResult;
}

export type AuthInfo = Pick<User, 'email' | 'password'>;

export const AuthProvider = ({ children }) => {
  // const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const loginMutation = useMutation({
    mutationKey: ['user'],
    mutationFn: async (credentials: AuthInfo) => {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const data = await (response.json()) as RequestError;;
        throw data ?? {message: response.statusText};
      } 
      const data = await response.json();

      return data;
    },

    onSuccess: (data) => {
      AsyncStorage.setItem('user', JSON.stringify(data.user));
      AsyncStorage.setItem('token', data.token);
    },
  });

  const registerMutation = useMutation({
    mutationKey: ['user'],
    mutationFn: async (credentials: AuthInfo) => {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok){
        const data = await (response.json()) as RequestError;
        throw data ?? {message: response.statusText};
      }
      const data = await response.json();
      return data;
    },

    onSuccess: (data) => {
      AsyncStorage.setItem('user', JSON.stringify(data.user));
      AsyncStorage.setItem('token', data.token);
    },

  });

  const logoutMutation = useMutation({
    mutationKey: ['user'],
    mutationFn: async () => {
      if (isOnline) {
        const response = await fetch(`${API_URL}/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${user.token}` } });

        if (!response.ok) {
          const data = await (response.json()) as RequestError;
          throw data ?? {message: response.statusText};
        }
      }
      return null;
    },
    onSuccess: () => {
      // setUser(null);
      AsyncStorage.removeItem('user');
      AsyncStorage.removeItem('token');
      queryClient.invalidateQueries({
        queryKey: ['user'],
      });
    },
  });

  const { isLoading: isLoadingUser, data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      if (storedUser && storedToken) {
        // setUser(JSON.parse(storedUser));

        if (isOnline) {
          const response = await fetch(`${API_URL}/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          if (!response.ok) {
            // setUser(null);
            AsyncStorage.removeItem('user');
            AsyncStorage.removeItem('token');
            throw data ?? response.statusText;
          }
          // setUser(data.user);
          AsyncStorage.setItem('user', JSON.stringify(data.user));
          return data.user;
        }
      }

      return null;
    },
  });

  const value: AuthContextType = {
    user,
    isLoadingUser,
    isOnline,
    loginMutation,
    registerMutation,
    logoutMutation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext<AuthContextType | null>(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};