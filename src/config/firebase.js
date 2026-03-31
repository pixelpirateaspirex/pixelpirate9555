import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyCYvBLNI39A_w7ty5CUjTLeQu-qeOIhfDE",
  authDomain:        "pixel-pirates-ce183.firebaseapp.com",
  projectId:         "pixel-pirates-ce183",
  storageBucket:     "pixel-pirates-ce183.firebasestorage.app",
  messagingSenderId: "704791239348",
  appId:             "1:704791239348:web:36d27feb87ef2c38f1d5e1",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
export default app;