import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = 'http://127.0.0.1:8000/api'; // Update this to your API URL

const AuthContext = createContext(null);

export type User = {
  id: number;
  name: string;
  email: string;
};

export type RequestError = {
  message?: string;
  errors?: { [key: string]: string[] };
};

type AuthContextType = {
  user: User | null;
  isLoadingUser: boolean;
  isOnline: boolean;
  loginMutation: UseMutationResult;
  registerMutation: UseMutationResult;
  logoutMutation: UseMutationResult;
  syncUserData: () => Promise<void>;
};

export type AuthInfo = {
  email: string;
  password: string;
  device_name?: string;
};

const isWeb = Platform.OS === 'web';

const storage = isWeb ? localStorage : AsyncStorage;

const setStorageItem = async (key: string, value: string) => {
  if (isWeb) {
    storage.setItem(key, value);
  } else {
    await storage.setItem(key, value);
  }
};

const getStorageItem = async (key: string) => {
  if (isWeb) {
    return storage.getItem(key);
  } else {
    return await storage.getItem(key);
  }
};

const removeStorageItem = async (key: string) => {
  if (isWeb) {
    storage.removeItem(key);
  } else {
    await storage.removeItem(key);
  }
};

const setCookie = async (cookieString: string) => {
  if (!isWeb) {
    await SecureStore.setItemAsync('cookie', cookieString);
  }
};

const getCookie = async () => {
  if (!isWeb) {
    return await SecureStore.getItemAsync('cookie');
  }
  return null;
};

const clearCookie = async () => {
  if (!isWeb) {
    await SecureStore.deleteItemAsync('cookie');
  }
};

const getCsrfTokenFromCookie = () => {
  if (isWeb) {
    const cookies = document.cookie.split(';');
    console.log('cookies', document.cookie);
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        console.log(name);
        return decodeURIComponent(value);
      }
    }
  }
  return null;
};

const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  let csrfToken;
  if (isWeb) {
    csrfToken = getCsrfTokenFromCookie();
  } else {
    csrfToken = await getStorageItem('csrfToken');
  }
  
  const headers = new Headers(options.headers);
  console.log('works', isWeb);
  
  if (csrfToken) {
    console.log('csrfToken', csrfToken);
    headers.append('X-XSRF-TOKEN', csrfToken);
  }
  headers.append('Accept', 'application/json');
  headers.append('Content-Type', 'application/json');

  if (!isWeb) {
    const cookie = await getCookie();
    if (cookie) {
      headers.append('Cookie', cookie);
    }
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!isWeb) {
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      await setCookie(setCookieHeader);
    }
  }

  return response;
};


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkConnectivity = async () => {
      if (isWeb) {
        setIsOnline(navigator.onLine);
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));
      } else {
        const netInfoState = await NetInfo.fetch();
        setIsOnline(netInfoState.isConnected);
        const unsubscribe = NetInfo.addEventListener(state => {
          setIsOnline(state.isConnected);
        });
        return unsubscribe;
      }
    };

    checkConnectivity();

    return () => {
      if (isWeb) {
        window.removeEventListener('online', () => setIsOnline(true));
        window.removeEventListener('offline', () => setIsOnline(false));
      }
    };
  }, []);

 
  const getCsrfToken = async () => {
    if (isOnline) {
      try {
        await fetch(`${API_URL}/csrf-cookie`, {
          credentials: 'include',
        });
        
        if (isWeb) {
          // For web, the browser will automatically handle the cookie
        } else {
          // For mobile, we need to manually extract and store the token
          const csrfToken = await getStorageItem('XSRF-TOKEN');
          if (csrfToken) {
            await setStorageItem('csrfToken', csrfToken);
          }
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    }
  };

  const loginMutation = useMutation({
    mutationKey: ['user'],
    mutationFn: async (credentials: AuthInfo) => {
      if (isOnline) {
        await getCsrfToken(); // Ensure we have the latest CSRF token
        const response = await fetchWithCredentials(`${API_URL}/auth/login`, {
          method: 'POST',
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const data = await response.json() as RequestError;
          throw data ?? { message: response.statusText };
        }
        return await response.json();
      } else {
        throw new Error('Cannot login while offline');
      }
    },
    onSuccess: async (data) => {
      setUser(data.user);
      await setStorageItem('userData', JSON.stringify(data.user));
    },
  });

  const syncUserData = async () => {
    if (isOnline) {
      try {
        const response = await fetchWithCredentials(`${API_URL}/auth/me`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          await setStorageItem('userData', JSON.stringify(userData));
        } else {
          throw new Error('Failed to sync user data');
        }
      } catch (error) {
        console.error('Error syncing user data:', error);
      }
    }
  };


  const registerMutation = useMutation({
    mutationKey: ['user'],
    mutationFn: async (credentials: AuthInfo) => {
      if (isOnline) {
        await getCsrfToken();
        const response = await fetchWithCredentials(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          const data = await response.json() as RequestError;
          throw data ?? { message: response.statusText };
        }
        return await response.json();
      } else {
        throw new Error('Cannot register while offline');
      }
    },
    onSuccess: async (data) => {
      setUser(data.user);
      await setStorageItem('userData', JSON.stringify(data.user));
    },
  });

  const logoutMutation = useMutation({
    mutationKey: ['user'],
    mutationFn: async () => {
      if (isOnline) {
        const response = await fetchWithCredentials(`${API_URL}/auth/logout`, {
          method: 'POST',
        });

        if (!response.ok) {
          const data = await response.json() as RequestError;
          throw data ?? { message: response.statusText };
        }
      }
      return null;
    },
    onSuccess: async () => {
      setUser(null);
      await clearCookie();
      await removeStorageItem('userData');
      queryClient.invalidateQueries({
        queryKey: ['user'],
      });
    },
  });

  const { isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const storedUserData = await getStorageItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
        if (isOnline) {
          await syncUserData();
        }
        return userData;
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
    syncUserData,
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