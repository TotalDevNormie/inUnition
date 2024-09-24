import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import NetInfo from '@react-native-community/netinfo';
import { Platform } from "react-native";
import { jwtDecode } from "jwt-decode";
import sendRequest, { RequestError } from "../../functions/sendrequest";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { err } from "react-native-svg";



const AuthContext = createContext(null);

type AuthContextType = {
  user: any
  isLoadingUser: boolean
  loginMutation: any
  // registerMutation: any
  // logoutMutation: any
  isOnline: boolean
}

export type CredentialsType = {
  name: string,
  email: string,
  password: string,
  password_confirmation: string;
}

export type LoginCredentaialsType = Pick<CredentialsType, 'email' | 'password'>;

type UserResponseType = {
  user: { [key: string]: any } | null,
  access_token: string | null,
  refresh_token: string | null,
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected as boolean);
    });

    return () => unsubscribe();
  }, []);


  const makeAuthendicatedRequest = async (url, options) => {
    if (!isOnline) {
      console.log('Offline, queue request');
      // implement queuing requests when offline
      return;
    }
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  }

  const { isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['user'],

    queryFn: async () => {
      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      let user = null;
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData !== null) {
          user = JSON.parse(userData);
        }
      } catch (err) {

      }
      if (user) {
        setUser(user);
      }
      if (!isOnline) return;

      if (Platform.OS === 'web') {
        accessToken = localStorage.getItem('access-token');
        refreshToken = localStorage.getItem('refresh-token');
      } else {
        accessToken = SecureStore.getItem('access-token');
        refreshToken = SecureStore.getItem('refresh-token');
      }


      console.log('fetching user...')

      if (!accessToken && !refreshToken) {
        console.log('No acces token');
        throw {
          message: 'No access token or refresh token found',
        } as RequestError;
      }

      const decodedAccessToken = jwtDecode(accessToken);

      if (decodedAccessToken.exp * 1000 < Date.now() && refreshToken) {
        try {

          const newTokenData = await sendRequest<UserResponseType>('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (Platform.OS === 'web') {
            localStorage.setItem('access-token', newTokenData.access_token);
            localStorage.setItem('refresh-token', newTokenData.refresh_token);
          } else {
            SecureStore.setItem('access-token', newTokenData.access_token);
            SecureStore.setItem('refresh-token', newTokenData.refresh_token);
          }
        } catch (err) {
          console.log(err);
        }
      }

      const data = await sendRequest<UserResponseType>('/auth/me', {
        method: 'POST',
        body: JSON.stringify({ token: accessToken }),
      });

      AsyncStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    },
  });

  const loginMutation = useMutation({
    mutationKey: ['user'],

    mutationFn: async (requset: LoginCredentaialsType) => {

      const data = await sendRequest<UserResponseType>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(requset),
      });

      setUser(data.user);
      AsyncStorage.setItem('user', JSON.stringify(data.user));

      if (data.access_token && data.refresh_token) {
        if (Platform.OS === 'web') {
          localStorage.setItem('access-token', data.access_token);
          localStorage.setItem('refresh-token', data.refresh_token);
        } else {
          SecureStore.setItem('access-token', data.access_token);
          SecureStore.setItem('refresh-token', data.refresh_token);
        }
      }

      return data.user;
    }, onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  const registerMutation = useMutation({
    mutationKey: ['user'],
    mutationFn: async (requset: CredentialsType) => {
      const data = await sendRequest<UserResponseType>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(requset),
      });

      setUser(data.user);
      AsyncStorage.setItem('user', JSON.stringify(data.user));
      if (data.access_token && data.refresh_token) {
        if (Platform.OS === 'web') {
          localStorage.setItem('access-token', data.access_token);
          localStorage.setItem('refresh-token', data.refresh_token);
        } else {
          SecureStore.setItem('access-token', data.access_token);
          SecureStore.setItem('refresh-token', data.refresh_token);
        }
      }
      return data.user
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });


  const logoutMutation = useMutation({
    mutationKey: ['user'],
    mutationFn: async () => {
      AsyncStorage.removeItem('user');
      return null;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setUser(null);
      await SecureStore.deleteItemAsync('acces_token');
      await SecureStore.deleteItemAsync('refresh_token');
    }
  });

  const value = {
    user,
    isLoadingUser,
    loginMutation,
    registerMutation,
    logoutMutation,
    isOnline,
  } as AuthContextType;

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext<AuthContextType | null>(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}