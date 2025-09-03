// Firebase config & initialization
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "xxx",
  authDomain: "xxx.firebaseapp.com",
  projectId: "vitparsel",
  // diğer configler...
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
