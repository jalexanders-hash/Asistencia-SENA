import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { courseData } from './src/data';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const sync = async () => {
  console.log("Syncing to Firestore...");
  const docRef = doc(db, "fichas", "3387401");
  await setDoc(docRef, courseData);
  console.log("Sync complete.");
  process.exit(0);
};

sync();
