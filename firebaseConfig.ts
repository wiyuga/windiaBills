// src/lib/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCtFIJX0z9NL83N07goZhCyzepLjHJUjIk",
    authDomain: "windia-bills.firebaseapp.com",
    projectId: "windia-bills",
    storageBucket: "windia-bills.firebasestorage.app",
    messagingSenderId: "744020189435",
    appId: "1:744020189435:web:bf0801da19cd2310f3905e"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
