import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDGpF8zTzuL5wYjMxJxKxJxKxJxKxJxKxJ",
  authDomain: "sistema-senhas-realtime.firebaseapp.com",
  databaseURL: "https://sistema-senhas-realtime-default-rtdb.firebaseio.com",
  projectId: "sistema-senhas-realtime",
  storageBucket: "sistema-senhas-realtime.appspot.com",
  messagingSenderId: "987654321098",
  appId: "1:987654321098:web:abcdef0123456789"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export default app;