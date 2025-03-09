import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase, { initializeApp } from '@react-native-firebase/app';
import { Platform } from 'react-native';

export const initFirebase = () => {
  if (Platform.OS === 'web') {
    firebase.setReactNativeAsyncStorage(AsyncStorage);
    const firebaseConfig = {
      apiKey: 'AIzaSyCnWGoxigkecLpon1sPNtJqOBYFNxaZ-lI',
      authDomain: 'inunition.firebaseapp.com',
      projectId: 'inunition',
      storageBucket: 'inunition.firebasestorage.app',
      messagingSenderId: '1050891229502',
      appId: '1:1050891229502:web:527f5f513aca413c57f46f',
      measurementId: 'G-LCJ9RKD17N',
    };
    initializeApp(firebaseConfig);
  }
};
