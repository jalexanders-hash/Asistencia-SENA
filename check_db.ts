import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const check = async () => {
  const docRef = doc(db, "fichas", "3387401");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log("Fechas por instructor:");
    console.log(JSON.stringify(data.fechas_por_instructor, null, 2));
  } else {
    console.log("Document not found!");
  }
  process.exit(0);
};

check();
