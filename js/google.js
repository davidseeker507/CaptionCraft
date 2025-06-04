
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";



const firebaseConfig = {
  apiKey: "AIzaSyDyfwhlxL55hdwctrwJRQtAWqdNcjh1GU4",
  authDomain: "captioncraft-c731e.firebaseapp.com",
  projectId: "captioncraft-c731e",
  storageBucket: "captioncraft-c731e.firebasestorage.app",
  messagingSenderId: "229224539124",
  appId: "1:229224539124:web:35c5fa944c79090d678fa1",
  measurementId: "G-3ETBFK9QLE"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

