import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCqiTei6BM3t1IXlWYtAdNZNu_TNjDWj3M",
  authDomain: "meme-storage-app.firebaseapp.com",
  projectId: "meme-storage-app",
  storageBucket: "meme-storage-app.firebasestorage.app",
  messagingSenderId: "132915718362",
  appId: "1:132915718362:web:3d58313bf3d21257861de3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app; 