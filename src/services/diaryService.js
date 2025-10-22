import { db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
} from "firebase/firestore";

const formatDate = (date) =>
  date.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export const saveDiary = async (uid, date, mood, note) => {
  if (!uid || !date) return;
  const key = formatDate(date);
  await setDoc(doc(db, "diaries", uid, "entries", key), {
    mood,
    note,
    date: key,
    createdAt: new Date(),
  });
};

export const getDiary = async (uid, date) => {
  if (!uid || !date) return null;
  const key = formatDate(date);
  const docSnap = await getDoc(doc(db, "diaries", uid, "entries", key));
  return docSnap.exists() ? docSnap.data() : null;
};

export const listenDiaries = (uid, callback) => {
  if (!uid) return () => {};
  const colRef = collection(db, "diaries", uid, "entries");

  return onSnapshot(colRef, (snapshot) => {
    const data = {};
    snapshot.forEach((doc) => {
      data[doc.id] = doc.data();
    });
    callback(data);
  });
};