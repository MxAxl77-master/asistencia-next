// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-Cpe4Ljw94UCLmbwUv9vFPhv3UbnIVfA",
  authDomain: "asistencia-next-5398e.firebaseapp.com",
  projectId: "asistencia-next-5398e",
  storageBucket: "asistencia-next-5398e.appspot.com",
  messagingSenderId: "1054299397968",
  appId: "1:1054299397968:web:fe9d98a7d9309cf99fd655",
  measurementId: "G-922PBM72HZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Iniciar sesión anónima para cumplir reglas de seguridad
signInAnonymously(auth).catch((error) => console.error("Auth Error:", error));

// Exportar las instancias para usarlas en otras partes de la app
export { db, auth };
