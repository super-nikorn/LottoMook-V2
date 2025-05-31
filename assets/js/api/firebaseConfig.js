import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACvz8DwQOW_7WLzU5uvD6fpU0BI5MoZ_8",
  authDomain: "mylogin-e355f.firebaseapp.com",
  projectId: "mylogin-e355f",
  storageBucket: "mylogin-e355f.firebasestorage.app",
  messagingSenderId: "950589957571",
  appId: "1:950589957571:web:305596515b2446a7ec0976",
  measurementId: "G-V5KZS106Q1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

