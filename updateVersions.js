import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Usar la misma configuración que tu app
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const updateVersions = async () => {
  try {
    // Generar versión usando fecha
    const now = new Date();
    const newVersion = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.${now.getTime()}`;

    // Actualizar version.json
    const versionPath = join(__dirname, 'public', 'version.json');
    writeFileSync(versionPath, JSON.stringify({
      version: newVersion,
      deployedAt: now.toISOString()
    }, null, 2));

    // Actualizar Firebase usando compat
    const firestore = firebase.firestore();
    await firestore.doc('config/version').set({
      current: newVersion,
      forceReload: true,
      lastUpdate: now,
      deployedAt: now
    });

    // console.log(`✅ Deploy version ${newVersion} actualizada con éxito`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando versiones:', error);
    process.exit(1);
  }
};

updateVersions();