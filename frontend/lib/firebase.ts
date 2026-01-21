'use client';

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
// (Provided by you – normally keep this in env vars)
const firebaseConfig = {
  apiKey: 'AIzaSyCt0lgbAlZP2_77B0gQ2A28-UMDdXvaySc',
  authDomain: 'intern-c736f.firebaseapp.com',
  projectId: 'intern-c736f',
  storageBucket: 'intern-c736f.firebasestorage.app',
  messagingSenderId: '819816147428',
  appId: '1:819816147428:web:5ef434b32f2900d0dbfff1',
  measurementId: 'G-Z7BS7GMPFJ',
};

// Initialize Firebase (singleton)
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

