import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    authenticated: false,
  });

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        setAuthState({
          token: token,
          authenticated: true,
        });
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  };

  const login = async (token) => {
    try {
      await AsyncStorage.setItem('token', token);
      setAuthState({
        token: token,
        authenticated: true,
      });
    } catch (error) {
      console.error('Error storing token:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setAuthState({
        token: null,
        authenticated: false,
      });
    } catch (error) {
      console.error('Error removing token:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);