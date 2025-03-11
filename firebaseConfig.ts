import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCnWGoxigkecLpon1sPNtJqOBYFNxaZ-lI',
  authDomain: 'inunition.firebaseapp.com',
  projectId: 'inunition',
  storageBucket: 'inunition.firebasestorage.app',
  messagingSenderId: '1050891229502',
  appId: '1:1050891229502:web:527f5f513aca413c57f46f',
  measurementId: 'G-LCJ9RKD17N',
  databaseURL: 'https://inunition.firebaseio.com',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
