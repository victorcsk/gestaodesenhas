// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Configuração do Firebase (substitua pelas suas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com/",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxxxxxxxxxxxx"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Realtime Database
export const database = getDatabase(app);