import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// JO ABHI COPY KIYA WO YAHAN PASTE KAR
const firebaseConfig = {
  apiKey: "AIzaSyBUP83LY0J1jtkqo_8vf2nhGtmHHfg8pYw",
  authDomain: "trolley-shop.firebaseapp.com",
  projectId: "trolley-shop",
  storageBucket: "trolley-shop.firebasestorage.app",
  messagingSenderId: "1032789464105",
  appId: "1:1032789464105:web:e4937c094e0eca8759b838"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);