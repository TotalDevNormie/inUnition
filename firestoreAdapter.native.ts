import firestore from "@react-native-firebase/firestore";

export type Unsub = () => void;

export function setDoc(
  collectionName: string,
  id: string,
  data: Record<string, any>
) {
  return firestore().collection(collectionName).doc(id).set(data);
}

export function deleteDoc(
  collectionName: string,
  id: string
) {
  return firestore().collection(collectionName).doc(id).delete();
}

export function fetchAll(
  collectionName: string,
  userUid: string
) {
  return firestore()
    .collection(collectionName)
    .where("userUid", "==", userUid)
    .get();
}

export function listen(
  collectionName: string,
  userUid: string,
  onUpdate: () => void
): Unsub {
  return firestore()
    .collection(collectionName)
    .where("userUid", "==", userUid)
    .onSnapshot(onUpdate);
}
