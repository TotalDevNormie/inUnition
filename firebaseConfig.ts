import { initializeApp as initializeAppNative } from '@react-native-firebase/app';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCnWGoxigkecLpon1sPNtJqOBYFNxaZ-lI',
  authDomain: 'inunition.firebaseapp.com',
  projectId: 'inunition',
  storageBucket: 'inunition.appspot.com',
  messagingSenderId: '1050891229502',
  appId: '1:1050891229502:web:527f5f513aca413c57f46f',
  measurementId: 'G-LCJ9RKD17N',
  databaseURL: 'https://inunition-default-rtdb.firebaseio.com',
};

const app = initializeApp(firebaseConfig);
initializeAppNative(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
