/**
 * firebase.js
 * Inicialización de Firebase y exportación de instancias.
 * ÚNICO lugar donde vive la config — no tocar desde otros módulos.
 */

const firebaseConfig = {
  apiKey: "AIzaSyC2CyBcmqd4dhuNtIX2sjUk_dadwriF0x8",
  authDomain: "mtg-manager-2005.firebaseapp.com",
  projectId: "mtg-manager-2005",
  storageBucket: "mtg-manager-2005.firebasestorage.app",
  messagingSenderId: "310699881878",
  appId: "1:310699881878:web:dcb0f21e31434393f719b7",
  measurementId: "G-T3PQ24KKCF"
};

firebase.initializeApp(firebaseConfig);

export const fbAuth    = firebase.auth();
export const fbDb      = firebase.firestore();
export const fbStorage = firebase.storage();
