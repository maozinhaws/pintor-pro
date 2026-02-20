import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Substituir pela sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDxSqHbuiDBEZJ4B05p18eT4_iZK_wmrU4",
  authDomain: "orcamento-app-pintor.firebaseapp.com",
  projectId: "orcamento-app-pintor",
  storageBucket: "orcamento-app-pintor.firebasestorage.app",
  messagingSenderId: "290456904743",
  appId: "1:290456904743:web:da539006fef01524ea1a02",
  measurementId: "G-ERMCR2XL0S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;