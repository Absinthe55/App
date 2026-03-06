import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCw5SWA0IphZg1DcvpwuybWgaPabs3ewfc",
    authDomain: "titan-makina-gorev.firebaseapp.com",
    projectId: "titan-makina-gorev",
    storageBucket: "titan-makina-gorev.firebasestorage.app",
    messagingSenderId: "862140750370",
    appId: "1:862140750370:web:56dc5ec496b91e95ab887b",
    measurementId: "G-V94D98HRK2"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
