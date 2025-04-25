import { db } from "./firebaseConfig";
import {
  collection,
  doc,
  setDoc as webSetDoc,
  deleteDoc as webDeleteDoc,
  getDocs,
  query,
  where,
  onSnapshot as webOnSnapshot,
  QuerySnapshot
} from "firebase/firestore";

export type Unsub = () => void;

export function setDoc(
  collectionName: string,
  id: string,
  data: Record<string, any>
) {
  const d = doc(db, collectionName, id);
  return webSetDoc(d, data);
}

export function deleteDoc(
  collectionName: string,
  id: string
) {
  const d = doc(db, collectionName, id);
  return webDeleteDoc(d);
}

export function fetchAll(
  collectionName: string,
  userUid: string
): Promise<QuerySnapshot> {
  const q = query(
    collection(db, collectionName),
    where("userUid", "==", userUid)
  );
  return getDocs(q);
}

export function listen(
  collectionName: string,
  userUid: string,
  onUpdate: () => void
): Unsub {
  const q = query(
    collection(db, collectionName),
    where("userUid", "==", userUid)
  );
  return webOnSnapshot(q, onUpdate);
}
