import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBvOkBYAbFmxBzHxHQDetlzJOJ7rOiM5Hw",
  authDomain: "sistema-senhas-demo.firebaseapp.com",
  databaseURL: "https://sistema-senhas-demo-default-rtdb.firebaseio.com",
  projectId: "sistema-senhas-demo",
  storageBucket: "sistema-senhas-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:0123456789abcdef"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export default app;