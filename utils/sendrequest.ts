import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const API_URL = 'http://127.0.0.1:8000/api';
export type RequestError = {
  message?: string;
  errors?: { [key: string]: string[] };
};

export default async function sendRequest<T>(
  url: string,
  options?: RequestInit,
  auth: boolean = false
): Promise<T> {
  let acccessToken: string | null = null;
  if (Platform.OS === 'web') {
    acccessToken = localStorage.getItem('access_token');
  } else {
    acccessToken = SecureStore.getItem('access_token');
  }

  const authHeader = auth ? { Authorization: `Bearer ${acccessToken}` } : {};
  if (!options) {
    options = {
      method: 'GET',
      headers: {
        Accepts: 'application/json',
        'Content-Type': 'application/json',
      },
    };
  } else {
    options = {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
    };
  }

  const response = await fetch(API_URL + url, options);
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      const data = (await response.json()) as RequestError;

      throw data ?? ({ message: response.statusText } as RequestError);
    }
    throw { message: response.statusText } as RequestError;
  }
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as unknown as T;
  }
  return (await response.text()) as unknown as T;
}
