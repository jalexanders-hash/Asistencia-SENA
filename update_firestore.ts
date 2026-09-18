import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import * as fs from 'fs';
import { courseData } from './src/data';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
const FICHA_ID = "3387401";
const docRef = doc(db, "fichas", FICHA_ID);

async function run() {
  await updateDoc(docRef, {
    equipo_instructores: courseData.equipo_instructores
  });
  console.log("Firestore updated!");
  process.exit(0);
}

run().catch(console.error);
