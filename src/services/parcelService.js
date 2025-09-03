import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Firestore'dan tüm parselleri çek
export async function getParcels() {
  const snapshot = await getDocs(collection(db, "parcels"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
