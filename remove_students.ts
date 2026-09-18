import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const idsToRemove = ["1011399073", "1027943573"];

const run = async () => {
  console.log("Removing from Firestore...");
  const docRef = doc(db, "fichas", "3387401");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    const originalLen = data.asistencias_aprendices.length;
    data.asistencias_aprendices = data.asistencias_aprendices.filter((s: any) => !idsToRemove.includes(s.numero_documento));
    
    await updateDoc(docRef, { asistencias_aprendices: data.asistencias_aprendices });
    console.log(`Removed from Firestore. Original: ${originalLen}, New: ${data.asistencias_aprendices.length}`);
  } else {
    console.log("Document not found in Firestore.");
  }

  console.log("Removing from local src/data.ts...");
  let dataContent = fs.readFileSync('src/data.ts', 'utf8');
  // We'll just extract the object, but wait, data.ts is exported as JS.
  // We can do a string replace, or we can just let TSX rewrite it, but string replace might be safer.
  // Actually, I can just use a regex or string manipulation.
  
  process.exit(0);
};

run();
